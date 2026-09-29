/* eslint-disable */
// Código original de components/travelkits.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
// ==========================================
// 1. LÓGICA DE LAS VENTANAS EMERGENTES (MODALES)
// ==========================================

function openModal(modalId) {
    // Muestra el fondo oscuro y el modal específico
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById(modalId).classList.remove('hidden');
    
    // Agrega la clase CSS que bloquea el scroll de la página de fondo
    document.body.classList.add('no-scroll'); 
}

function closeModals() {
    // Oculta el fondo oscuro y todos los modales
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('modal1').classList.add('hidden');
    document.getElementById('modal2').classList.add('hidden');
    document.getElementById('modal3').classList.add('hidden');
    
    // Restaura el scroll de la página
    document.body.classList.remove('no-scroll'); 
}

// Cambia la imagen principal cuando haces clic en una miniatura
function changeImage(mainImgId, src) {
    document.getElementById(mainImgId).src = src;
}


// ==========================================
// 2. LÓGICA DEL CARRUSEL PRINCIPAL
// ==========================================

// Asegurarse de que el HTML haya cargado antes de iniciar el carrusel
__ready( () => {
    const items = document.querySelectorAll('.carousel-item');
    let currentIndex = 0;
    
    function changeSlide() {
        if (items.length === 0) return; // Evita errores si no hay imágenes
        
        // Oculta la imagen actual
        items[currentIndex].classList.remove('opacity-100');
        items[currentIndex].classList.add('opacity-0');
        
        // Pasa a la siguiente imagen (y vuelve a 0 si es la última)
        currentIndex = (currentIndex + 1) % items.length;
        
        // Muestra la nueva imagen
        items[currentIndex].classList.remove('opacity-0');
        items[currentIndex].classList.add('opacity-100');
    }
    
    // Ejecuta la función de cambiar imagen cada 5 segundos (5000 milisegundos)
    __interval(changeSlide, 5000);
});

/* [migración] listener del carrusel de main.js eliminado */

__ready( () => {
    updateRotativeCarousel();
    startAutoPlay();

    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        navLinks?.classList.toggle('active');
        
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        }
    });

    __listen(document, 'click', (e) => {
        if (navLinks?.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuToggle) {
            navLinks.classList.remove('active');
            const icon = menuToggle?.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        }
    });
});


// Sincronizar la foto del pasaporte con la barra de navegación del Main
    __ready( () => {
        const savedPassport = localStorage.getItem('talapo_passport');
        if (savedPassport) {
            const data = JSON.parse(savedPassport);
            const navProfileImg = document.querySelector('.nav-profile-img');
            if (navProfileImg && data.fotoUrl) {
                navProfileImg.src = data.fotoUrl;
            }
        }
}); 
;

        var __tailwindConfig = {
            theme: {
                extend: {
                    colors: {
                        talapoBlue: '#0055A5',
                        talapoLightBlue: '#3385D6',
                    }
                }
            }
        }
    
;
  if (typeof changeImage !== 'undefined') __expose('changeImage', changeImage);
  if (typeof closeModals !== 'undefined') __expose('closeModals', closeModals);
  if (typeof openModal !== 'undefined') __expose('openModal', openModal);
if (typeof __onload === "function") __ready(__onload);