<?php
// ============================================
//  MOODFLIX — Auth API
//  api/auth.php
//  POST /api/auth.php?action=register
//  POST /api/auth.php?action=login
//  POST /api/auth.php?action=logout
//  GET  /api/auth.php?action=me
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

session_start();
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

// ── REGISTER ──────────────────────────────
if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($body['username'] ?? '');
    $email    = trim($body['email']    ?? '');
    $password =      $body['password'] ?? '';

    if (!$username || !$email || !$password) {
        jsonResponse(['error' => 'All fields are required.'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Invalid email address.'], 400);
    }
    if (strlen($password) < 6) {
        jsonResponse(['error' => 'Password must be at least 6 characters.'], 400);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? OR username = ?');
    $stmt->execute([$email, $username]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Email or username already taken.'], 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    $stmt->execute([$username, $email, $hash]);
    $id = (int)$db->lastInsertId();

    $_SESSION['user'] = ['id' => $id, 'username' => $username, 'email' => $email];
    jsonResponse(['success' => true, 'user' => $_SESSION['user']], 201);
}

// ── LOGIN ─────────────────────────────────
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($body['email']    ?? '');
    $password =      $body['password'] ?? '';

    if (!$email || !$password) {
        jsonResponse(['error' => 'Email and password are required.'], 400);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, username, email, password FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(['error' => 'Invalid email or password.'], 401);
    }

    unset($user['password']);
    $_SESSION['user'] = $user;
    jsonResponse(['success' => true, 'user' => $user]);
}

// ── LOGOUT ────────────────────────────────
if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    session_destroy();
    jsonResponse(['success' => true]);
}

// ── ME (current user) ─────────────────────
if ($action === 'me' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = getAuthUser();
    if (!$user) jsonResponse(['user' => null]);
    jsonResponse(['user' => $user]);
}

jsonResponse(['error' => 'Invalid action.'], 400);


// ============================================
// AJOUTER PAR MIRAL
//  FORGOT PASSWORD — Demander réinitialisation
//  Appel : POST /api/auth.php?action=forgot_password
//  Body  : { email }
// ============================================
if ($action === 'forgot_password' && $_SERVER['REQUEST_METHOD'] === 'POST') {

    $email = trim($body['email'] ?? '');

    if (!$email) {
        jsonResponse(['error' => 'Email requis.'], 400);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Réponse identique que l'email existe ou non (sécurité anti-énumération)
    if ($user) {
        // Générer un token aléatoire sécurisé
        $rawToken  = bin2hex(random_bytes(32));               // Token brut (envoyé par email)
        $hashToken = hash('sha256', $rawToken);               // Token hashé (stocké en base)
        $expires   = date('Y-m-d H:i:s', strtotime('+30 minutes'));

        $db->prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?')
           ->execute([$hashToken, $expires, $user['id']]);

        // TODO : Envoyer l'email avec PHPMailer
        // Exemple : reset-password.html?token=$rawToken
        // Pour l'instant, le token est affiché en log (dev uniquement)
        error_log("=== MOODFLIX RESET TOKEN (dev) ===");
        error_log("Email  : $email");
        error_log("Token  : $rawToken");
        error_log("Expire : $expires");
        error_log("URL    : http://localhost/moodflix/reset-password.html?token=$rawToken");
    }

    jsonResponse(['success' => true, 'message' => 'Si cet email existe, un lien a été envoyé.']);
}

// ============================================
//  RESET PASSWORD — Réinitialiser le mot de passe
//  Appel : POST /api/auth.php?action=reset_password
//  Body  : { token, new_password }
// ============================================
if ($action === 'reset_password' && $_SERVER['REQUEST_METHOD'] === 'POST') {

    $rawToken    = trim($body['token']        ?? '');
    $newPassword = trim($body['new_password'] ?? '');

    if (!$rawToken || !$newPassword) {
        jsonResponse(['error' => 'Token et nouveau mot de passe requis.'], 400);
    }
    if (strlen($newPassword) < 6) {
        jsonResponse(['error' => 'Minimum 6 caractères requis.'], 400);
    }

    // Hasher le token reçu pour comparer avec celui en base
    $hashToken = hash('sha256', $rawToken);
    $db = getDB();

    // Chercher un utilisateur avec ce token non expiré
    $stmt = $db->prepare(
        'SELECT id FROM users
         WHERE reset_token = ? AND reset_expires > NOW()'
    );
    $stmt->execute([$hashToken]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['error' => 'Token invalide ou expiré. Refaites la demande.'], 400);
    }

    // Mettre à jour le mot de passe et effacer le token
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $db->prepare(
        'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?'
    )->execute([$newHash, $user['id']]);

    jsonResponse(['success' => true, 'message' => 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.']);
}