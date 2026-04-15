-- ============================================
--  MOODFLIX — Database Schema
--  moodflix.sql
--  Compatible : MySQL 8+ / MariaDB 10.4+
--  Import via XAMPP : http://localhost/phpmyadmin
-- ============================================

CREATE DATABASE IF NOT EXISTS moodflix
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE moodflix;

-- ============================================
--  TABLE : users
--  Utilisée par : auth.php, user.php
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  username                VARCHAR(50)     NOT NULL UNIQUE,
  email                   VARCHAR(150)    NOT NULL UNIQUE,
  password                VARCHAR(255)    NOT NULL,

  -- Profil (user.php → get_profile / update_profile)
  first_name              VARCHAR(80)     DEFAULT NULL,
  last_name               VARCHAR(80)     DEFAULT NULL,
  bio                     TEXT            DEFAULT NULL,
  avatar                  VARCHAR(255)    DEFAULT NULL,
  fav_genre               VARCHAR(80)     DEFAULT NULL,
  fav_moods               VARCHAR(255)    DEFAULT NULL,   -- stocké en CSV ex: "happy,sad,excited"

  -- Préférences (user.php → update_profile)
  pref_notifications      TINYINT(1)      NOT NULL DEFAULT 1,
  pref_public_profile     TINYINT(1)      NOT NULL DEFAULT 0,
  pref_ai_recommendations TINYINT(1)      NOT NULL DEFAULT 1,
  pref_dark_mode          TINYINT(1)      NOT NULL DEFAULT 1,

  -- Réinitialisation mot de passe (auth.php → forgot_password / reset_password)
  reset_token             VARCHAR(64)     DEFAULT NULL,   -- hash SHA-256 du token
  reset_expires           DATETIME        DEFAULT NULL,

  created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_email    (email),
  INDEX idx_username (username),
  INDEX idx_reset    (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
--  TABLE : watchlist
--  Utilisée par : watchlist.php, user.php
-- ============================================
CREATE TABLE IF NOT EXISTS watchlist (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  movie_id    VARCHAR(20)     NOT NULL,   -- ex: "h1", "s3", "e10" (IDs du front)
  added_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_user_movie (user_id, movie_id),
  INDEX idx_user_id (user_id),

  CONSTRAINT fk_watchlist_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
--  TABLE : likes
--  Utilisée par : likes.php, user.php
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  movie_id    VARCHAR(20)     NOT NULL,
  liked       TINYINT(1)      NOT NULL DEFAULT 1,   -- 1 = liked, 0 = disliked
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_user_movie (user_id, movie_id),
  INDEX idx_user_id  (user_id),
  INDEX idx_movie_id (movie_id),

  CONSTRAINT fk_likes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
--  TABLE : comments
--  Utilisée par : comments.php, user.php
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  movie_id    VARCHAR(20)     NOT NULL,
  content     TEXT            NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_user_id  (user_id),
  INDEX idx_movie_id (movie_id),
  INDEX idx_created  (movie_id, created_at),  -- pour le tri paginated

  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
--  TABLE : ratings
--  Utilisée par : ratings.php, user.php
-- ============================================
CREATE TABLE IF NOT EXISTS ratings (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  movie_id    VARCHAR(20)     NOT NULL,
  rating      TINYINT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_user_movie (user_id, movie_id),
  INDEX idx_user_id  (user_id),
  INDEX idx_movie_id (movie_id),

  CONSTRAINT fk_ratings_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
--  DONNÉES DE TEST (optionnel — à supprimer en prod)
--  Mot de passe de tous les comptes : Test1234
-- ============================================
INSERT INTO users (username, email, password, first_name, last_name, bio, fav_genre, fav_moods)
VALUES
  (
    'miral',
    'miral@moodflix.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Miral',
    NULL,
    'Backend developer & cinephile',
    'Drama',
    'happy,excited'
  ),
  (
    'cinephile42',
    'test@moodflix.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Alex',
    'Dupont',
    'I watch movies every night.',
    'Thriller',
    'sad,romantic'
  );

-- Quelques entrées watchlist pour les tests
INSERT INTO watchlist (user_id, movie_id) VALUES
  (1, 'h1'), (1, 'e2'), (1, 'r3'),
  (2, 's1'), (2, 'b2');

-- Quelques likes pour les tests
INSERT INTO likes (user_id, movie_id, liked) VALUES
  (1, 'h1', 1), (1, 'e2', 1), (1, 's3', 0),
  (2, 'r1', 1), (2, 'b1', 1);

-- Quelques ratings pour les tests
INSERT INTO ratings (user_id, movie_id, rating) VALUES
  (1, 'h1', 5), (1, 'e2', 4),
  (2, 'r1', 5), (2, 's1', 3);

-- Quelques commentaires pour les tests
INSERT INTO comments (user_id, movie_id, content) VALUES
  (1, 'h1', 'Absolute masterpiece, the ending had me in tears of joy.'),
  (2, 'h1', 'La La Land is pure magic. Watched it 3 times already!'),
  (1, 'e2', 'Inception still blows my mind on every rewatch.');