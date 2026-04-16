<?php
// ============================================
//  MOODFLIX — movies.php
//  API : Films & Recommandation par humeur
// ============================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ============================================
//  CONNEXION BASE DE DONNÉES
// ============================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodflix');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            sendError(500, 'Database connection failed: ' . $e->getMessage());
        }
    }
    return $pdo;
}

// ============================================
//  HELPERS
// ============================================
function sendJSON(mixed $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sendError(int $code, string $message): void {
    sendJSON(['success' => false, 'error' => $message], $code);
}

function sendSuccess(mixed $data, string $message = 'OK', int $code = 200): void {
    sendJSON(['success' => true, 'message' => $message, 'data' => $data], $code);
}

// ============================================
//  ROUTING
// ============================================
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normalise l'URI : supprime le préfixe /api/movies
$uri = preg_replace('#^/api/movies#', '', $uri);
$uri = rtrim($uri, '/');

// Routes :
//   ''        → liste / filtres
//   '/:id'    → détail film
//   '/recommend' → recommandation par mood

switch (true) {

    // GET /api/movies/recommend?mood=happy
    case $method === 'GET' && $uri === '/recommend':
        recommendByMood();
        break;

    // GET /api/movies/:id
    case $method === 'GET' && preg_match('#^/(\d+)$#', $uri, $m):
        getMovieById((int)$m[1]);
        break;

    // GET /api/movies  (+ query params optionnels)
    case $method === 'GET' && $uri === '':
        listMovies();
        break;

    // POST /api/movies
    case $method === 'POST' && $uri === '':
        addMovie();
        break;

    default:
        sendError(404, 'Route not found');
}

// ============================================
//  1. LISTER FILMS (avec filtres & pagination)
//  GET /api/movies
//  GET /api/movies?mood=happy
//  GET /api/movies?genre=Drama
//  GET /api/movies?search=inception
//  GET /api/movies?sort=year&order=desc&page=2&limit=10
// ============================================
function listMovies(): void {
    $pdo = getDB();

    // Paramètres
    $mood   = trim($_GET['mood']   ?? '');
    $genre  = trim($_GET['genre']  ?? '');
    $search = trim($_GET['search'] ?? '');
    $sort   = in_array($_GET['sort'] ?? '', ['year', 'title', 'id']) ? $_GET['sort'] : 'id';
    $order  = strtoupper($_GET['order'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';
    $page   = max(1, (int)($_GET['page']  ?? 1));
    $limit  = min(50, max(1, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    // Construction de la requête dynamique
    $where  = [];
    $params = [];

    if ($mood !== '') {
        // Le champ mood peut contenir plusieurs valeurs séparées par des virgules
        $where[]        = 'FIND_IN_SET(:mood, mood) > 0';
        $params[':mood'] = $mood;
    }

    if ($genre !== '') {
        $where[]         = 'genre = :genre';
        $params[':genre'] = $genre;
    }

    if ($search !== '') {
        $where[]          = '(title LIKE :search OR description LIKE :search2)';
        $params[':search']  = '%' . $search . '%';
        $params[':search2'] = '%' . $search . '%';
    }

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // Compte total (pour la pagination)
    $countSQL  = "SELECT COUNT(*) FROM movies $whereSQL";
    $countStmt = $pdo->prepare($countSQL);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Requête principale
    $sql  = "SELECT * FROM movies $whereSQL ORDER BY $sort $order LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $movies = $stmt->fetchAll();

    sendSuccess([
        'movies'     => $movies,
        'pagination' => [
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => (int)ceil($total / $limit),
        ],
    ]);
}

// ============================================
//  2. DÉTAIL D'UN FILM
//  GET /api/movies/:id
// ============================================
function getMovieById(int $id): void {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT * FROM movies WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $movie = $stmt->fetch();

    if (!$movie) {
        sendError(404, "Movie with id $id not found");
    }

    sendSuccess($movie);
}

// ============================================
//  3. RECOMMANDATION PAR MOOD
//  GET /api/movies/recommend?mood=happy
//  Retourne jusqu'à 10 films aléatoires correspondant au mood
// ============================================
function recommendByMood(): void {
    $mood = trim($_GET['mood'] ?? '');

    if ($mood === '') {
        sendError(400, 'Parameter "mood" is required');
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare(
        'SELECT * FROM movies
         WHERE FIND_IN_SET(:mood, mood) > 0
         ORDER BY RAND()
         LIMIT 10'
    );
    $stmt->execute([':mood' => $mood]);
    $movies = $stmt->fetchAll();

    if (empty($movies)) {
        sendSuccess([], "No recommendations found for mood: $mood");
    }

    sendSuccess($movies, "Recommendations for mood: $mood");
}

// ============================================
//  4. AJOUTER UN FILM
//  POST /api/movies
//  Body JSON : { title, description, genre, mood, year, poster }
// ============================================
function addMovie(): void {
    // Lecture du body JSON
    $body = json_decode(file_get_contents('php://input'), true);

    if (!$body) {
        sendError(400, 'Invalid or empty JSON body');
    }

    // Validation des champs obligatoires
    $required = ['title', 'genre', 'mood', 'year'];
    foreach ($required as $field) {
        if (empty($body[$field])) {
            sendError(400, "Field \"$field\" is required");
        }
    }

    $title       = trim($body['title']);
    $description = trim($body['description'] ?? '');
    $genre       = trim($body['genre']);
    $mood        = trim($body['mood']);     // ex: "happy,excited"
    $year        = (int)$body['year'];
    $poster      = trim($body['poster'] ?? '');

    // Validation année
    $currentYear = (int)date('Y');
    if ($year < 1888 || $year > $currentYear + 2) {
        sendError(400, "Invalid year: $year");
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare(
        'INSERT INTO movies (title, description, genre, mood, year, poster)
         VALUES (:title, :description, :genre, :mood, :year, :poster)'
    );

    $stmt->execute([
        ':title'       => $title,
        ':description' => $description,
        ':genre'       => $genre,
        ':mood'        => $mood,
        ':year'        => $year,
        ':poster'      => $poster,
    ]);

    $newId = (int)$pdo->lastInsertId();

    // Récupérer le film nouvellement créé
    $stmt2 = $pdo->prepare('SELECT * FROM movies WHERE id = :id');
    $stmt2->execute([':id' => $newId]);
    $newMovie = $stmt2->fetch();

    sendSuccess($newMovie, 'Movie added successfully', 201);
}
