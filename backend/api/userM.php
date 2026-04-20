<?php
// ============================================
//  MOODFLIX — API Profil Utilisateur
//  api/user.php
//
//  Endpoints disponibles :
//  POST /api/user.php?action=get_profile       → récupérer son profil complet
//  POST /api/user.php?action=update_profile    → modifier nom, bio, genre, moods, prefs
//  POST /api/user.php?action=change_password   → changer son mot de passe
//  POST /api/user.php?action=delete_account    → supprimer son compte
//  GET  /api/user.php?action=export_data       → exporter ses données (RGPD)
//  GET  /api/user.php?action=get_stats         → statistiques du profil
// ============================================

// -- En-têtes CORS et JSON ---------------------
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// -- Pré-vol CORS (OPTIONS) --------------------
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// -- Démarrage de la session et chargement de la config
session_start();
require_once __DIR__ . '/config.php';

// -- Récupération de l'utilisateur connecté (obligatoire)
$user   = requireAuth();          // Redirige avec 401 si non connecté
$db     = getDB();
$action = $_GET['action'] ?? '';  // Action demandée
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

// ============================================
//  GET PROFILE — Récupérer le profil complet
//  Appel : GET /api/user.php?action=get_profile
// ============================================
if ($action === 'get_profile') {

    $stmt = $db->prepare(
        'SELECT
            id, username, email,
            first_name, last_name, bio, avatar,
            fav_genre, fav_moods,
            pref_notifications, pref_public_profile,
            pref_ai_recommendations, pref_dark_mode,
            created_at
         FROM users
         WHERE id = ?'
    );
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonResponse(['error' => 'Utilisateur introuvable.'], 404);
    }

    // Convertir fav_moods (string CSV) → tableau PHP
    $row['fav_moods'] = $row['fav_moods']
        ? array_filter(explode(',', $row['fav_moods']))
        : [];

    // Regrouper les préférences dans un objet structuré
    $row['preferences'] = [
        'notifications'    => (bool)$row['pref_notifications'],
        'publicProfile'    => (bool)$row['pref_public_profile'],
        'aiRecommendations'=> (bool)$row['pref_ai_recommendations'],
        'darkMode'         => (bool)$row['pref_dark_mode'],
    ];

    // Supprimer les colonnes individuelles (déjà regroupées)
    unset(
        $row['pref_notifications'],
        $row['pref_public_profile'],
        $row['pref_ai_recommendations'],
        $row['pref_dark_mode']
    );

    jsonResponse(['success' => true, 'user' => $row]);
}

// ============================================
//  UPDATE PROFILE — Modifier le profil
//  Appel : POST /api/user.php?action=update_profile
//  Body  : { username, first_name, last_name, bio, fav_genre, fav_moods[], preferences{} }
// ============================================
if ($action === 'update_profile' && $_SERVER['REQUEST_METHOD'] === 'POST') {

    // -- Récupération et nettoyage des données reçues
    $username   = trim($body['username']   ?? '');
    $first_name = trim($body['first_name'] ?? '');
    $last_name  = trim($body['last_name']  ?? '');
    $bio        = trim($body['bio']        ?? '');
    $fav_genre  = trim($body['fav_genre']  ?? '');
    $fav_moods  = $body['fav_moods']  ?? [];        // tableau de moods
    $prefs      = $body['preferences'] ?? [];       // objet préférences

    // -- Validation du username si fourni
    if ($username) {
        // Vérifier que le username n'est pas déjà pris par un autre utilisateur
        $stmt = $db->prepare('SELECT id FROM users WHERE username = ? AND id != ?');
        $stmt->execute([$username, $user['id']]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Ce nom d\'utilisateur est déjà pris.'], 409);
        }
    }

    // -- Construction dynamique de la requête UPDATE
    $fields = [];  // colonnes à mettre à jour
    $params = [];  // valeurs correspondantes

    if ($username)   { $fields[] = 'username = ?';   $params[] = $username; }
    if ($first_name) { $fields[] = 'first_name = ?'; $params[] = $first_name; }
    if ($last_name)  { $fields[] = 'last_name = ?';  $params[] = $last_name; }
    if ($bio !== '') { $fields[] = 'bio = ?';         $params[] = $bio; }
    if ($fav_genre)  { $fields[] = 'fav_genre = ?';  $params[] = $fav_genre; }

    // Convertir le tableau de moods en string CSV
    if (!empty($fav_moods)) {
        $fields[] = 'fav_moods = ?';
        $params[] = implode(',', array_map('trim', $fav_moods));
    }

    // Mettre à jour les préférences si fournies
    if (isset($prefs['notifications']))     { $fields[] = 'pref_notifications = ?';       $params[] = $prefs['notifications']     ? 1 : 0; }
    if (isset($prefs['publicProfile']))     { $fields[] = 'pref_public_profile = ?';      $params[] = $prefs['publicProfile']     ? 1 : 0; }
    if (isset($prefs['aiRecommendations'])) { $fields[] = 'pref_ai_recommendations = ?';  $params[] = $prefs['aiRecommendations'] ? 1 : 0; }
    if (isset($prefs['darkMode']))          { $fields[] = 'pref_dark_mode = ?';            $params[] = $prefs['darkMode']          ? 1 : 0; }

    // Rien à mettre à jour
    if (empty($fields)) {
        jsonResponse(['error' => 'Aucune donnée à mettre à jour.'], 400);
    }

    // -- Exécution de la requête
    $params[] = $user['id'];  // Clause WHERE id = ?
    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $db->prepare($sql)->execute($params);

    // -- Mettre à jour la session si le username a changé
    if ($username) {
        $_SESSION['user']['username'] = $username;
    }

    jsonResponse(['success' => true, 'message' => 'Profil mis à jour avec succès.']);
}

// ============================================
//  CHANGE PASSWORD — Changer le mot de passe
//  Appel : POST /api/user.php?action=change_password
//  Body  : { current_password, new_password }
// ============================================
if ($action === 'change_password' && $_SERVER['REQUEST_METHOD'] === 'POST') {

    $current_password = $body['current_password'] ?? '';
    $new_password     = $body['new_password']     ?? '';

    // -- Validation des données
    if (!$current_password || !$new_password) {
        jsonResponse(['error' => 'Les deux mots de passe sont requis.'], 400);
    }
    if (strlen($new_password) < 6) {
        jsonResponse(['error' => 'Le nouveau mot de passe doit contenir au moins 6 caractères.'], 400);
    }

    // -- Récupérer le hash actuel depuis la base
    $stmt = $db->prepare('SELECT password FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();

    // -- Vérifier que l'ancien mot de passe est correct
    if (!password_verify($current_password, $row['password'])) {
        jsonResponse(['error' => 'Mot de passe actuel incorrect.'], 401);
    }

    // -- Hacher et sauvegarder le nouveau mot de passe
    $new_hash = password_hash($new_password, PASSWORD_BCRYPT);
    $db->prepare('UPDATE users SET password = ? WHERE id = ?')
       ->execute([$new_hash, $user['id']]);

    jsonResponse(['success' => true, 'message' => 'Mot de passe mis à jour avec succès.']);
}

// ============================================
//  DELETE ACCOUNT — Supprimer son compte
//  Appel : POST /api/user.php?action=delete_account
//  Body  : { password }  (confirmation par mot de passe)
// ============================================
if ($action === 'delete_account' && $_SERVER['REQUEST_METHOD'] === 'POST') {

    $password = $body['password'] ?? '';

    if (!$password) {
        jsonResponse(['error' => 'Mot de passe requis pour confirmer la suppression.'], 400);
    }

    // -- Vérifier le mot de passe
    $stmt = $db->prepare('SELECT password FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();

    if (!password_verify($password, $row['password'])) {
        jsonResponse(['error' => 'Mot de passe incorrect.'], 401);
    }

    // -- Supprimer le compte (CASCADE supprime watchlist, likes, comments, ratings)
    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$user['id']]);

    // -- Détruire la session
    session_destroy();

    jsonResponse(['success' => true, 'message' => 'Compte supprimé définitivement.']);
}

// ============================================
//  EXPORT DATA — Exporter ses données (RGPD)
//  Appel : GET /api/user.php?action=export_data
// ============================================
if ($action === 'export_data' && $_SERVER['REQUEST_METHOD'] === 'GET') {

    // -- Données du profil
    $stmt = $db->prepare(
        'SELECT id, username, email, first_name, last_name, bio, fav_genre, fav_moods, created_at
         FROM users WHERE id = ?'
    );
    $stmt->execute([$user['id']]);
    $userData = $stmt->fetch();

    // -- Watchlist de l'utilisateur
    $stmt = $db->prepare('SELECT movie_id, added_at FROM watchlist WHERE user_id = ? ORDER BY added_at DESC');
    $stmt->execute([$user['id']]);
    $watchlist = $stmt->fetchAll();

    // -- Films likés
    $stmt = $db->prepare('SELECT movie_id, liked, created_at FROM likes WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([$user['id']]);
    $likes = $stmt->fetchAll();

    // -- Commentaires postés
    $stmt = $db->prepare('SELECT movie_id, content, created_at FROM comments WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([$user['id']]);
    $comments = $stmt->fetchAll();

    // -- Notes données
    $stmt = $db->prepare('SELECT movie_id, rating, created_at FROM ratings WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([$user['id']]);
    $ratings = $stmt->fetchAll();

    jsonResponse([
        'export_date' => date('Y-m-d H:i:s'),
        'user'        => $userData,
        'watchlist'   => $watchlist,
        'likes'       => $likes,
        'comments'    => $comments,
        'ratings'     => $ratings,
    ]);
}

// ============================================
//  GET STATS — Statistiques du profil
//  Appel : GET /api/user.php?action=get_stats
// ============================================
if ($action === 'get_stats' && $_SERVER['REQUEST_METHOD'] === 'GET') {

    // Nombre de films en watchlist
    $stmt = $db->prepare('SELECT COUNT(*) as total FROM watchlist WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $watchlistCount = (int)$stmt->fetch()['total'];

    // Nombre de films likés
    $stmt = $db->prepare('SELECT COUNT(*) as total FROM likes WHERE user_id = ? AND liked = 1');
    $stmt->execute([$user['id']]);
    $likesCount = (int)$stmt->fetch()['total'];

    // Nombre de commentaires postés
    $stmt = $db->prepare('SELECT COUNT(*) as total FROM comments WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $commentsCount = (int)$stmt->fetch()['total'];

    // Humeur la plus souvent consultée (via les films likés - on regarde le movie_id prefix)
    // Note : les IDs films commencent par la lettre de l'humeur (h=happy, s=sad, etc.)
    $stmt = $db->prepare(
        'SELECT LEFT(movie_id, 1) as mood_key, COUNT(*) as cnt
         FROM likes WHERE user_id = ? AND liked = 1
         GROUP BY mood_key ORDER BY cnt DESC LIMIT 1'
    );
    $stmt->execute([$user['id']]);
    $topMoodRow = $stmt->fetch();

    // Correspondance lettre → emoji humeur
    $moodEmojis = [
        'h' => '😊', 's' => '😢', 'r' => '💕',
        'e' => '⚡', 'o' => '😮', 'b' => '😑'
    ];
    $favMoodEmoji = $topMoodRow
        ? ($moodEmojis[$topMoodRow['mood_key']] ?? '🎬')
        : '🎬';

    jsonResponse([
        'success'        => true,
        'watchlist_count'=> $watchlistCount,
        'likes_count'    => $likesCount,
        'comments_count' => $commentsCount,
        'fav_mood_emoji' => $favMoodEmoji,
    ]);
}

// -- Action inconnue
jsonResponse(['error' => 'Action invalide.'], 400);
?>