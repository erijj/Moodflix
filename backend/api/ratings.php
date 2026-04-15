<?php
// ============================================
//  MOODFLIX — Ratings API
//  api/ratings.php
//  GET    /api/ratings.php?movie_id=X  → avg rating + user's own rating
//  POST   /api/ratings.php             → rate a movie { movie_id, rating: 1-5 }
//  DELETE /api/ratings.php             → remove rating { movie_id }
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

// Helper: fetch stats for a movie
function getMovieRatingStats(PDO $db, string $movie_id, int $user_id): array {
    $stmt = $db->prepare(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
         FROM ratings WHERE movie_id = ?'
    );
    $stmt->execute([$movie_id]);
    $stats = $stmt->fetch();

    $stmt2 = $db->prepare('SELECT rating FROM ratings WHERE user_id = ? AND movie_id = ?');
    $stmt2->execute([$user_id, $movie_id]);
    $own = $stmt2->fetch();

    return [
        'movie_id'      => $movie_id,
        'avg_rating'    => $stats['avg_rating'] ? round((float)$stats['avg_rating'], 1) : null,
        'total_ratings' => (int)$stats['total_ratings'],
        'user_rating'   => $own ? (int)$own['rating'] : null,
    ];
}

// ── GET ────────────────────────────────────
if ($method === 'GET') {
    $movie_id = trim($_GET['movie_id'] ?? '');
    if (!$movie_id) jsonResponse(['error' => 'movie_id is required.'], 400);

    jsonResponse(getMovieRatingStats($db, $movie_id, $user['id']));
}

// ── POST — add or update rating ────────────
if ($method === 'POST') {
    $movie_id = trim($body['movie_id'] ?? '');
    $rating   = (int)($body['rating']   ?? 0);

    if (!$movie_id) jsonResponse(['error' => 'movie_id is required.'], 400);
    if ($rating < 1 || $rating > 5) {
        jsonResponse(['error' => 'Rating must be between 1 and 5 stars.'], 400);
    }

    $stmt = $db->prepare(
        'INSERT INTO ratings (user_id, movie_id, rating)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE rating = VALUES(rating), created_at = CURRENT_TIMESTAMP'
    );
    $stmt->execute([$user['id'], $movie_id, $rating]);

    jsonResponse([
        'success' => true,
        'message' => "You rated this $rating ⭐",
        'stats'   => getMovieRatingStats($db, $movie_id, $user['id']),
    ]);
}

// ── DELETE — remove rating ─────────────────
if ($method === 'DELETE') {
    $movie_id = trim($body['movie_id'] ?? '');
    if (!$movie_id) jsonResponse(['error' => 'movie_id is required.'], 400);

    $stmt = $db->prepare('DELETE FROM ratings WHERE user_id = ? AND movie_id = ?');
    $stmt->execute([$user['id'], $movie_id]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'No rating found for this movie.'], 404);
    }
    jsonResponse(['success' => true, 'message' => 'Rating removed.']);
}

jsonResponse(['error' => 'Method not allowed.'], 405);