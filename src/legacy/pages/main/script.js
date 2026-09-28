/* eslint-disable */
// Código original de components/main.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
const cards = document.querySelectorAll('.card');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const carouselContainer = document.querySelector('.carousel-container');

let currentIndex = 2;
let autoPlayInterval = null;

function updateRotativeCarousel() {
    if (cards.length === 0) return;

    cards.forEach((card, index) => {
        card.className = 'card';
        
        if (index === currentIndex) {
            card.classList.add('active');
        } else if (index === (currentIndex - 1 + cards.length) % cards.length) {
            card.classList.add('prev');
        } else if (index === (currentIndex + 1) % cards.length) {
            card.classList.add('next');
        } else if (index === (currentIndex - 2 + cards.length) % cards.length) {
            card.classList.add('out-left');
        } else if (index === (currentIndex + 2) % cards.length) {
            card.classList.add('out-right');
        } else {
            card.classList.add('hidden');
        }
    });
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % cards.length;
    updateRotativeCarousel();
}

function prevSlide() {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    updateRotativeCarousel();
}

function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = __interval(nextSlide, 4000);
}

function stopAutoPlay() {
    clearInterval(autoPlayInterval);
}

nextBtn?.addEventListener('click', () => {
    stopAutoPlay();
    nextSlide();
    startAutoPlay();
});

prevBtn?.addEventListener('click', () => {
    stopAutoPlay();
    prevSlide();
    startAutoPlay();
});

carouselContainer?.addEventListener('mouseenter', stopAutoPlay);
carouselContainer?.addEventListener('mouseleave', startAutoPlay);

document.getElementById('googlePlayBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('📱 Google Play Store - Talapo App (demo)');
});

document.getElementById('appStoreBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('🍎 App Store - Talapo App (demo)');
});

document.getElementById('qrBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('📲 Scan QR code to download Talapo App');
});

document.getElementById('buttonstart')?.addEventListener('click', () => {
    const departmentSelect = document.getElementById('/talapo-itinerario');
    const departmentValue = departmentSelect ? departmentSelect.value : "/talapo-itinerario";

    if (!departmentValue) {
        localStorage.setItem('talapo_destino', 'San Salvador');
        window.location.href = '/talapo-itinerario';
    } else {
        localStorage.setItem('talapo_destino', departmentValue);
        window.location.href = '/talapo-itinerario';
    }
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

__ready( () => {
    // Cargar información del perfil guardada en localStorage
    const savedPassport = localStorage.getItem('talapo_passport');
    const navProfileImg = document.getElementById('navProfileImg');
    const navProfileName = document.getElementById('navProfileName');

    if (savedPassport) {
        const data = JSON.parse(savedPassport);
        
        // Asignar el nombre del usuario si existe
        if (data.nombre || data.nombreUsuario) {
            navProfileName.textContent = data.nombre || data.nombreUsuario;
        }
        
        // Asignar la foto del perfil si existe
        if (data.fotoUrl && navProfileImg) {
            navProfileImg.src = data.fotoUrl;
        }
    }

    // Funcionalidad de Cerrar Sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Eliminar datos del perfil del almacenamiento local
            localStorage.removeItem('talapo_passport');
            
            // Redirigir a la página de inicio o login
            window.location.href = '/'; // Cambia esto según tu estructura de archivos
        });
    }
});
;
// Control de apertura/cierre de la ventana
/* [Talapo] chatbot viejo eliminado: ahora es el componente TalapoAI.vue */

function appendMessage(text, className) {
    const box = document.getElementById('chatMessages'); // El contenedor del chat
    if (!box) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${className}`;
    msgDiv.innerHTML = text;
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight; 
}
;

if (typeof __onload === "function") __ready(__onload);
