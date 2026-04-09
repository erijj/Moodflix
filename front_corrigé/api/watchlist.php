<?php
// ============================================
//  MOODFLIX — Watchlist API
//  api/watchlist.php
//  GET    /api/watchlist.php          → get user's watchlist
//  POST   /api/watchlist.php          → add movie  { movie_id }
//  DELETE /api/watchlist.php          → remove     { movie_id }
//  GET    /api/watchlist.php?surprise=1 → random movie from watchlist
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

// ── GET — list or surprise ─────────────────
if ($method === 'GET') {

    // 🎲 Surprise movie — random from watchlist
    if (!empty($_GET['surprise'])) {
        $stmt = $db->prepare('SELECT movie_id FROM watchlist WHERE user_id = ?');
        $stmt->execute([$user['id']]);
        $list = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($list)) {
            jsonResponse(['error' => 'Your watchlist is empty. Add some movies first!'], 404);
        }
        $random = $list[array_rand($list)];
        jsonResponse(['movie_id' => $random]);
    }

    // Normal list
    $stmt = $db->prepare(
        'SELECT movie_id, added_at FROM watchlist WHERE user_id = ? ORDER BY added_at DESC'
    );
    $stmt->execute([$user['id']]);
    jsonResponse(['watchlist' => $stmt->fetchAll()]);
}

// ── POST — add to watchlist ────────────────
if ($method === 'POST') {
    $movie_id = trim($body['movie_id'] ?? '');
    if (!$movie_id) jsonResponse(['error' => 'movie_id is required.'], 400);

    // Check duplicate
    $stmt = $db->prepare('SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?');
    $stmt->execute([$user['id'], $movie_id]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Movie already in watchlist.'], 409);
    }

    $stmt = $db->prepare('INSERT INTO watchlist (user_id, movie_id) VALUES (?, ?)');
    $stmt->execute([$user['id'], $movie_id]);
    jsonResponse(['success' => true, 'message' => 'Added to watchlist!'], 201);
}

// ── DELETE — remove from watchlist ─────────
if ($method === 'DELETE') {
    $movie_id = trim($body['movie_id'] ?? '');
    if (!$movie_id) jsonResponse(['error' => 'movie_id is required.'], 400);

    $stmt = $db->prepare('DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?');
    $stmt->execute([$user['id'], $movie_id]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Movie not found in your watchlist.'], 404);
    }
    jsonResponse(['success' => true, 'message' => 'Removed from watchlist.']);
}

jsonResponse(['error' => 'Method not allowed.'], 405);