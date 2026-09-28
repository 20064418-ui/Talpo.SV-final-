/* eslint-disable */
// Código original de components/index.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;

    // Mobile menu toggle
    const toggleBtn = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-links');
    if(toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
    }

    // Modal functions
    function openModal(title, imgSrc, description, location, rating) {
      document.getElementById('modalTitle').innerText = title;
      document.getElementById('modalImg').src = imgSrc;
      document.getElementById('modalDesc').innerText = description;
      document.getElementById('modalLocation').querySelector('span').innerText = location;
      document.getElementById('modalRating').innerText = rating;
      
      document.getElementById('placeModal').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      document.getElementById('placeModal').classList.remove('active');
      document.body.style.overflow = 'auto';
    }

    window.onclick = function(event) {
      const modal = document.getElementById('placeModal');
      if (event.target == modal) {
        closeModal();
      }
    }
  
;
  if (typeof closeModal !== 'undefined') __expose('closeModal', closeModal);
  if (typeof openModal !== 'undefined') __expose('openModal', openModal);
if (typeof __onload === "function") __ready(__onload);
