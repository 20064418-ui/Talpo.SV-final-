/* eslint-disable */
// Código original de components/planhoteles.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
function toggleDropdown() {
    const btn = document.querySelector('.dropdown-btn');
    const content = document.getElementById('dropdownBody');
    
    btn.classList.toggle('active');

    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        content.style.padding = "0 30px";
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        content.style.padding = "0 30px";
    }
}

// Ajuste para responsive: recalcular altura si se cambia el tamaño de la ventana
__listen(window, 'resize', () => {
    const content = document.getElementById('dropdownBody');
    if (content.style.maxHeight && content.style.maxHeight !== "0px") {
        content.style.maxHeight = content.scrollHeight + "px";
    }
});

/* [migración] listener del carrusel de main.js eliminado */

__ready( () => {
    // 1. Inicializar carrusel y auto-play (esto sigue igual)
    if (typeof updateRotativeCarousel === 'function') updateRotativeCarousel();
    if (typeof startAutoPlay === 'function') startAutoPlay();

    // 2. Configuración del Menú de Navegación Móvil (Seguro)
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    // Solo ejecutamos el bloque del menú SI existe menuToggle en la página
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            navLinks.classList.toggle('active');
            
            // Cambia el icono de barras (☰) a una equis (✕)
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        // Cierra el menú automáticamente si tocas fuera
        __listen(document, 'click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuToggle) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        });
    }
});


;
  if (typeof toggleDropdown !== 'undefined') __expose('toggleDropdown', toggleDropdown);
if (typeof __onload === "function") __ready(__onload);
