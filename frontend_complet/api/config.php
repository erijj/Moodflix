<?php
// ============================================
//  MOODFLIX — Database Configuration
//  api/config.php
// ============================================

define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // Change to your XAMPP MySQL user
define('DB_PASS', '');           // Change to your XAMPP MySQL password
define('DB_NAME', 'moodflix');

// ── Create PDO connection ──────────────────
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}

// ── JSON response helper ───────────────────
function jsonResponse(mixed $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// ── Get authenticated user from session ───
function getAuthUser(): ?array {
    if (session_status() === PHP_SESSION_NONE) session_start();
    return $_SESSION['user'] ?? null;
}

// ── Require auth or abort ──────────────────
function requireAuth(): array {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized. Please log in.'], 401);
    }
    return $user;
}