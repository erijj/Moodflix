<?php
// ============================================
//  Likes API gère les likes et dislikes des films
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

// ── GET voir si l'utilistauer a liké ce film 
if ($method === 'GET') {

    $movie_id = $_GET['movie_id'] ?? '';

    // On cherche le like de cet utilisateur pour ce film
    $stmt = $db->prepare('SELECT liked FROM likes WHERE user_id = ? AND movie_id = ?'); //stmt=statement (requête préparée)
    $stmt->execute([$user['id'], $movie_id]); // on exécute la requête en remplaçant les ? par les valeurs de l'utilisateur et du film
    $row = $stmt->fetch();

    // On compte le total de likes pour ce film
    $stmt2 = $db->prepare('SELECT COUNT(*) as total FROM likes WHERE movie_id = ? AND liked = 1');
    $stmt2->execute([$movie_id]);
    $total = $stmt2->fetch()['total'];

    jsonResponse([
        'user_liked'  => $row ? (bool)$row['liked'] : null, // true/false/null
        'total_likes' => (int)$total
    ]);
    }
}

// ── POST — like or dislike ─────────────────
if ($method === 'POST') {

    $movie_id = trim($body['movie_id'] ?? ''); // trim: Supprime les espaces au début et à la fin d'une chaîne
    $liked    = isset($body['liked']) ? (bool)$body['liked'] : true; // isset : vérifie si une variable est définie et n'est pas null
    // liked = true  → ❤️ like
    // liked = false → 💔 dislike

    if (!$movie_id) {
        jsonResponse(['erreur' => 'Il manque l\'ID du film.'], 400);
    }

    // INSERT OR UPDATE : si le like existe déjà on le met à jour, sinon on le crée
    $stmt = $db->prepare(
        'INSERT INTO likes (user_id, movie_id, liked)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE liked = VALUES(liked)'
    );
    $stmt->execute([$user['id'], $movie_id, $liked ? 1 : 0]); //Opérateur ternaire : si $liked est true → 1, sinon 0

    // On recompte les likes après la mise à jour
    $stmt2 = $db->prepare('SELECT COUNT(*) as total FROM likes WHERE movie_id = ? AND liked = 1');
    $stmt2->execute([$movie_id]);
    $total = $stmt2->fetch()['total'];

    jsonResponse([
        'succes'      => true,
        'liked'       => $liked,
        'total_likes' => (int)$total,
        'message'     => $liked ? 'Film liké ❤️' : 'Film disliké 💔'
    ]);

}

// ── DELETE :supprimer le like 

if ($method === 'DELETE') {
    $movie_id = trim($body['movie_id'] ?? '');

    $stmt =$db->prepare('DELETE FROM likes where user_id=? AND movie_id=?');
    $stmt->execute([$user['id'],$movie_id]);

    jsonResponse(['succes' => true, 'messge' => 'Réaction supprime'])
}

jsonResponse(['error' => 'Method not allowed.'], 405);
?>