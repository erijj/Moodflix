/* ============================================
   MOODFLIX — Global JavaScript
   ============================================ */

// ── Custom Cursor ──
(function initCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(cursor, ring);

  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
  });
  function animateRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a, button, .btn, .movie-card, .mood-btn, .star').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1.8)';
      cursor.style.background = 'var(--snapdragon)';
      ring.style.width = '50px'; ring.style.height = '50px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      cursor.style.background = 'var(--pink)';
      ring.style.width = '36px'; ring.style.height = '36px';
    });
  });
})();

// ── Particles ──
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['rgba(157,170,209,0.5)','rgba(245,143,154,0.4)','rgba(142,175,146,0.4)','rgba(244,201,132,0.4)','rgba(193,187,122,0.35)'];

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.r = Math.random() * 3 + 1;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4 - 0.3;
      this.alpha = Math.random() * 0.6 + 0.2;
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    draw() {
      ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.alpha -= 0.0008;
      if (this.alpha <= 0 || this.y < -10) this.reset();
    }
  }

  const particles = Array.from({length: 80}, () => new Particle());
  function loop() { ctx.clearRect(0, 0, W, H); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(loop); }
  loop();
})();

// ── Ripple ──
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn, button');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);
});

// ── Page Transition ──
function navigateTo(url) {
  const overlay = document.querySelector('.page-overlay') || (() => { const el = document.createElement('div'); el.className = 'page-overlay'; document.body.appendChild(el); return el; })();
  overlay.classList.add('entering');
  setTimeout(() => window.location.href = url, 500);
}

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.querySelector('.page-overlay');
  if (overlay) { overlay.classList.add('entering'); setTimeout(() => overlay.classList.remove('entering'), 50); }

  document.querySelectorAll('a[data-transition]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigateTo(a.href); });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const ham = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (ham && navLinks) ham.addEventListener('click', () => navLinks.classList.toggle('open'));
});

// ── Toast ──
function showToast(msg, duration = 3000) {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), duration);
}

// ── Storage ──
const Storage = {
  getLiked: () => JSON.parse(localStorage.getItem('moodflix_liked') || '[]'),
  setLiked: v => localStorage.setItem('moodflix_liked', JSON.stringify(v)),
  getWatchlist: () => JSON.parse(localStorage.getItem('moodflix_watchlist') || '[]'),
  setWatchlist: v => localStorage.setItem('moodflix_watchlist', JSON.stringify(v)),
  getComments: id => JSON.parse(localStorage.getItem(`moodflix_comments_${id}`) || '[]'),
  setComments: (id, v) => localStorage.setItem(`moodflix_comments_${id}`, JSON.stringify(v)),
  getRating: id => parseInt(localStorage.getItem(`moodflix_rating_${id}`) || '0'),
  setRating: (id, v) => localStorage.setItem(`moodflix_rating_${id}`, v),
  addLiked(movie) { const l = this.getLiked(); if (!l.find(m => m.id === movie.id)) { l.push(movie); this.setLiked(l); return true; } return false; },
  addWatchlist(movie) { const l = this.getWatchlist(); if (!l.find(m => m.id === movie.id)) { l.push(movie); this.setWatchlist(l); return true; } return false; }
};

// ── Movie Database ──
const MOVIES = {
  happy: [
    { id: 'h1', title: 'La La Land', year: 2016, mood: 'happy', genres: ['Musical', 'Romance', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', overview: 'A jazz musician and an aspiring actress fall in love while pursuing their dreams in Los Angeles.' },
    { id: 'h2', title: 'Mamma Mia!', year: 2008, mood: 'happy', genres: ['Musical', 'Comedy', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/c9vLLv9pgNVJfbcJdGQDvJxOtIE.jpg', overview: 'A young woman wants her father to give her away at her wedding, but does not know which of three men is her dad.' },
    { id: 'h3', title: 'The Grand Budapest Hotel', year: 2014, mood: 'happy', genres: ['Comedy', 'Adventure', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', overview: 'The adventures of a legendary concierge and his lobby boy protégé at a famous European hotel.' },
    { id: 'h4', title: 'Paddington 2', year: 2017, mood: 'happy', genres: ['Family', 'Comedy', 'Adventure'], poster: 'https://image.tmdb.org/t/p/w500/XEGtONfm3MFvX2lSgHANSCJiZS.jpg', overview: 'Paddington is happily settled with the Brown family in London when he sets his sights on a unique pop-up book.' },
    { id: 'h5', title: "Singin' in the Rain", year: 1952, mood: 'happy', genres: ['Musical', 'Comedy', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/w1AzNiAa3PxCBnCKxGBpzQBLFcZ.jpg', overview: 'A silent film star falls for a chorus girl just as he and his studio are trying to switch to talking pictures.' },
    { id: 'h6', title: 'The Secret Life of Walter Mitty', year: 2013, mood: 'happy', genres: ['Adventure', 'Comedy', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/2c17eMFcE6lOSHJkADErfT1UoLE.jpg', overview: 'When his job is threatened, a timid magazine photo manager embarks on a worldwide adventure.' },
    { id: 'h7', title: 'The Shawshank Redemption', year: 1994, mood: 'happy', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', overview: 'Two imprisoned men bond over several years, finding solace and eventual redemption through acts of common decency.' },
    { id: 'h8', title: 'Forrest Gump', year: 1994, mood: 'happy', genres: ['Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', overview: 'The presidencies of Kennedy and Johnson, Vietnam, Watergate unfold from the perspective of an Alabama man with an extraordinary life.' },
    { id: 'h9', title: 'The Lion King', year: 1994, mood: 'happy', genres: ['Animation', 'Adventure', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg', overview: 'Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself.' },
    { id: 'h10', title: 'Coco', year: 2017, mood: 'happy', genres: ['Animation', 'Adventure', 'Family'], poster: 'https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg', overview: 'Aspiring musician Miguel crosses into the Land of the Dead to find his great-great-grandfather, a legendary singer.' },
    { id: 'h11', title: 'Inside Out', year: 2015, mood: 'happy', genres: ['Animation', 'Adventure', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/aAmfIX37osiA6UBm5kLBGosOJjz.jpg', overview: 'After young Riley is uprooted from her Midwest life, her emotions — Joy, Fear, Anger, Disgust and Sadness — conflict on how to navigate a new city.' },
  ],
  sad: [
    { id: 's1', title: "Schindler's List", year: 1993, mood: 'sad', genres: ['Drama', 'History', 'War'], poster: 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', overview: 'In German-occupied Poland during WWII, Oskar Schindler gradually becomes concerned for his Jewish workforce.' },
    { id: 's2', title: 'Eternal Sunshine of the Spotless Mind', year: 2004, mood: 'sad', genres: ['Drama', 'Romance', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/5MwkWH9tYHv3mV9OdYTMR5qreIz.jpg', overview: 'When their relationship turns sour, a couple undergoes a medical procedure to erase each other from their memories.' },
    { id: 's3', title: 'Manchester by the Sea', year: 2016, mood: 'sad', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/jFLMPKiRZdMnPnekQEMSTZBQnIw.jpg', overview: 'A man returns to his hometown after the death of his brother and must care for his teenage nephew.' },
    { id: 's4', title: 'The Notebook', year: 2004, mood: 'sad', genres: ['Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/rNzQyW4f8B8cQeg7Dgj3n6eT5k9.jpg', overview: 'A passionate young man falls in love with a rich young woman, torn apart by her family.' },
    { id: 's5', title: 'Requiem for a Dream', year: 2000, mood: 'sad', genres: ['Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/nOd6vjEmzCT0k4VYqsA2hwyi87C.jpg', overview: 'The drug-induced utopias of four Coney Island people are shattered when their addictions become reality.' },
    { id: 's6', title: 'Her', year: 2013, mood: 'sad', genres: ['Drama', 'Romance', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/eFRRjudo8oMKKicGFRpOiRNYbFS.jpg', overview: 'A lonely writer develops an unlikely relationship with an artificially intelligent voice assistant.' },
    { id: 's7', title: '500 Days of Summer', year: 2009, mood: 'sad', genres: ['Comedy', 'Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/6iMiZ9oMtMcpMz6MjGRYHwbxfbd.jpg', overview: 'An offbeat romantic comedy about a woman who does not believe in love, and the man who falls for her anyway.' },
    { id: 's8', title: 'Marriage Story', year: 2019, mood: 'sad', genres: ['Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/pZekG6xabTmZxjmYw10lF2Kzk5A.jpg', overview: 'A stage director and his actor wife struggle through a grueling coast-to-coast divorce that pushes them to their extremes.' },
    { id: 's9', title: 'Moonlight', year: 2016, mood: 'sad', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/4911T5FbJ9eD2Faz5Z8cT3SUhU3.jpg', overview: "A young man's life story is told in three chapters as he grows up in a rough Miami neighborhood." },
    { id: 's10', title: 'Joker', year: 2019, mood: 'sad', genres: ['Crime', 'Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', overview: 'A mentally troubled comedian embarks on a downward spiral of revolution and bloody crime in Gotham City.' },
  ],
  romantic: [
    { id: 'r1', title: 'Pride & Prejudice', year: 2005, mood: 'romantic', genres: ['Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/bkoDsn4BM6v4PGvBmEPSKZEiApf.jpg', overview: 'Sparks fly when spirited Elizabeth Bennet meets the proud and wealthy Mr. Darcy.' },
    { id: 'r2', title: 'Before Sunrise', year: 1995, mood: 'romantic', genres: ['Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/6ddBFjRNKMb01y0TtIy4y4WJi7u.jpg', overview: 'A young man and woman meet on a train in Europe and agree to spend one evening together in Vienna.' },
    { id: 'r3', title: 'Call Me By Your Name', year: 2017, mood: 'romantic', genres: ['Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/rbCPQQSP8lHPOtK7Q8G3Kdlp3LT.jpg', overview: 'In 1983 Italy, romance blossoms between a seventeen-year-old student and a scholar hired by his father.' },
    { id: 'r4', title: 'Amélie', year: 2001, mood: 'romantic', genres: ['Comedy', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/f7braqOFyFqFGISLo3gCgalXMxp.jpg', overview: 'A whimsical Parisian waitress devotes herself to helping others while finding love along the way.' },
    { id: 'r5', title: 'Titanic', year: 1997, mood: 'romantic', genres: ['Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', overview: 'A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the ill-fated R.M.S. Titanic.' },
    { id: 'r6', title: 'Casablanca', year: 1942, mood: 'romantic', genres: ['Drama', 'Romance', 'War'], poster: 'https://image.tmdb.org/t/p/w500/5K7cOHoay2mZusSLezBOY0Qxh8a.jpg', overview: 'A cynical American café owner in Casablanca must choose between love and virtue.' },
    { id: 'r7', title: 'Portrait of a Lady on Fire', year: 2019, mood: 'romantic', genres: ['Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/3a5S4MkRQOqRkFqxuFSjCM8NGar.jpg', overview: 'In 18th century France, a painter is commissioned to do a wedding portrait of a young woman in secret.' },
    { id: 'r8', title: 'Your Name', year: 2016, mood: 'romantic', genres: ['Animation', 'Drama', 'Fantasy'], poster: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg', overview: 'Two strangers find themselves linked in a bizarre way, experiencing each other\'s lives in their dreams.' },
  ],
  excited: [
    { id: 'e1', title: 'Mad Max: Fury Road', year: 2015, mood: 'excited', genres: ['Action', 'Adventure', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg', overview: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search of her homeland.' },
    { id: 'e2', title: 'Inception', year: 2010, mood: 'excited', genres: ['Action', 'Sci-Fi', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', overview: 'A thief who steals corporate secrets through dream-sharing is given the inverse task of planting an idea.' },
    { id: 'e3', title: 'Top Gun: Maverick', year: 2022, mood: 'excited', genres: ['Action', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/62HCnUTHk3iq1uf7Bv0U1XOB0F2.jpg', overview: 'After 30 years, Maverick is still pushing the envelope as a top naval aviator, confronting his past.' },
    { id: 'e4', title: 'Everything Everywhere All at Once', year: 2022, mood: 'excited', genres: ['Action', 'Comedy', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', overview: 'An aging Chinese immigrant is swept up in an insane adventure where she alone can save the world by exploring other universes.' },
    { id: 'e5', title: 'The Dark Knight', year: 2008, mood: 'excited', genres: ['Action', 'Crime', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', overview: 'When the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.' },
    { id: 'e6', title: 'Interstellar', year: 2014, mood: 'excited', genres: ['Adventure', 'Drama', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', overview: 'A team of explorers travel through a wormhole in space to ensure humanity\'s survival.' },
    { id: 'e7', title: 'Parasite', year: 2019, mood: 'excited', genres: ['Comedy', 'Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', overview: 'Greed and class discrimination threaten the newly formed relationship between a wealthy family and a destitute one.' },
    { id: 'e8', title: 'Pulp Fiction', year: 1994, mood: 'excited', genres: ['Crime', 'Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', overview: 'The lives of two mob hitmen, a boxer, a gangster, and his wife intertwine in four tales of violence and redemption.' },
    { id: 'e9', title: 'Whiplash', year: 2014, mood: 'excited', genres: ['Drama', 'Musical'], poster: 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg', overview: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams are savagely challenged.' },
    { id: 'e10', title: 'Dune', year: 2021, mood: 'excited', genres: ['Adventure', 'Drama', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/d5NXSklpcvweasTZkljuDrzMQGm.jpg', overview: 'A noble family becomes embroiled in a war for control over the galaxy\'s most valuable asset.' },
    { id: 'e11', title: 'Get Out', year: 2017, mood: 'excited', genres: ['Horror', 'Mystery', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg', overview: 'A young Black man visits his white girlfriend\'s family estate, where a series of disturbing discoveries unfold.' },
    { id: 'e12', title: 'The Revenant', year: 2015, mood: 'excited', genres: ['Action', 'Adventure', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/ie7WTBB1CVdg3GK0iamE8M2A8TE.jpg', overview: 'A frontiersman fights for survival after being left for dead following a brutal bear attack.' },
  ],
  overwhelmed: [
    { id: 'o1', title: 'Spirited Away', year: 2001, mood: 'overwhelmed', genres: ['Animation', 'Fantasy', 'Adventure'], poster: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', overview: 'A ten-year-old girl enters a world ruled by gods, witches, and spirits to rescue her parents.' },
    { id: 'o2', title: 'My Neighbor Totoro', year: 1988, mood: 'overwhelmed', genres: ['Animation', 'Family', 'Fantasy'], poster: 'https://image.tmdb.org/t/p/w500/rtGDOeG9LzoerkDGZF9dnVeLppL.jpg', overview: 'When two girls move to the country to be near their ailing mother, they discover the magical spirit of the forest.' },
    { id: 'o3', title: 'A Beautiful Mind', year: 2001, mood: 'overwhelmed', genres: ['Biography', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/84tGDuPbBFgWu3fFDYhB31s3BPo.jpg', overview: 'A brilliant mathematician fights to overcome schizophrenia while making groundbreaking mathematical discoveries.' },
    { id: 'o4', title: 'Into the Wild', year: 2007, mood: 'overwhelmed', genres: ['Adventure', 'Biography', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/bvJOpyHYWACDusvQvXxKEHFNjce.jpg', overview: 'After graduating from Emory University, Christopher McCandless abandons possessions to live in the wild.' },
    { id: 'o5', title: 'Chef', year: 2014, mood: 'overwhelmed', genres: ['Comedy', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/sBbfPeMnElb89FJqnVKQahQPZBa.jpg', overview: 'A chef quits his restaurant job to start a food truck and reconnects with his passion and son.' },
    { id: 'o6', title: 'Soul', year: 2020, mood: 'overwhelmed', genres: ['Animation', 'Adventure', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg', overview: 'A musician who has lost his passion for music is transported out of his body and must find his way back to life.' },
    { id: 'o7', title: 'Arrival', year: 2016, mood: 'overwhelmed', genres: ['Drama', 'Mystery', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg', overview: 'A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.' },
    { id: 'o8', title: 'The Way', year: 2010, mood: 'overwhelmed', genres: ['Adventure', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/nQGKEiFbOdVbIBKpDMzKuBHy9Xo.jpg', overview: 'A father walks the Camino de Santiago in memory of his son who died while trekking it.' },
  ],
  bored: [
    { id: 'b1', title: "Ocean's Eleven", year: 2001, mood: 'bored', genres: ['Comedy', 'Crime', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/o0h76DVXvk5OKjmNez5YY0GODC2.jpg', overview: 'Danny Ocean and his eleven accomplices plan to rob three Las Vegas casinos simultaneously.' },
    { id: 'b2', title: 'Knives Out', year: 2019, mood: 'bored', genres: ['Comedy', 'Crime', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/pThyQovXQrws2hmlijbFAjhL7kN.jpg', overview: 'A detective investigates the death of a patriarch of an eccentric, combative family.' },
    { id: 'b3', title: 'The Princess Bride', year: 1987, mood: 'bored', genres: ['Adventure', 'Comedy', 'Fantasy'], poster: 'https://image.tmdb.org/t/p/w500/2fc4ifMnSVBMd3lHIkFOvJtaHlq.jpg', overview: 'A grandfather tells his grandson a story about Westley, the Dread Pirate Roberts, and true love.' },
    { id: 'b4', title: 'Game Night', year: 2018, mood: 'bored', genres: ['Action', 'Comedy', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/wr2b8cA0ECNXMvqXOsRLh25P9ZX.jpg', overview: 'A group of friends at game night find themselves unwittingly entangled in a real-life mystery.' },
    { id: 'b5', title: 'Clue', year: 1985, mood: 'bored', genres: ['Comedy', 'Mystery', 'Crime'], poster: 'https://image.tmdb.org/t/p/w500/xowdMJQEFYbJuDGjUAtaqWCLB9T.jpg', overview: 'Six guests are invited to a strange house and must cooperate with the staff to solve a murder mystery.' },
    { id: 'b6', title: 'The Truman Show', year: 1998, mood: 'bored', genres: ['Comedy', 'Drama', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/vuza0WqY239yBXOadKlGwJsZJFE.jpg', overview: 'An insurance salesman slowly discovers his whole life is actually a reality TV show.' },
    { id: 'b7', title: 'The Silence of the Lambs', year: 1991, mood: 'bored', genres: ['Crime', 'Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg', overview: 'A young FBI cadet must rely on a manipulative serial killer to help catch another killer.' },
    { id: 'b8', title: 'Midsommar', year: 2019, mood: 'bored', genres: ['Drama', 'Horror', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/7LEI8ulZzO5gy9Ww2NVCrKmHeDZ.jpg', overview: 'A couple travel to Sweden for a midsummer festival. What begins as an idyllic retreat devolves into something sinister.' },
  ]
};

// ── Flat deduplicated list ──
const ALL_MOVIES = (() => {
  const seen = new Set(), all = [];
  for (const films of Object.values(MOVIES)) {
    for (const f of films) { if (!seen.has(f.id)) { seen.add(f.id); all.push(f); } }
  }
  return all;
})();

// ── All genres ──
const ALL_GENRES = [...new Set(ALL_MOVIES.flatMap(f => f.genres))].sort();
