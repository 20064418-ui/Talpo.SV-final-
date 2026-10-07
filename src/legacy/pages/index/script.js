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

;
  if (typeof closeModal !== 'undefined') __expose('closeModal', closeModal);
  if (typeof openModal !== 'undefined') __expose('openModal', openModal);
if (typeof __onload === "function") __ready(__onload);
