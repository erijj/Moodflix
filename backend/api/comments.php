<?php
// ============================================
//  gere les Comments sur les films
//  api/comments.php
//  GET    /api/comments.php?movie_id=X&page=1  → paginated comments
//  POST   /api/comments.php                    → add comment { movie_id, content }
//  DELETE /api/comments.php                    → delete own comment { comment_id }
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

session_start();
require_once __DIR__ . '/config.php';

$user   = requireAuth();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

const COMMENTS_PER_PAGE = 10;

// ── GET lire les commentaires d'un film 
if ($method === 'GET') {

    $movie_id = trim($_GET['movie_id'] ?? '');

    $stmt=$db->prepare(
        'SELECT c.id,c.content,c.created_at, u.username
        FROM comments c
        JOIN users u ON u.id=c.user_id
        Where c.movie_id=?
        ORDER BY c.created_at DESC'
    );
    $stmt->execute([$movie_id]);

    jsonResponse(['comments' => $stmt->fetchAll()]);
}

// ── POST — add a comment ───────────────────
if ($method === 'POST') {
    $movie_id = trim($body['movie_id'] ?? '');
    $content  = trim($body['content']  ?? '');

    if (!$movie_id) jsonResponse(['error' => 'movie_id is required.'], 400);
    if (!$content)  jsonResponse(['error' => 'Comment cannot be empty.'], 400);
    if (mb_strlen($content) > 1000) {
        jsonResponse(['error' => 'Comment is too long (max 1000 characters).'], 400);
    }

    $stmt = $db->prepare(
        'INSERT INTO comments (user_id, movie_id, content) VALUES (?, ?, ?)'
    );
    $stmt->execute([$user['id'], $movie_id, $content]);
    $id = $db->lastInsertId();

    jsonResponse([
        'success'    => true,
        'message'    => 'Comment added!',
        'comment'    => [
            'id'         => (int)$id,
            'content'    => $content,
            'username'   => $user['username'],
            'created_at' => date('Y-m-d H:i:s'),
            'is_mine'    => true,
        ],
    ], 201);
}

// ── DELETE — remove own comment ────────────
if ($method === 'DELETE') {
    $comment_id = (int)($body['comment_id'] ?? 0);
    if (!$comment_id) jsonResponse(['error' => 'comment_id is required.'], 400);

    // Only the author can delete
    $stmt = $db->prepare('DELETE FROM comments WHERE id = ? AND user_id = ?');
    $stmt->execute([$comment_id, $user['id']]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Comment not found or you are not the author.'], 404);
    }
    jsonResponse(['success' => true, 'message' => 'Comment deleted.']);
}

jsonResponse(['error' => 'Method not allowed.'], 405);