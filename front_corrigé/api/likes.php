<?php
// ============================================
//  MOODFLIX — Likes API
//  api/likes.php
//  GET    /api/likes.php              → all liked movies for user
//  GET    /api/likes.php?movie_id=X   → like status + count for one movie
//  POST   /api/likes.php              → like/dislike { movie_id, liked: true|false }
//  DELETE /api/likes.php              → remove like entirely { movie_id }
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

// ── GET ────────────────────────────────────
if ($method === 'GET') {

    // Single movie status
    if (!empty($_GET['movie_id'])) {
        $movie_id = $_GET['movie_id'];

        // User's personal like status
        $stmt = $db->prepare('SELECT liked FROM likes WHERE user_id = ? AND movie_id = ?');
        $stmt->execute([$user['id'], $movie_id]);
        $row = $stmt->fetch();

        // Total likes count for this movie
        $stmt2 = $db->prepare('SELECT COUNT(*) as total_likes FROM likes WHERE movie_id = ? AND liked = 1');
        $stmt2->execute([$movie_id]);
        $count = $stmt2->fetch()['total_likes'];

        jsonResponse([
            'movie_id'    => $movie_id,
            'user_liked'  => $row ? (bool)$row['liked'] : null,
            'total_likes' => (int)$count,
        ]);
    }

    // All liked movies for user
    $stmt = $db->prepare(
        'SELECT movie_id, liked, created_at FROM likes WHERE user_id = ? ORDER BY created_at DESC'
    );
    $stmt->execute([$user['id']]);
    jsonResponse(['likes' => $stmt->fetchAll()]);
}

// ── POST — like or dislike ─────────────────
if ($method === 'POST') {
    $movie_id = trim($body['movie_id'] ?? '');
    $liked    = isset($body['liked']) ? (bool)$body['liked'] : true;

    if (!$movie_id) jsonResponse(['error' => 'movie_id is required.'], 400);

    // Upsert: insert or update existing
    $stmt = $db->prepare(
        'INSERT INTO likes (user_id, movie_id, liked)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE liked = VALUES(liked), created_at = CURRENT_TIMESTAMP'
    );
    $stmt->execute([$user['id'], $movie_id, $liked ? 1 : 0]);

    // Return updated count
    $stmt2 = $db->prepare('SELECT COUNT(*) as total_likes FROM likes WHERE movie_id = ? AND liked = 1');
    $stmt2->execute([$movie_id]);
    $count = $stmt2->fetch()['total_likes'];

    jsonResponse([
        'success'     => true,
        'liked'       => $liked,
        'total_likes' => (int)$count,
        'message'     => $liked ? '❤️ Movie liked!' : '💔 Movie disliked.',
    ]);
}

// ── DELETE — remove reaction entirely ──────
if ($method === 'DELETE') {
    $movie_id = trim($body['movie_id'] ?? '');
    if (!$movie_id) jsonResponse(['error' => 'movie_id is required.'], 400);

    $stmt = $db->prepare('DELETE FROM likes WHERE user_id = ? AND movie_id = ?');
    $stmt->execute([$user['id'], $movie_id]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'No like found for this movie.'], 404);
    }
    jsonResponse(['success' => true, 'message' => 'Reaction removed.']);
}

jsonResponse(['error' => 'Method not allowed.'], 405);