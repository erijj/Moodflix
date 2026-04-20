
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


function showToast(msg, duration = 3000) {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), duration);
}


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


const MOVIES = {

  
  happy: [
    { id: 'h1', title: 'La La Land', year: 2016, mood: 'happy', genres: ['Musical', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', overview: 'A jazz musician and an aspiring actress fall in love while pursuing their dreams in Los Angeles.' },
    { id: 'h2', title: 'Mamma Mia!', year: 2008, mood: 'happy', genres: ['Musical', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/c9vLLv9pgNVJfbcJdGQDvJxOtIE.jpg', overview: 'A young woman wants her father to give her away at her wedding, but does not know which of three men is her dad.' },
    { id: 'h3', title: 'The Grand Budapest Hotel', year: 2014, mood: 'happy', genres: ['Comedy', 'Adventure'], poster: 'https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', overview: 'The adventures of a legendary concierge and his lobby boy protégé at a famous European hotel.' },
    { id: 'h4', title: 'Paddington 2', year: 2017, mood: 'happy', genres: ['Family', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/XEGtONfm3MFvX2lSgHANSCJiZS.jpg', overview: 'Paddington is happily settled with the Brown family in London when he sets his sights on a unique pop-up book.' },
    { id: 'h5', title: "Singin' in the Rain", year: 1952, mood: 'happy', genres: ['Musical', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/w1AzNiAa3PxCBnCKxGBpzQBLFcZ.jpg', overview: 'A silent film star falls for a chorus girl just as he and his studio are trying to switch to talking pictures.' },
    { id: 'h6', title: 'The Secret Life of Walter Mitty', year: 2013, mood: 'happy', genres: ['Adventure', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/2c17eMFcE6lOSHJkADErfT1UoLE.jpg', overview: 'When his job is threatened, a timid magazine photo manager embarks on a worldwide adventure.' },
    { id: 'h7', title: 'The Shawshank Redemption', year: 1994, mood: 'happy', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', overview: 'Two imprisoned men bond over several years, finding solace and eventual redemption through acts of common decency.' },
    { id: 'h8', title: 'Coco', year: 2017, mood: 'happy', genres: ['Animation', 'Family'], poster: 'https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg', overview: 'Aspiring musician Miguel crosses into the Land of the Dead to find his great-great-grandfather, a legendary singer.' },
    { id: 'h9', title: 'The Lion King', year: 1994, mood: 'happy', genres: ['Animation', 'Adventure'], poster: 'https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg', overview: 'Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself.' },
    { id: 'h10', title: 'Inside Out', year: 2015, mood: 'happy', genres: ['Animation', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/aAmfIX37osiA6UBm5kLBGosOJjz.jpg', overview: 'After young Riley is uprooted from her Midwest life, her emotions conflict on how to navigate a new city.' },
    { id: 'h11', title: 'Forrest Gump', year: 1994, mood: 'happy', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', overview: 'An Alabama man with an extraordinary life witnesses and influences many defining historical events.' },
  { id: 'h12', title: 'The Intern', year: 2015, mood: 'happy', genres: ['Comedy', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/9U7YHoA5rA9XJ7Xh3XrJg1s6GqM.jpg', overview: 'A warm and charming story about a retired man who discovers a new purpose. Light, inspiring and comforting.' },
  { id: 'h13', title: 'Legally Blonde', year: 2001, mood: 'happy', genres: ['Comedy', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/9gGZs9bR7J2c7Y9z0zGkJ5N3kz.jpg', overview: 'Bright, fun and empowering. A story about believing in yourself and proving everyone wrong.' },
  { id: 'h14', title: 'Mrs. Doubtfire', year: 1993, mood: 'happy', genres: ['Comedy', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/6oH378KUfCEitzJkm07r97L0RsZ.jpg', overview: 'A father goes to hilarious lengths to stay close to his children. Funny, emotional and full of heart.' },
  { id: 'h15', title: 'Toy Story', year: 1995, mood: 'happy', genres: ['Animation', 'Comedy', 'Family'], poster: 'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg', overview: 'A timeless adventure about friendship and loyalty. Pure joy for all ages.' },
  { id: 'h16', title: 'Finding Nemo', year: 2003, mood: 'happy', genres: ['Animation', 'Adventure', 'Family'], poster: 'https://image.tmdb.org/t/p/w500/eHuGQ10FUzK1mdOY69wF5pGgEf5.jpg', overview: 'A heartwarming journey across the ocean. Emotional, funny and visually beautiful.' },
  { id: 'h17', title: 'Up', year: 2009, mood: 'happy', genres: ['Animation', 'Adventure', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/vpbaStTMt8qqXaEgnOR2EE4DNJk.jpg', overview: 'A touching story about dreams, loss and new beginnings. Both joyful and deeply emotional.' },
  { id: 'h18', title: 'Shrek', year: 2001, mood: 'happy', genres: ['Animation', 'Comedy', 'Fantasy'], poster: 'https://image.tmdb.org/t/p/w500/iB64vpL3dIObOtMZgX3RqdVdQDc.jpg', overview: 'A hilarious twist on fairy tales. Fun, clever and full of unforgettable moments.' },
  { id: 'h19', title: 'Aladdin', year: 1992, mood: 'happy', genres: ['Animation', 'Adventure', 'Fantasy'], poster: 'https://image.tmdb.org/t/p/w500/3iYQTLGoy7QnjcUYRJy4YrAgGvp.jpg', overview: 'Magic, adventure and unforgettable music. A classic Disney joyride.' },
  { id: 'h20', title: 'The Holiday', year: 2006, mood: 'happy', genres: ['Romance', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/h1B7tW0t399VDjAcWJh8m87469b.jpg', overview: 'Two women swap homes and find love. Cozy, romantic and feel-good.' },
  { id: 'h21', title: 'Notting Hill', year: 1999, mood: 'happy', genres: ['Romance', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/9c7q6cM0hYl7E1W7n9bTz0wK0bH.jpg', overview: 'A simple man falls in love with a famous actress. Charming, sweet and iconic.' }
],

 
  sad: [
    { id: 's1', title: 'Good Will Hunting', year: 1997, mood: 'sad', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/bABCX7unBnJgXHBl3PGKSMVdgNS.jpg', overview: 'A janitor at MIT has a gift for mathematics but needs help to find direction in life. A story of hope and human connection.' },
    { id: 's2', title: 'Amelie', year: 2001, mood: 'sad', genres: ['Comedy', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/f7braqOFyFqFGISLo3gCgalXMxp.jpg', overview: 'A whimsical Parisian girl quietly changes the lives of those around her for the better — charming, warm and life-affirming.' },
    { id: 's3', title: 'The Intouchables', year: 2011, mood: 'sad', genres: ['Comedy', 'Drama', 'Biography'], poster: 'https://image.tmdb.org/t/p/w500/1e866QEObR2RU3MpIa6MkBPgKbR.jpg', overview: 'An unlikely friendship between a wealthy quadriplegic and his irreverent caregiver transforms both of their lives.' },
    { id: 's4', title: 'Hunt for the Wilderpeople', year: 2016, mood: 'sad', genres: ['Adventure', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/ydCpAM0VO9N7BLWJfHIy5Q4Tydq.jpg', overview: 'A young misfit and a grumpy man go on an unexpected adventure through the New Zealand bush. Funny and heartfelt.' },
    { id: 's5', title: 'Little Miss Sunshine', year: 2006, mood: 'sad', genres: ['Comedy', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/wkVHT7N0Rl3hY0GAMMZgKd5SVFE.jpg', overview: 'A dysfunctional family road trip to a children s beauty pageant. Hilarious, moving and deeply human.' },
    { id: 's6', title: 'My Neighbor Totoro', year: 1988, mood: 'sad', genres: ['Animation', 'Family'], poster: 'https://image.tmdb.org/t/p/w500/rtGDOeG9LzoerkDGZF9dnVeLppL.jpg', overview: 'Two sisters discover the magical spirit of the forest near their new home. Pure, gentle and full of wonder.' },
    { id: 's7', title: 'About Time', year: 2013, mood: 'sad', genres: ['Drama', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/zjJ8v7EHD0y5RHFqHbHlB6EY7Mf.jpg', overview: 'A man with the ability to travel in time discovers that life is precious enough to be lived twice. Warm and uplifting.' },
    { id: 's8', title: 'Chef', year: 2014, mood: 'sad', genres: ['Comedy', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/sBbfPeMnElb89FJqnVKQahQPZBa.jpg', overview: 'A chef rediscovers his passion by starting a food truck and rebuilds his relationship with his son on a road trip.' },
    { id: 's9', title: 'The Secret Life of Walter Mitty', year: 2013, mood: 'sad', genres: ['Adventure', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/2c17eMFcE6lOSHJkADErfT1UoLE.jpg', overview: 'A dreamer escapes his routine and discovers that real life can be far more extraordinary than any fantasy.' },
    { id: 's10', title: 'Soul', year: 2020, mood: 'sad', genres: ['Animation', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg', overview: 'A jazz musician discovers what it truly means to have a purpose and to be alive. Deeply moving and beautiful.' },
    { id: 's11', title: 'Titanic', year: 1997, mood: 'sad', genres: ['Romance', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', overview: 'A tragic love story set on the doomed Titanic. Epic, emotional and unforgettable.' },
  { id: 's12', title: 'The Notebook', year: 2004, mood: 'sad', genres: ['Romance', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/qom1SZSENdmHFNZBXbtJAU0WTlC.jpg', overview: 'A love story that endures through time, memory and loss. Deeply moving.' },
  { id: 's13', title: 'Seven Pounds', year: 2008, mood: 'sad', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/2v9FVVBUrrkW2m3QOcYkuhq9A6o.jpg', overview: 'A man seeks redemption through a life-changing sacrifice. Quiet and heartbreaking.' },
  { id: 's14', title: 'Philadelphia', year: 1993, mood: 'sad', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/2v3Vd1J6e6Z9eruqbWtaXDpUe1k.jpg', overview: 'A powerful story of injustice, courage and humanity. Emotional and important.' },
  { id: 's15', title: 'Marley & Me', year: 2008, mood: 'sad', genres: ['Drama', 'Comedy'], poster: 'https://image.tmdb.org/t/p/w500/8u9w3s5tJ3G3R7h5Z6q9z6k0l1F.jpg', overview: 'A family grows with their dog. Funny at first, but ultimately heartbreaking.' },
  { id: 's6', title: 'Room', year: 2015, mood: 'sad', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/pCURNjeomWbMSdiP64gj8NVVHTQ.jpg', overview: 'A mother and son escape captivity. Emotional, intense and deeply human.' },
  { id: 's17', title: 'The Boy in the Striped Pajamas', year: 2008, mood: 'sad', genres: ['Drama', 'War'], poster: 'https://image.tmdb.org/t/p/w500/sLw1gx7X8e3dFZp8nH4pWn7lJvP.jpg', overview: 'A tragic friendship during WWII. Innocence meets horror.' },
  { id: 's18', title: 'Hachi: A Dog\'s Tale', year: 2009, mood: 'sad', genres: ['Drama', 'Family'], poster: 'https://image.tmdb.org/t/p/w500/lm8fYkG7g1r7Lz4r5z7r3y4m2FQ.jpg', overview: 'A loyal dog waits every day for his owner. One of the most emotional stories ever told.' },
  { id: 's19', title: 'Les Misérables', year: 2012, mood: 'sad', genres: ['Drama', 'Musical'], poster: 'https://image.tmdb.org/t/p/w500/9O7gLzmreU0nGkIB6K3BsJbzvNv.jpg', overview: 'A story of redemption, suffering and hope. Powerful performances and music.' },
  { id: 's20', title: 'Blue Valentine', year: 2010, mood: 'sad', genres: ['Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/9s4R0Wf1pJbK0YqG0J4n5j3Lz7S.jpg', overview: 'A brutally honest look at love falling apart. Raw and painful.' }
],
  excited: [
    { id: 'e1', title: 'Mad Max: Fury Road', year: 2015, mood: 'excited', genres: ['Action', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg', overview: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search of her homeland.' },
    { id: 'e2', title: 'Inception', year: 2010, mood: 'excited', genres: ['Action', 'Sci-Fi', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', overview: 'A thief who steals corporate secrets through dream-sharing is given the inverse task of planting an idea.' },
    { id: 'e3', title: 'Top Gun: Maverick', year: 2022, mood: 'excited', genres: ['Action', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/62HCnUTHk3iq1uf7Bv0U1XOB0F2.jpg', overview: 'After 30 years, Maverick is still pushing the envelope as a top naval aviator, confronting his past.' },
    { id: 'e4', title: 'Everything Everywhere All at Once', year: 2022, mood: 'excited', genres: ['Action', 'Comedy', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', overview: 'An aging Chinese immigrant is swept up in an insane adventure where she alone can save the world by exploring other universes.' },
    { id: 'e5', title: 'The Dark Knight', year: 2008, mood: 'excited', genres: ['Action', 'Crime', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', overview: 'When the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological tests of his ability.' },
    { id: 'e6', title: 'Interstellar', year: 2014, mood: 'excited', genres: ['Adventure', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', overview: 'A team of explorers travel through a wormhole in space to ensure humanity\'s survival.' },
    { id: 'e7', title: 'Parasite', year: 2019, mood: 'excited', genres: ['Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', overview: 'Greed and class discrimination threaten the newly formed relationship between a wealthy family and a destitute one.' },
    { id: 'e8', title: 'Whiplash', year: 2014, mood: 'excited', genres: ['Drama', 'Musical'], poster: 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg', overview: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams are savagely challenged.' },
    { id: 'e9', title: 'Dune', year: 2021, mood: 'excited', genres: ['Adventure', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/d5NXSklpcvweasTZkljuDrzMQGm.jpg', overview: 'A noble family becomes embroiled in a war for control over the galaxy\'s most valuable asset.' },
    { id: 'e10', title: 'Get Out', year: 2017, mood: 'excited', genres: ['Horror', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg', overview: 'A young Black man visits his white girlfriend\'s family estate, where a series of disturbing discoveries unfold.' },
    { id: 'e11', title: 'The Revenant', year: 2015, mood: 'excited', genres: ['Action', 'Adventure'], poster: 'https://image.tmdb.org/t/p/w500/ie7WTBB1CVdg3GK0iamE8M2A8TE.jpg', overview: 'A frontiersman fights for survival after being left for dead following a brutal bear attack.' },
    { id: 'e12', title: 'Pulp Fiction', year: 1994, mood: 'excited', genres: ['Crime', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', overview: 'The lives of two mob hitmen, a boxer, a gangster, and his wife intertwine in four tales of violence and redemption.' },
  { id: 'e13', title: 'Mad Max: Fury Road', year: 2015, mood: 'excited', genres: ['Action', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg', overview: 'A relentless high-octane chase through the desert. Pure adrenaline from start to finish.' },
  { id: 'e14', title: 'Inception', year: 2010, mood: 'excited', genres: ['Action', 'Sci-Fi', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', overview: 'A mind-bending journey through dreams within dreams. Intelligent, thrilling and unforgettable.' },
  { id: 'e15', title: 'Top Gun: Maverick', year: 2022, mood: 'excited', genres: ['Action', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', overview: 'High-speed aerial action with emotional depth. A perfect blockbuster experience.' },
  { id: 'e16', title: 'Everything Everywhere All at Once', year: 2022, mood: 'excited', genres: ['Action', 'Comedy', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', overview: 'Wild, chaotic and endlessly creative. A multiverse adventure unlike anything else.' },
  { id: 'e17', title: 'The Dark Knight', year: 2008, mood: 'excited', genres: ['Action', 'Crime', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', overview: 'A dark, intense superhero masterpiece. Heath Ledger’s Joker steals the show.' },
  { id: 'e18', title: 'Interstellar', year: 2014, mood: 'excited', genres: ['Adventure', 'Sci-Fi', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg', overview: 'A breathtaking journey through space and time. Emotional, epic and visually stunning.' },
  { id: 'e19', title: 'Dune', year: 2021, mood: 'excited', genres: ['Adventure', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', overview: 'A visually epic sci-fi saga. Massive scale, intense battles and deep storytelling.' },
  { id: 'e20', title: 'Mission: Impossible – Fallout', year: 2018, mood: 'excited', genres: ['Action', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/AkJQpZp9WoNdj7pLYSj1L0RcMMN.jpg', overview: 'Non-stop action with insane stunts. One of the best action films ever made.' },
  { id: 'e21', title: 'Edge of Tomorrow', year: 2014, mood: 'excited', genres: ['Action', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/uUHvlkLavotfGsNtosDy8ShsIYF.jpg', overview: 'A soldier relives the same battle over and over. Smart, fun and action-packed.' },
  { id: 'e22', title: 'Ready Player One', year: 2018, mood: 'excited', genres: ['Adventure', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/pU1ULUq8D3iRxl1fdX2lZIzdHuI.jpg', overview: 'A thrilling virtual reality adventure full of nostalgia and fast-paced action.' }
],
  
  overwhelmed: [
    { id: 'o1', title: 'Schindler\'s List', year: 1993, mood: 'overwhelmed', genres: ['Drama', 'History'], poster: 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', overview: 'One man\'s courage saves over a thousand lives during the Holocaust. One of the most powerful films ever made.' },
    { id: 'o2', title: 'The Tree of Life', year: 2011, mood: 'overwhelmed', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/ya7qdVFGBKs0LJRFJqPKmCLEn7P.jpg', overview: 'A lyrical meditation on life, loss and the universe. Terrence Malick\'s deeply felt masterpiece.' },
    { id: 'o3', title: 'Manchester by the Sea', year: 2016, mood: 'overwhelmed', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/jFLMPKiRZdMnPnekQEMSTZBQnIw.jpg', overview: 'A quiet, devastating portrait of grief and guilt. Raw, honest and profoundly human.' },
    { id: 'o4', title: 'Moonlight', year: 2016, mood: 'overwhelmed', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/4911T5FbJ9eD2Faz5Z8cT3SUhU3.jpg', overview: 'A young man\'s life unfolds across three chapters in a rough Miami neighbourhood. Intimate and deeply felt.' },
    { id: 'o5', title: 'Eternal Sunshine of the Spotless Mind', year: 2004, mood: 'overwhelmed', genres: ['Drama', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/5MwkWH9tYHv3mV9OdYTMR5qreIz.jpg', overview: 'A couple erases each other from their memories — and realises what they had only when it is gone.' },
    { id: 'o6', title: 'Her', year: 2013, mood: 'overwhelmed', genres: ['Drama', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/eFRRjudo8oMKKicGFRpOiRNYbFS.jpg', overview: 'A lonely writer falls in love with an AI. A tender, aching film about connection and what it means to feel.' },
    { id: 'o7', title: 'Marriage Story', year: 2019, mood: 'overwhelmed', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/pZekG6xabTmZxjmYw10lF2Kzk5A.jpg', overview: 'A couple falling apart with grace and pain. Devastating performances and heartbreaking honesty.' },
    { id: 'o8', title: 'Grave of the Fireflies', year: 1988, mood: 'overwhelmed', genres: ['Animation', 'Drama', 'War'], poster: 'https://image.tmdb.org/t/p/w500/qG3RYlIVpTYclR9TYIsy8p7m7AT.jpg', overview: 'Two siblings struggle to survive in Japan during WWII. Perhaps the most emotionally devastating animated film ever made.' },
    { id: 'o9', title: 'Arrival', year: 2016, mood: 'overwhelmed', genres: ['Drama', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg', overview: 'A linguist deciphers an alien language and uncovers a truth that changes how she sees time and love.' },
    { id: 'o10', title: 'The Pianist', year: 2002, mood: 'overwhelmed', genres: ['Biography', 'Drama', 'War'], poster: 'https://image.tmdb.org/t/p/w500/2hFvxCCWrTmCYwfy7yum0GKRi3Y.jpg', overview: 'A Polish Jewish musician survives the destruction of the Warsaw ghetto through talent, luck and human kindness.' },

  { id: 'o11', title: 'Prisoners', year: 2013, mood: 'overwhelmed', genres: ['Thriller', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/uhviyknTT5cEQXbn6vWIqfM4vGm.jpg', overview: 'A father takes justice into his own hands when his daughter disappears. Dark, intense and morally complex.' },
  { id: 'o12', title: 'Gone Girl', year: 2014, mood: 'overwhelmed', genres: ['Thriller', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/gdiLTof3rbPDAmPaCf4g6op46bj.jpg', overview: 'A twisted story of marriage, media and manipulation. Full of shocking turns.' },
  { id: 'o13', title: 'Shutter Island', year: 2010, mood: 'overwhelmed', genres: ['Thriller', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/kve20tXwUZpu4GUX8l6X7Z4jmL6.jpg', overview: 'A psychological puzzle set in a mental institution. Haunting and mind-bending.' },
  { id: 'o14', title: 'Fight Club', year: 1999, mood: 'overwhelmed', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg', overview: 'A rebellious exploration of identity and society. Dark, philosophical and unforgettable.' },
  { id: 'o15', title: 'American Beauty', year: 1999, mood: 'overwhelmed', genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/wby9315QzVKdW9BonAefg8jGTTb.jpg', overview: 'A man questions his life and finds beauty in unexpected places. Deep and thought-provoking.' },
  { id: 'o16', title: 'The Social Network', year: 2010, mood: 'overwhelmed', genres: ['Drama', 'Biography'], poster: 'https://image.tmdb.org/t/p/w500/ok5Wh8385Kgblq9MSU4VGvazeMH.jpg', overview: 'The rise of Facebook and the cost of ambition. Sharp, fast and emotionally layered.' },
  { id: 'o17', title: 'No Country for Old Men', year: 2007, mood: 'overwhelmed', genres: ['Thriller', 'Crime'], poster: 'https://image.tmdb.org/t/p/w500/6d5XOczc226jECq0LIX0siKtgHR.jpg', overview: 'A relentless cat-and-mouse chase with a chilling villain. Tense and unforgettable.' },
  { id: 'o18', title: 'Zodiac', year: 2007, mood: 'overwhelmed', genres: ['Thriller', 'Crime'], poster: 'https://image.tmdb.org/t/p/w500/6YmeO4pB7XTh8P8F0kY0zZr4X8m.jpg', overview: 'Journalists obsess over a serial killer case. Slow-burn tension and realism.' },
  { id: 'o19', title: 'The Platform', year: 2019, mood: 'overwhelmed', genres: ['Thriller', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/7v5u3l2y7V2bV0h9yHn2pQzK0kD.jpg', overview: 'A brutal social experiment inside a vertical prison. Disturbing and symbolic.' },
  { id: 'o20', title: 'Enemy', year: 2013, mood: 'overwhelmed', genres: ['Thriller', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/vJ7h0P0Kc2kG3Q1l5w8Z9bJz0dP.jpg', overview: 'A man discovers his exact double. Strange, eerie and deeply unsettling.' }
],


  bored: [
    { id: 'b1', title: 'Knives Out', year: 2019, mood: 'bored', genres: ['Comedy', 'Mystery', 'Crime'], poster: 'https://image.tmdb.org/t/p/w500/pThyQovXQrws2hmlijbFAjhL7kN.jpg', overview: 'A wickedly clever whodunit that keeps you guessing. Impossible to be bored for a single second.' },
    { id: 'b2', title: 'The Truman Show', year: 1998, mood: 'bored', genres: ['Comedy', 'Drama', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/vuza0WqY239yBXOadKlGwJsZJFE.jpg', overview: 'A man slowly discovers his entire life is a TV show. Mind-bending, funny and impossible to put down.' },
    { id: 'b3', title: 'Spider-Man: Into the Spider-Verse', year: 2018, mood: 'bored', genres: ['Animation', 'Action', 'Adventure'], poster: 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', overview: 'A visually revolutionary animated film that reinvents the superhero genre. Pure visual joy and energy.' },
    { id: 'b4', title: 'Everything Everywhere All at Once', year: 2022, mood: 'bored', genres: ['Action', 'Comedy', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', overview: 'Chaotic, hilarious, emotional and unlike anything you have ever seen. Guaranteed to jolt you awake.' },
    { id: 'b5', title: "Ocean's Eleven", year: 2001, mood: 'bored', genres: ['Comedy', 'Crime', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/o0h76DVXvk5OKjmNez5YY0GODC2.jpg', overview: 'Slick, stylish and endlessly fun. A casino heist with effortless cool and non-stop entertainment.' },
    { id: 'b6', title: 'Game Night', year: 2018, mood: 'bored', genres: ['Action', 'Comedy', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/wr2b8cA0ECNXMvqXOsRLh25P9ZX.jpg', overview: 'A game night turns into a real-life mystery. Fast, funny and genuinely surprising.' },
    { id: 'b7', title: 'The Princess Bride', year: 1987, mood: 'bored', genres: ['Adventure', 'Comedy', 'Fantasy'], poster: 'https://image.tmdb.org/t/p/w500/2fc4ifMnSVBMd3lHIkFOvJtaHlq.jpg', overview: 'A timeless adventure packed with swordfights, romance, comedy and one of cinema\'s most quotable scripts.' },
    { id: 'b8', title: 'Hot Fuzz', year: 2007, mood: 'bored', genres: ['Action', 'Comedy', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/vId3sDvMkpnOVZkRdEqmTYFvG5d.jpg', overview: 'A super-cop is transferred to a sleepy village with a dark secret. Brilliantly funny and endlessly rewatchable.' },
    { id: 'b9', title: 'The Grand Budapest Hotel', year: 2014, mood: 'bored', genres: ['Comedy', 'Adventure'], poster: 'https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', overview: 'Wes Anderson at his most whimsical. Colourful, witty and impossible to watch without smiling.' },
    { id: 'b10', title: 'Superbad', year: 2007, mood: 'bored', genres: ['Comedy'], poster: 'https://image.tmdb.org/t/p/w500/ek8e8txUyUwd2BNqj6lFEerJfHq.jpg', overview: 'Two best friends try to survive their last days of high school. One of the funniest films ever made.' },
   
  { id: 'b11', title: 'Dumb and Dumber', year: 1994, mood: 'bored', genres: ['Comedy'], poster: 'https://image.tmdb.org/t/p/w500/4LdpBXiCyGKkR8FGHgjKlphrfUc.jpg', overview: 'Two hilariously clueless friends go on a ridiculous road trip. Pure silly fun.' },
  { id: 'b12', title: 'Ace Ventura: Pet Detective', year: 1994, mood: 'bored', genres: ['Comedy'], poster: 'https://image.tmdb.org/t/p/w500/pqiRuETmuSybfnVZ7qyeoXhQyN1.jpg', overview: 'A bizarre detective searches for a missing dolphin. Jim Carrey at his craziest.' },
  { id: 'b13', title: 'The Hangover', year: 2009, mood: 'bored', genres: ['Comedy'], poster: 'https://image.tmdb.org/t/p/w500/uluhlXubGu1VxU63X9VHCLWDAYP.jpg', overview: 'A wild night in Vegas turns into chaos. Fast, outrageous and hilarious.' },
  { id: 'b14', title: 'Step Brothers', year: 2008, mood: 'bored', genres: ['Comedy'], poster: 'https://image.tmdb.org/t/p/w500/1g2y4r5y3z7t7l8f9n0m2k3j4h5.jpg', overview: 'Two grown men forced to live together act like children. Absurd and funny.' },
  { id: 'b15', title: 'White Chicks', year: 2004, mood: 'bored', genres: ['Comedy', 'Crime'], poster: 'https://image.tmdb.org/t/p/w500/aHTUpoo3LQ2kW4wJ6F0hS3FoZT3.jpg', overview: 'Two agents go undercover in the most ridiculous way. Iconic comedy moments.' },
  { id: 'b16', title: 'Get Smart', year: 2008, mood: 'bored', genres: ['Comedy', 'Action'], poster: 'https://image.tmdb.org/t/p/w500/5wYx8Yc6u4k7r3d2s1p0o9n8m7l.jpg', overview: 'A clumsy agent saves the world in the funniest ways possible.' },
  { id: 'b17', title: 'Paul Blart: Mall Cop', year: 2009, mood: 'bored', genres: ['Comedy'], poster: 'https://image.tmdb.org/t/p/w500/3L3l6L0z0d0d0d0d0d0d0d0d0d0.jpg', overview: 'A mall security guard becomes an unlikely hero. Light and goofy fun.' },
  { id: 'b18', title: 'Central Intelligence', year: 2016, mood: 'bored', genres: ['Comedy', 'Action'], poster: 'https://image.tmdb.org/t/p/w500/7uW3W3XjK2x9g6n5m4b3v2c1z0a.jpg', overview: 'An accountant gets pulled into a spy adventure. Action mixed with comedy.' },
  { id: 'b19', title: 'Ride Along', year: 2014, mood: 'bored', genres: ['Comedy', 'Action'], poster: 'https://image.tmdb.org/t/p/w500/1p2q3r4s5t6u7v8w9x0y1z2a3b4.jpg', overview: 'A cop tests his future brother-in-law. Funny and action-packed.' },
  { id: 'b20', title: 'The Pink Panther', year: 2006, mood: 'bored', genres: ['Comedy', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/9xg6h5f4d3s2a1q0w9e8r7t6y5u.jpg', overview: 'A clumsy detective solves a case in the most chaotic way.' }
],
};


const ALL_MOVIES = (() => {
  const seen = new Set(), all = [];
  for (const films of Object.values(MOVIES)) {
    for (const f of films) { if (!seen.has(f.id)) { seen.add(f.id); all.push(f); } }
  }
  return all;
})();

// ── All genres ──
const ALL_GENRES = [...new Set(ALL_MOVIES.flatMap(f => f.genres))].sort();