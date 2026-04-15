// ============================================
// api-client.js — Toutes les fonctions pour
// parler au backend PHP depuis le navigateur
// ============================================

//Rq: JSON = format pour envoyer des données (comme un objet JS)

// JSON.stringify() convertit un objet JavaScript en une chaîne JSON, ce qui est nécessaire pour envoyer des données au serveur dans une requête POST.
// l@ de base du backend
//en local avec XAMPP:'/backend/api
const API='/backend/api';

//-----------------------------------
//WATCHLIST
//-----------------------------------

// Ajouter un film à la watchlist
async function addToWatchlist(movieId) {
    // on envoie une requête POST au fichier watchlist.php
    const response = await fetch(API + '/watchlist.php', {
        method: 'POST', //On envoie des données (pas juste lire)
        headers: { 'Content-Type': 'application/json' }, //Les données que j’envoie sont en format JSON
        body: JSON.stringify({ movie_id: movieId }) // on envoie l'ID du film (c’est les données envoyées au serveur)
    });
  
    const data = await response.json(); // on lit la réponse du PHP

    if (data.succes) {
        alert('success ' + data.message);
    } else {
        alert('echec ' + data.erreur);
    }
  }

  // Supprimer un film de la watchlist
async function removeFromWatchlist(movieId) {
    const response = await fetch(API + '/watchlist.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: movieId })
    });

    const data = await response.json();
    alert(data.message || data.erreur);
}




//-----------------------------------
// LIKES
// ----------------------------------

// Liker un film (liked = true) ou disliker (liked = false)
async function likeMovie(movieId, liked = true) {
    const response = await fetch(API + '/likes.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: movieId, liked: liked })
    });

    const data = await response.json();

    if (data.succes) {
        // On met à jour le compteur affiché sur la page
        const compteur = document.getElementById('likes-' + movieId);
        if (compteur) compteur.textContent = data.total_likes;
        alert(data.message);
    }
}

// ──────────────────────────────────────────
// COMMENTAIRES
// ──────────────────────────────────────────

// Charger et afficher les commentaires d'un film
async function loadComments(movieId) {
    const response = await fetch(API + '/comments.php?movie_id=' + movieId);
    const data = await response.json();

    // On trouve la div où afficher les commentaires
    const container = document.getElementById('comments-list');
    if (!container) return;

    container.innerHTML = ''; // on vide d'abord

    // Pour chaque commentaire, on crée un bloc HTML
    data.comments.forEach(comment => {
        container.innerHTML += `
            <div style="border: 1px solid #ccc; padding: 10px; margin: 5px 0; border-radius: 8px;">
                <strong>${comment.username}</strong>
                <p>${comment.content}</p>
                <small>${comment.created_at}</small>
            </div>
        `;
    });
}

// Envoyer un nouveau commentaire
async function addComment(movieId) {
    // On récupère le texte écrit dans le champ
    const champ = document.getElementById('comment-input');
    const texte = champ.value.trim();

    if (!texte) {
        alert('Écris un commentaire d\'abord !');
        return;
    }

    const response = await fetch(API + '/comments.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: movieId, content: texte })
    });

    const data = await response.json();

    if (data.succes) {
        champ.value = '';           // on vide le champ
        loadComments(movieId);      // on recharge les commentaires
    } else {
        alert('❌ ' + data.erreur);
    }
}


// ──────────────────────────────────────────
// NOTES (ÉTOILES)
// ──────────────────────────────────────────

// Envoyer une note pour un film
async function rateMovie(movieId, note) {
    const response = await fetch(API + '/ratings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: movieId, rating: note })
    });

    const data = await response.json();
    alert(data.message || data.erreur);
}

