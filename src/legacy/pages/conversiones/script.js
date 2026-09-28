/* eslint-disable */
// Código original de components/conversiones.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
/* --- LÓGICA DEL NAVBAR COMPORTAMIENTO MÓVIL --- */
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const dropdowns = document.querySelectorAll('.nav-item-dropdown');

let isMobileMenuOpen = false;
let activeDropdown = null;

// Toggle Menú Móvil
menuToggle.addEventListener('click', function(event) {
    event.stopPropagation();
    isMobileMenuOpen = !isMobileMenuOpen;
    
    if (isMobileMenuOpen) {
        navLinks.classList.add('active');
        menuToggle.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        navLinks.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        cerrarTodosLosDropdowns();
    }
});

// Click en Dropdowns (Solo móviles <= 1024px)
dropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', function(event) {
        if (window.innerWidth <= 1024) {
            event.stopPropagation();
            const menuName = this.getAttribute('data-dropdown');
            const menuUl = this.querySelector('.dropdown-menu');
            
            if (activeDropdown === menuName) {
                menuUl.classList.remove('show-mobile');
                activeDropdown = null;
            } else {
                cerrarTodosLosDropdowns();
                menuUl.classList.add('show-mobile');
                activeDropdown = menuName;
            }
        }
    });
});

function cerrarTodosLosDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show-mobile');
    });
    activeDropdown = null;
}

// Cerrar al hacer clic fuera del Navbar
__listen(document, 'click', function(event) {
    if (isMobileMenuOpen && !navLinks.contains(event.target) && !menuToggle.contains(event.target)) {
        isMobileMenuOpen = false;
        navLinks.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        cerrarTodosLosDropdowns();
    }
});


/* --- LÓGICA DE LA CALCULADORA DE DIVISAS --- */
const exchangeRates = {
    USD: 1.0,
    EUR: 0.92,
    MXN: 17.10,
    COP: 3950.00,
    ARS: 840.00,
    PEN: 3.75,
    CRC: 515.00
};

const form = document.getElementById('converterForm');
const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const btnSwap = document.getElementById('btnSwap');

const resultBox = document.getElementById('resultBox');
const resultValue = document.getElementById('resultValue');
const resultRate = document.getElementById('resultRate');

function convertCurrency(amount, from, to) {
    const amountInUSD = amount / exchangeRates[from];
    return amountInUSD * exchangeRates[to];
}

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount) || amount <= 0) return;

    const result = convertCurrency(amount, from, to);
    const standardRate = convertCurrency(1, from, to);

    resultValue.innerText = `${amount.toLocaleString()} ${from} = ${result.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${to}`;
    resultRate.innerText = `1 ${from} ≈ ${standardRate.toFixed(4)} ${to}`;

    resultBox.style.display = 'block';
});

btnSwap.addEventListener('click', function() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    
    if (resultBox.style.display === 'block') {
        form.requestSubmit();
    }
});

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
