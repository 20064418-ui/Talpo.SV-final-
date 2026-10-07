/* eslint-disable */
// Código original de components/index.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;

    // Mobile menu toggle (se cierra al tocar un enlace o fuera del menú)
    const toggleBtn = document.querySelector('.lg-index .menu-toggle');
    const navMenu = document.querySelector('.lg-index .nav-links');
    if (toggleBtn && navMenu) {
      __listen(toggleBtn, 'click', (e) => {
        e.stopPropagation();
        navMenu.classList.toggle('active');
      });
      __listen(navMenu, 'click', (e) => {
        if (e.target.closest('a')) navMenu.classList.remove('active');
      });
      __listen(document, 'click', (e) => {
        if (navMenu.classList.contains('active') && !e.target.closest('.lg-index .navbar')) navMenu.classList.remove('active');
      });
    }

    // Modal functions
    function openModal(title, imgSrc, description, location, rating) {
      document.getElementById('modalTitle').innerText = title;
      document.getElementById('modalImg').src = imgSrc;
      document.getElementById('modalImg').alt = title;
      document.getElementById('modalDesc').innerText = description;
      document.getElementById('modalLocation').querySelector('span').innerText = location;
      document.getElementById('modalRating').innerText = rating;

      document.getElementById('placeModal').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      const modal = document.getElementById('placeModal');
      if (modal) modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Antes era window.onclick = … y quedaba "pegado" en todas las demás páginas
    const placeModal = document.getElementById('placeModal');
    if (placeModal) {
      __listen(placeModal, 'click', (event) => {
        // clic fuera de la tarjeta, o en el botón que lleva a otra página
        if (event.target === placeModal || event.target.closest('.modal-action-box a')) closeModal();
      });
    }
    __listen(document, 'keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    /* ==================================================================
       Contenido editable desde /admin/site (destinos, reseñas, números).
       Si el admin no ha guardado nada, se queda el HTML original.
       Se recuerda la última versión para que no "parpadee" al entrar.
       ================================================================== */
    (function homeFromAdmin() {
      const KEY = 'talapo.home.v1';
      const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      const safeUrl = (u) => (/^(https?:\/\/|\/)/i.test(String(u || '')) ? String(u) : '');
      let places = [];

      function stars(n) {
        n = Number(n) || 5;
        let h = '';
        for (let i = 1; i <= 5; i++) h += n >= i ? '<i class="fas fa-star"></i>' : (n >= i - 0.5 ? '<i class="fas fa-star-half-alt"></i>' : '<i class="far fa-star"></i>');
        return h;
      }
      const ICONS = ['fa-user', 'fa-hiking', 'fa-mug-hot', 'fa-globe', 'fa-camera', 'fa-heart', 'fa-sun', 'fa-map'];

      function apply(home) {
        if (!home || typeof home !== 'object') return;
        const root = document.querySelector('.lg-index');
        if (!root) return;
        if (Array.isArray(home.stats) && home.stats.length) {
          const box = root.querySelector('.hero-stats');
          if (box) box.innerHTML = home.stats.filter((s) => s && s.number).map((s) =>
            `<div class="stat"><span class="stat-number">${esc(s.number)}</span><span class="stat-label">${esc(s.label)}</span></div>`).join('');
        }
        if (Array.isArray(home.places) && home.places.length) {
          places = home.places;
          const grid = root.querySelector('.places-grid');
          if (grid) grid.innerHTML = places.map((p, i) => `
            <div class="place-card">
              <div class="place-image">
                <img loading="lazy" decoding="async" alt="${esc(p.name)}" src="${esc(safeUrl(p.image))}"/>
                <div class="place-overlay"><span class="place-rating"><i class="fas fa-star"></i> ${esc(p.rating)}</span></div>
              </div>
              <div class="place-info">
                <h4>${esc(p.name)}</h4>
                <p>${esc(p.short)}</p>
                <div class="place-meta">
                  <span><i class="fas fa-map-marker-alt"></i> ${esc(p.region)}</span>
                  <a class="learn-more" href="javascript:void(0)" data-place="${i}">Explore →</a>
                </div>
              </div>
            </div>`).join('');
        }
        if (Array.isArray(home.testimonials) && home.testimonials.length) {
          const grid = root.querySelector('.testimonials-grid');
          if (grid) grid.innerHTML = home.testimonials.map((t, i) => `
            <div class="testimonial-card">
              <div>
                <div class="testimonial-stars">${stars(t.stars)}</div>
                <p class="testimonial-text">"${esc(t.text)}"</p>
              </div>
              <div class="testimonial-author"><div class="author-avatar"><i class="fas ${ICONS[i % ICONS.length]}"></i></div><div><div class="author-name">${esc(t.name)}</div><div class="author-title">${esc(t.title)}</div></div></div>
            </div>`).join('');
        }
      }

      // "Explore →" de las tarjetas generadas
      const grid = document.querySelector('.lg-index .places-grid');
      if (grid) __listen(grid, 'click', (e) => {
        const a = e.target.closest('[data-place]');
        if (!a) return;
        const p = places[+a.dataset.place];
        if (p) openModal(p.name, safeUrl(p.image), p.description || p.short, p.location || p.region, `${p.rating} ★★★★★`);
      });

      try { apply(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { /* sin guardado */ }
      if (typeof __talapo !== 'undefined' && __talapo.online) {
        __talapo.db.from('site_content').select('value').eq('key', 'home').limit(1).then(({ data, error }) => {
          if (error) return;
          const home = data && data[0] ? data[0].value : null;
          try {
            if (home) localStorage.setItem(KEY, JSON.stringify(home));
            else if (localStorage.getItem(KEY)) { localStorage.removeItem(KEY); location.reload(); return; } // el admin restauró el original
          } catch (e) { /* modo privado */ }
          apply(home);
        }, () => {});
      }
    })();

;
  if (typeof closeModal !== 'undefined') __expose('closeModal', closeModal);
  if (typeof openModal !== 'undefined') __expose('openModal', openModal);
if (typeof __onload === "function") __ready(__onload);
