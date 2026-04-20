<?php
// ============================================
// Watchlist API gère la watchlist
//  api/watchlist.php
//  GET    /api/watchlist.php          → get user's watchlist
//  POST   /api/watchlist.php          → add movie  { movie_id }
//  DELETE /api/watchlist.php          → remove     { movie_id }
//  GET    /api/watchlist.php?surprise=1 → random movie from watchlist
// ============================================

header('Content-Type: application/json'); //Dit au navigateur que la réponse sera du JSON (pas du HTML)
header('Access-Control-Allow-Origin: *'); // Autorise n'importe quel site web (ex: React, Vue) à appeler cette API (CORS)
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS'); // Autorise ces méthodes HTTP (GET, POST, DELETE) pour les requêtes cross-origin
header('Access-Control-Allow-Headers: Content-Type'); // Autorise l'envoi de données au format JSON

// Pour les navigateurs : quand ils envoient une requête de "test" avant le vrai appel, on répond "OK" et on arrête là
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}


session_start();
require_once __DIR__ . '/config.php';  // on importe les fonctions de config.php

// On vérifie que l'utilisateur est connecté, sinon on arrête tout et on envoie une erreur
$user   = requireAuth();

// On crée la connexion à la base de données
$db     = getDB();
// On lit la méthode HTTP (GET, POST, DELETE) et le corps de la requête (pour POST et DELETE)
$method = $_SERVER['REQUEST_METHOD'];
//
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

//si c'est un GET:afficher la watchlist
if ($method === 'GET') {


    // On cherche tous les films de cet utilisateur dans la table watchlist
    $stmt = $db->prepare('SELECT movie_id, added_at FROM watchlist WHERE user_id = ? ORDER BY added_at DESC');
    $stmt->execute([$user['id']]);

    // On envoie la liste en réponse
    jsonResponse(['watchlist' => $stmt->fetchAll()]);

    //  Surprise movie — random from watchlist
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

}

// ── Si c'est un POST : ajouter un film ──
if ($method === 'POST') {

    // on récupere l'ID du film envoyé par le navigateur
    $movie_id = trim($body['movie_id'] ?? '');

    //si l'id est vide on envoie une erreur
    if (!$movie_id) jsonResponse(['error' => 'movie_id is required.'], 400);

    // On vérifie si le film est déjà dans la watchlist
    $stmt = $db->prepare('SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?');
    $stmt->execute([$user['id'], $movie_id]);

    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Movie already in watchlist.'], 409);
    }

    // On ajoute le film à la watchlist dans la DB
    $stmt = $db->prepare('INSERT INTO watchlist (user_id, movie_id) VALUES (?, ?)');
    $stmt->execute([$user['id'], $movie_id]);

    //on confirme le succes
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
?>