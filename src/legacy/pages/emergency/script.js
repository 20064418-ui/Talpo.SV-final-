/* eslint-disable */
// Código original de components/emergency.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
const cards = document.querySelectorAll('.stack-card');
const mainBg = document.getElementById('mainBg');
const infoCategory = document.getElementById('infoCategory');
const infoTitle = document.getElementById('infoTitle');
const infoLocation = document.getElementById('infoLocation');
const infoDesc = document.getElementById('infoDesc');
const infoPhone = document.getElementById('infoPhone');

let currentIndex = 0;
const totalCards = cards.length;

function updateCarousel() {
    cards.forEach((card, i) => {
        let diff = (i - currentIndex + totalCards) % totalCards;

        if (diff > totalCards / 2) {
            diff -= totalCards;
        }

        card.classList.remove('active');

        if (diff === 0) {
            card.setAttribute('data-pos', 'center');
            mainBg.style.backgroundImage = `url('${card.getAttribute('data-bg')}')`;
            infoCategory.textContent = card.getAttribute('data-cat');
            infoTitle.textContent = card.getAttribute('data-title');
            infoLocation.textContent = card.getAttribute('data-subtitle');
            infoDesc.textContent = card.getAttribute('data-desc');
            infoPhone.href = `tel:${card.getAttribute('data-tel')}`;
        } else if (diff === 1) {
            card.setAttribute('data-pos', 'right-1');
        } else if (diff === 2) {
            card.setAttribute('data-pos', 'right-2');
        } else if (diff === -1) {
            card.setAttribute('data-pos', 'left-1');
        } else if (diff === -2) {
            card.setAttribute('data-pos', 'left-2');
        } else {
            card.setAttribute('data-pos', 'hidden');
        }
    });
}

document.getElementById('nextBtn').addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % totalCards;
    updateCarousel();
});

document.getElementById('prevBtn').addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + totalCards) % totalCards;
    updateCarousel();
});

cards.forEach((card, index) => {
    card.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
    });
});

updateCarousel();

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

if (typeof __onload === "function") __ready(__onload);
