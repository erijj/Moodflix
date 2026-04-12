/* ============================================
   MOODFLIX — API Client (api-client.js)
   Plug this into any page that needs backend features.
   It extends your existing Storage object from main.js
   and talks to the PHP backend.
   ============================================ */

const API = (() => {

  // ── Base fetch helper ──────────────────────
  async function req(url, method = 'GET', body = null) {
    const opts = {
      method,
      credentials: 'same-origin',   // sends session cookie
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    const res  = await fetch(url, opts);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  // ── AUTH ──────────────────────────────────
  const Auth = {
    register: (username, email, password) =>
      req('/api/auth.php?action=register', 'POST', { username, email, password }),

    login: (email, password) =>
      req('/api/auth.php?action=login', 'POST', { email, password }),

    logout: () =>
      req('/api/auth.php?action=logout', 'POST'),

    me: () =>
      req('/api/auth.php?action=me', 'GET'),
  };

  // ── WATCHLIST ─────────────────────────────
  const Watchlist = {
    getAll: () =>
      req('/api/watchlist.php'),

    add: (movie_id) =>
      req('/api/watchlist.php', 'POST', { movie_id }),

    remove: (movie_id) =>
      req('/api/watchlist.php', 'DELETE', { movie_id }),

    // 🎲 Surprise movie — returns a random movie_id from watchlist
    surprise: () =>
      req('/api/watchlist.php?surprise=1'),
  };

  // ── LIKES ─────────────────────────────────
  const Likes = {
    getAll: () =>
      req('/api/likes.php'),

    getForMovie: (movie_id) =>
      req(`/api/likes.php?movie_id=${movie_id}`),

    // liked = true (❤️) or false (💔)
    set: (movie_id, liked = true) =>
      req('/api/likes.php', 'POST', { movie_id, liked }),

    remove: (movie_id) =>
      req('/api/likes.php', 'DELETE', { movie_id }),
  };

  // ── COMMENTS ──────────────────────────────
  const Comments = {
    // sort: 'newest' | 'oldest'
    getForMovie: (movie_id, page = 1, sort = 'newest') =>
      req(`/api/comments.php?movie_id=${movie_id}&page=${page}&sort=${sort}`),

    add: (movie_id, content) =>
      req('/api/comments.php', 'POST', { movie_id, content }),

    delete: (comment_id) =>
      req('/api/comments.php', 'DELETE', { comment_id }),
  };

  // ── RATINGS ───────────────────────────────
  const Ratings = {
    getForMovie: (movie_id) =>
      req(`/api/ratings.php?movie_id=${movie_id}`),

    set: (movie_id, rating) =>
      req('/api/ratings.php', 'POST', { movie_id, rating }),

    remove: (movie_id) =>
      req('/api/ratings.php', 'DELETE', { movie_id }),
  };

  return { Auth, Watchlist, Likes, Comments, Ratings };
})();


/* ============================================
   UI HELPERS — Drop these anywhere you need
   interactive watchlist/like/rating buttons.
   ============================================ */

// ── Watchlist toggle button ────────────────
async function toggleWatchlist(movieId, btn) {
  try {
    const inList = btn.classList.contains('in-watchlist');
    if (inList) {
      await API.Watchlist.remove(movieId);
      btn.classList.remove('in-watchlist');
      btn.textContent = '+ Watchlist';
      showToast('Removed from watchlist.');
    } else {
      await API.Watchlist.add(movieId);
      btn.classList.add('in-watchlist');
      btn.textContent = '✓ Watchlist';
      showToast('Added to watchlist! 🎬');
    }
  } catch (err) {
    if (err.message.includes('Unauthorized')) {
      showToast('Please log in first.');
      navigateTo('/frontend/pages/profile.html');
    } else {
      showToast(err.message);
    }
  }
}

// ── Like button ────────────────────────────
async function toggleLike(movieId, btn) {
  try {
    const liked = btn.classList.contains('liked');
    if (liked) {
      await API.Likes.remove(movieId);
      btn.classList.remove('liked');
      showToast('Like removed.');
    } else {
      const res = await API.Likes.set(movieId, true);
      btn.classList.add('liked');
      // Update count badge if present
      const badge = btn.querySelector('.like-count');
      if (badge) badge.textContent = res.total_likes;
      showToast('Movie liked! ❤️');
    }
  } catch (err) {
    if (err.message.includes('Unauthorized')) {
      showToast('Please log in first.');
      navigateTo('/frontend/pages/profile.html');
    } else {
      showToast(err.message);
    }
  }
}

// ── Star rating ────────────────────────────
async function submitRating(movieId, stars) {
  try {
    const res = await API.Ratings.set(movieId, stars);
    showToast(res.message);
    // Update displayed average if element exists
    const avgEl = document.querySelector(`[data-avg-rating="${movieId}"]`);
    if (avgEl && res.stats.avg_rating) {
      avgEl.textContent = res.stats.avg_rating + ' ⭐';
    }
  } catch (err) {
    if (err.message.includes('Unauthorized')) {
      showToast('Please log in to rate movies.');
      navigateTo('/frontend/pages/profile.html');
    } else {
      showToast(err.message);
    }
  }
}

// ── Surprise movie ─────────────────────────
async function surpriseMovie() {
  try {
    const res = await API.Watchlist.surprise();
    // Find movie in local MOVIES database and navigate
    const movie = ALL_MOVIES.find(m => m.id === res.movie_id);
    if (movie) {
      showToast(`🎲 Surprise! Watching "${movie.title}"`);
      setTimeout(() => navigateTo(`/frontend/pages/movie.html?id=${res.movie_id}`), 1200);
    } else {
      showToast(`🎲 Random pick: ${res.movie_id}`);
    }
  } catch (err) {
    showToast(err.message);
  }
}

// ── Render comments section ────────────────
async function loadComments(movieId, container) {
  try {
    const res = await API.Comments.getForMovie(movieId);
    container.innerHTML = '';

    if (res.comments.length === 0) {
      container.innerHTML = '<p style="opacity:0.5;font-size:0.9rem">No comments yet. Be the first!</p>';
      return;
    }

    res.comments.forEach(c => {
      const div = document.createElement('div');
      div.className = 'comment-item glass-card';
      div.style.cssText = 'padding:1rem 1.2rem;margin-bottom:0.8rem;border-radius:12px';
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem">
          <strong style="font-size:0.9rem">${escapeHtml(c.username)}</strong>
          <span style="font-size:0.75rem;opacity:0.5">${formatDate(c.created_at)}</span>
        </div>
        <p style="margin:0;font-size:0.9rem;opacity:0.85;line-height:1.5">${escapeHtml(c.content)}</p>
        ${c.is_mine ? `<button onclick="deleteComment(${c.id}, this.closest('.comment-item'))"
          style="margin-top:0.5rem;font-size:0.75rem;opacity:0.5;background:none;border:none;
                 color:var(--pink);cursor:pointer">🗑 Delete</button>` : ''}
      `;
      container.appendChild(div);
    });

    // Pagination
    if (res.total_pages > 1) {
      const pager = document.createElement('div');
      pager.style.cssText = 'display:flex;gap:0.5rem;margin-top:1rem;justify-content:center;flex-wrap:wrap';
      for (let p = 1; p <= res.total_pages; p++) {
        const btn = document.createElement('button');
        btn.textContent = p;
        btn.className = 'btn btn-glass';
        btn.style.cssText = 'padding:0.3rem 0.8rem;font-size:0.8rem';
        if (p === res.page) btn.style.borderColor = 'var(--pink)';
        btn.onclick = () => loadComments(movieId, container, p);
        pager.appendChild(btn);
      }
      container.appendChild(pager);
    }
  } catch (err) {
    container.innerHTML = `<p style="color:var(--pink)">${err.message}</p>`;
  }
}

async function deleteComment(commentId, el) {
  if (!confirm('Delete this comment?')) return;
  try {
    await API.Comments.delete(commentId);
    el.remove();
    showToast('Comment deleted.');
  } catch (err) {
    showToast(err.message);
  }
}

// ── Utilities ─────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}