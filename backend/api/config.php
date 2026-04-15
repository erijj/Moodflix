<?php
// ============================================
//  Connexion à la base de données 
// ============================================

//les informations de connexion
define('DB_HOST', 'localhost');  //ou est la DB
define('DB_USER', 'root');       // utilistauer par défaut 
define('DB_PASS', '');           // mot de passe  vide par défaut
define('DB_NAME', 'moodflix');   // le nom de notre base de données

// cette fonction crée la connexion à la DB
function getDB(){
    try{
        $connexion=new PDO(
            'mysql:host=localhost;dbname=moodflix';charset=utf8mb4,'root',''
        );
        return $connexion;
    }catch(Exception $e){
        //si la cnx échoue ,on affiche une erreur
        echo json_encode(['erreur =>'impossible de se connecter à la DB']);
        exit;
    }
    }
}

// cette fonction envoie une réponse JSON au navigateur
function jsonResponse($data,$code = 200): {
    http_response_code($code);                 // le code HTTP (200 = OK, 400 = erreur...)
    header('Content-Type: application/json');  // on dit qu'on envoie du JSON
    echo json_encode($data);                   // on convertit en JSON et on envoie
    exit;
}

// cette fonction vérifie si l'utilisateur est connecté 
function getAuthUser(): ?array {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();                      // on démarre la session si elle n'existe pas
    }
    }
    return $_SESSION['user'] ?? null;         // on retourne l'utilisateur ou null s'il n'est pas connecté
}

// cette fonction oblige l'utilistaeur à étre connecté s'il nest pas connecte ,on arrrete tout et on envoie une erreur
function requireAuth(): array {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(['error' => 'Tu dois être connecté pour faire ça.'], 401);
    }
    return $user;
}
?>