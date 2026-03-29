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