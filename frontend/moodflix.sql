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


  -- ============================================
--  MOODFLIX — movies table migration
-- ============================================

USE moodflix;

CREATE TABLE IF NOT EXISTS movies (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  title       VARCHAR(255)    NOT NULL,
  description TEXT            DEFAULT NULL,
  genre       VARCHAR(80)     NOT NULL,
  mood        VARCHAR(255)    NOT NULL,   -- CSV ex: "happy,excited,romantic"
  year        SMALLINT        NOT NULL,
  poster      VARCHAR(255)    DEFAULT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_genre (genre),
  INDEX idx_year  (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
--  DONNÉES DE TEST — Films
-- ============================================
INSERT INTO movies (title, description, genre, mood, year, poster) VALUES
  ('La La Land',        'A jazz musician and an actress fall in love.',              'Romance', 'happy,romantic,excited',   2016, 'lalaland.jpg'),
  ('Inception',         'A thief enters the dreams of others to steal secrets.',     'Sci-Fi',  'excited,mysterious',       2010, 'inception.jpg'),
  ('The Dark Knight',   'Batman faces the Joker in Gotham City.',                   'Action',  'excited,tense',            2008, 'darkknight.jpg'),
  ('Amélie',            'A shy waitress changes the lives of those around her.',     'Romance', 'happy,romantic',           2001, 'amelie.jpg'),
  ('Requiem for a Dream','Four people chase their dreams and suffer the consequences.','Drama', 'sad,dark',                 2000, 'requiem.jpg'),
  ('The Grand Budapest Hotel','A concierge and his lobby boy go on adventures.',    'Comedy',  'happy,funny,excited',      2014, 'budapest.jpg'),
  ('Interstellar',      'Astronauts travel through a wormhole to save humanity.',   'Sci-Fi',  'excited,emotional,sad',    2014, 'interstellar.jpg'),
  ('Parasite',          'A poor family schemes to become employed by a wealthy one.','Thriller','tense,dark,surprised',   2019, 'parasite.jpg'),
  ('The Notebook',      'A couple falls in love despite their differences.',         'Romance', 'romantic,sad,emotional',  2004, 'notebook.jpg'),
  ('Superbad',          'Two high school friends go on a wild adventure.',           'Comedy',  'happy,funny',              2007, 'superbad.jpg');
  ('Mamma Mia!', 'A young woman searches for her real father.', 'Musical', 'happy,comedy', 2008, 'mammamia.jpg'),
  ('Paddington 2', 'A bear searches for a special gift.', 'Family', 'happy,comedy', 2017, 'paddington2.jpg'),
  ('Singin in the Rain', 'A silent film star adapts to talking movies.', 'Musical', 'happy,comedy', 1952, 'singinintherain.jpg'),
  ('The Secret Life of Walter Mitty', 'A man escapes routine through adventure.', 'Adventure', 'happy,comedy', 2013, 'waltermitty.jpg'),
  ('The Shawshank Redemption', 'Two prisoners find hope and redemption.', 'Drama', 'happy,drama', 1994, 'shawshank.jpg'),
  ('Coco', 'A boy explores the land of the dead.', 'Animation', 'happy,family', 2017, 'coco.jpg'),
  ('The Lion King', 'A lion prince fights to reclaim his kingdom.', 'Animation', 'happy,adventure', 1994, 'lionking.jpg'),
  ('Inside Out', 'Emotions guide a girl through life changes.', 'Animation', 'happy,comedy', 2015, 'insideout.jpg'),
  ('Forrest Gump', 'A simple man lives an extraordinary life.', 'Drama', 'happy,drama', 1994, 'forrestgump.jpg'),
  ('Good Will Hunting', 'A genius janitor finds direction in life.', 'Drama', 'sad,drama', 1997, 'goodwillhunting.jpg'),
  ('Amelie', 'A girl improves lives around her.', 'Romance', 'sad,comedy', 2001, 'amelie.jpg'),
  ('The Intouchables', 'A rich man bonds with his caregiver.', 'Drama', 'sad,comedy', 2011, 'intouchables.jpg'),
  ('Hunt for the Wilderpeople', 'A boy and man go on a wild adventure.', 'Adventure', 'sad,comedy', 2016, 'wilderpeople.jpg'),
  ('Little Miss Sunshine', 'A family road trip changes their lives.', 'Comedy', 'sad,drama', 2006, 'littlesunshine.jpg'),
  ('My Neighbor Totoro', 'Two sisters meet forest spirits.', 'Animation', 'sad,family', 1988, 'totoro.jpg'),
  ('About Time', 'A man uses time travel to improve life.', 'Drama', 'sad,comedy', 2013, 'abouttime.jpg'),
  ('Chef', 'A chef rebuilds his career and family.', 'Comedy', 'sad,drama', 2014, 'chef.jpg'),
  ('The Secret Life of Walter Mitty', 'A dreamer discovers real adventure.', 'Adventure', 'sad,comedy', 2013, 'waltermitty.jpg'),
  ('Soul', 'A musician discovers the meaning of life.', 'Animation', 'sad,drama', 2020, 'soul.jpg'),
  ('Mad Max Fury Road', 'A rebel escapes a tyrant in the desert.', 'Action', 'excited,scifi', 2015, 'madmax.jpg'),
('Inception', 'A thief enters dreams to plant ideas.', 'Action', 'excited,thriller', 2010, 'inception.jpg'),
('Top Gun Maverick', 'A pilot faces his past and trains new recruits.', 'Action', 'excited,drama', 2022, 'topgun.jpg'),
('Everything Everywhere All at Once', 'A woman explores multiple universes.', 'Action', 'excited,comedy', 2022, 'everything.jpg'),
('The Dark Knight', 'Batman faces the Joker.', 'Action', 'excited,crime', 2008, 'darkknight.jpg'),
('Interstellar', 'Explorers travel through space to save humanity.', 'Adventure', 'excited,scifi', 2014, 'interstellar.jpg'),
('Parasite', 'A poor family infiltrates a rich household.', 'Drama', 'excited,thriller', 2019, 'parasite.jpg'),
('Whiplash', 'A drummer pushed to his limits.', 'Drama', 'excited,musical', 2014, 'whiplash.jpg'),
('Dune', 'A family fights for control of a desert planet.', 'Adventure', 'excited,scifi', 2021, 'dune.jpg'),
('Get Out', 'A man uncovers disturbing secrets.', 'Horror', 'excited,thriller', 2017, 'getout.jpg'),
('The Revenant', 'A man fights to survive in the wild.', 'Action', 'excited,adventure', 2015, 'revenant.jpg'),
('Pulp Fiction', 'Interconnected crime stories unfold.', 'Crime', 'excited,thriller', 1994, 'pulpfiction.jpg'),
('Schindlers List', 'A man saves lives during the Holocaust.', 'Drama', 'overwhelmed,history', 1993, 'schindler.jpg'),
('The Tree of Life', 'A meditation on life and the universe.', 'Drama', 'overwhelmed,drama', 2011, 'treeoflife.jpg'),
('Manchester by the Sea', 'A man deals with grief and guilt.', 'Drama', 'overwhelmed,drama', 2016, 'manchester.jpg'),
('Moonlight', 'A young man grows up in a tough environment.', 'Drama', 'overwhelmed,drama', 2016, 'moonlight.jpg'),
('Eternal Sunshine of the Spotless Mind', 'A couple erases memories of each other.', 'Drama', 'overwhelmed,scifi', 2004, 'eternal.jpg'),
('Her', 'A man falls in love with an AI.', 'Drama', 'overwhelmed,scifi', 2013, 'her.jpg'),
('Marriage Story', 'A couple goes through a painful divorce.', 'Drama', 'overwhelmed,drama', 2019, 'marriage.jpg'),
('Grave of the Fireflies', 'Two siblings struggle during war.', 'Animation', 'overwhelmed,war', 1988, 'fireflies.jpg'),
('Arrival', 'A linguist communicates with aliens.', 'Drama', 'overwhelmed,scifi', 2016, 'arrival.jpg'),
('The Pianist', 'A musician survives war hardships.', 'Drama', 'overwhelmed,war', 2002, 'pianist.jpg'),
('Knives Out', 'A detective investigates a mysterious death.', 'Comedy', 'bored,mystery', 2019, 'knivesout.jpg'),
('The Truman Show', 'A man discovers his life is a TV show.', 'Drama', 'bored,scifi', 1998, 'truman.jpg'),
('Spider Man Into the Spider Verse', 'A teen becomes Spider Man across universes.', 'Animation', 'bored,action', 2018, 'spiderman.jpg'),
('Everything Everywhere All at Once', 'A woman explores chaotic universes.', 'Action', 'bored,comedy', 2022, 'everything.jpg'),
('Oceans Eleven', 'A group plans a casino heist.', 'Crime', 'bored,comedy', 2001, 'oceans11.jpg'),
('Game Night', 'A game turns into a real mystery.', 'Comedy', 'bored,mystery', 2018, 'gamenight.jpg'),
('The Princess Bride', 'A fantasy adventure with romance and humor.', 'Adventure', 'bored,comedy', 1987, 'princessbride.jpg'),
('Hot Fuzz', 'A cop uncovers secrets in a small town.', 'Action', 'bored,comedy', 2007, 'hotfuzz.jpg'),
('The Grand Budapest Hotel', 'A concierge lives quirky adventures.', 'Comedy', 'bored,adventure', 2014, 'grandbudapest.jpg'),
('Superbad', 'Two friends try to enjoy high school.', 'Comedy', 'bored,comedy', 2007, 'superbad.jpg'),
('The Intern', 'A retired man starts a new job.', 'Comedy', 'happy', 2015, 'intern.jpg'),
('Legally Blonde', 'A girl proves herself in law school.', 'Comedy', 'happy', 2001, 'legallyblonde.jpg'),
('Mrs Doubtfire', 'A father disguises himself to see his kids.', 'Comedy', 'happy', 1993, 'mrsdoubtfire.jpg'),
('Toy Story', 'Toys come to life when humans are not around.', 'Animation', 'happy', 1995, 'toystory.jpg'),
('Finding Nemo', 'A fish searches for his lost son.', 'Animation', 'happy', 2003, 'nemo.jpg'),
('Up', 'An old man travels with a boy scout.', 'Animation', 'happy', 2009, 'up.jpg'),
('Shrek', 'An ogre goes on a journey to save a princess.', 'Animation', 'happy', 2001, 'shrek.jpg'),
('Aladdin', 'A street boy finds a magic lamp.', 'Animation', 'happy', 1992, 'aladdin.jpg'),
('The Holiday', 'Two women swap homes and find love.', 'Romance', 'happy', 2006, 'holiday.jpg'),
('Notting Hill', 'A man falls in love with a famous actress.', 'Romance', 'happy', 1999, 'nottinghill.jpg'),
('Titanic', 'A tragic love story on a sinking ship.', 'Romance', 'sad', 1997, 'titanic.jpg'),
('The Notebook', 'A love story that spans years.', 'Romance', 'sad', 2004, 'notebook.jpg'),
('Seven Pounds', 'A man seeks redemption through sacrifice.', 'Drama', 'sad', 2008, 'sevenpounds.jpg'),
('Philadelphia', 'A man fights discrimination and illness.', 'Drama', 'sad', 1993, 'philadelphia.jpg'),
('Marley and Me', 'A family shares life with a dog.', 'Drama', 'sad', 2008, 'marley.jpg'),
('Room', 'A mother and son escape captivity.', 'Drama', 'sad', 2015, 'room.jpg'),
('The Boy in the Striped Pajamas', 'A boy befriends another across a fence.', 'Drama', 'sad', 2008, 'pajamas.jpg'),
('Hachi A Dogs Tale', 'A dog waits for his owner every day.', 'Drama', 'sad', 2009, 'hachi.jpg'),
('Les Miserables', 'A man seeks redemption in harsh times.', 'Drama', 'sad', 2012, 'lesmis.jpg'),
('Blue Valentine', 'A couple struggles in their relationship.', 'Drama', 'sad', 2010, 'bluevalentine.jpg'),
('Mission Impossible Fallout', 'An agent races to stop a disaster.', 'Action', 'excited', 2018, 'fallout.jpg'),
('The Bourne Identity', 'A man discovers his true identity.', 'Action', 'excited', 2002, 'bourne.jpg'),
('Casino Royale', 'James Bond faces a dangerous enemy.', 'Action', 'excited', 2006, 'casino.jpg'),
('Skyfall', 'Bond protects his agency from threats.', 'Action', 'excited', 2012, 'skyfall.jpg'),
('Edge of Tomorrow', 'A soldier relives the same battle.', 'Sci-Fi', 'excited', 2014, 'edgeoftomorrow.jpg'),
('Ready Player One', 'A boy enters a virtual world adventure.', 'Sci-Fi', 'excited', 2018, 'readyplayerone.jpg'),
('Transformers', 'Robots battle for Earth.', 'Action', 'excited', 2007, 'transformers.jpg'),
('Pacific Rim', 'Humans fight monsters with giant robots.', 'Action', 'excited', 2013, 'pacificrim.jpg'),
('300', 'Spartans fight a massive army.', 'Action', 'excited', 2006, '300.jpg'),
('World War Z', 'A man tries to stop a zombie pandemic.', 'Action', 'excited', 2013, 'worldwarz.jpg'),
('Prisoners', 'A father searches for his missing daughter.', 'Thriller', 'overwhelmed', 2013, 'prisoners.jpg'),
('Gone Girl', 'A man becomes suspect in his wifes disappearance.', 'Thriller', 'overwhelmed', 2014, 'gonegirl.jpg'),
('Shutter Island', 'A detective investigates a mental hospital.', 'Thriller', 'overwhelmed', 2010, 'shutterisland.jpg'),
('Fight Club', 'A man creates an underground fight club.', 'Drama', 'overwhelmed', 1999, 'fightclub.jpg'),
('American Beauty', 'A man questions his life choices.', 'Drama', 'overwhelmed', 1999, 'americanbeauty.jpg'),
('The Social Network', 'The story behind Facebook creation.', 'Drama', 'overwhelmed', 2010, 'socialnetwork.jpg'),
('No Country for Old Men', 'A man is chased by a killer.', 'Thriller', 'overwhelmed', 2007, 'nocountry.jpg'),
('Zodiac', 'Journalists hunt a serial killer.', 'Thriller', 'overwhelmed', 2007, 'zodiac.jpg'),
('The Platform', 'A prison tests human behavior.', 'Thriller', 'overwhelmed', 2019, 'platform.jpg'),
('Enemy', 'A man meets his identical double.', 'Thriller', 'overwhelmed', 2013, 'enemy.jpg'),
('Dumb and Dumber', 'Two friends go on a silly trip.', 'Comedy', 'bored', 1994, 'dumb.jpg'),
('Ace Ventura', 'A detective searches for a missing animal.', 'Comedy', 'bored', 1994, 'aceventura.jpg'),
('The Hangover', 'Friends wake up after a wild night.', 'Comedy', 'bored', 2009, 'hangover.jpg'),
('Step Brothers', 'Two adults behave like children.', 'Comedy', 'bored', 2008, 'stepbrothers.jpg'),
('White Chicks', 'Agents go undercover in disguise.', 'Comedy', 'bored', 2004, 'whitechicks.jpg'),
('Get Smart', 'A clumsy agent saves the world.', 'Comedy', 'bored', 2008, 'getsmart.jpg'),
('Paul Blart Mall Cop', 'A security guard saves a mall.', 'Comedy', 'bored', 2009, 'mallcop.jpg'),
('Central Intelligence', 'A spy reunites with an old friend.', 'Comedy', 'bored', 2016, 'central.jpg'),
('Ride Along', 'A cop tests his future brother in law.', 'Comedy', 'bored', 2014, 'ridealong.jpg'),
('The Pink Panther', 'A detective solves a theft case.', 'Comedy', 'bored', 2006, 'pinkpanther.jpg'),