/* eslint-disable */
// Código original de components/traductor.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
/* ==========================================
   LÓGICA DEL NAVBAR COMPORTAMIENTO MÓVIL
   ========================================== */
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const dropdowns = document.querySelectorAll('.nav-item-dropdown');

let isMobileMenuOpen = false;
let activeDropdown = null;

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

__listen(document, 'click', function(event) {
    if (isMobileMenuOpen && !navLinks.contains(event.target) && !menuToggle.contains(event.target)) {
        isMobileMenuOpen = false;
        navLinks.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        cerrarTodosLosDropdowns();
    }
});


/* ==========================================
   LÓGICA DEL TRADUCTOR REAL PARA PÁRRAFOS GRANDES
   ========================================== */
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'es',
        includedLanguages: 'en,es,fr,de,it,pt',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}

const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const btnSwapLang = document.getElementById('btnSwapLang');
const sourceText = document.getElementById('sourceText');
const targetText = document.getElementById('targetText');
const charCount = document.getElementById('charCount');
const btnClear = document.getElementById('btnClear');
const btnCopy = document.getElementById('btnCopy');
const btnTranslate = document.getElementById('btnTranslate');
const statusMsg = document.getElementById('statusMsg');

sourceText.addEventListener('input', () => {
    const len = sourceText.value.length;
    charCount.innerText = `${len} / 5000`;
    if (len === 0) resetOutput();
});

function resetOutput() {
    targetText.innerText = "La traducción de tu párrafo aparecerá aquí al presionar el botón...";
    targetText.classList.add('placeholder');
    statusMsg.innerText = "";
}

btnClear.addEventListener('click', () => {
    sourceText.value = "";
    charCount.innerText = "0 / 5000";
    resetOutput();
});

btnSwapLang.addEventListener('click', () => {
    const temp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = temp;

    const currentOutput = targetText.innerText;
    if (!targetText.classList.contains('placeholder') && currentOutput) {
        sourceText.value = currentOutput;
        charCount.innerText = `${currentOutput.length} / 5000`;
        ejecutarTraduccionReal();
    }
});

async function ejecutarTraduccionReal() {
    const text = sourceText.value.trim();
    const from = sourceLang.value;
    const to = targetLang.value;

    if (!text) {
        resetOutput();
        return;
    }

    if (from === to) {
        targetText.innerText = sourceText.value;
        targetText.classList.remove('placeholder');
        return;
    }

    targetText.innerText = "Traduciendo párrafo e interpretando contexto...";
    targetText.classList.add('placeholder');
    btnTranslate.disabled = true;
    btnTranslate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando Texto Extenso...';

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error en la respuesta del servidor");
        
        const data = await response.json();
        
        let translatedParagraph = "";
        if (data && data[0]) {
            data[0].forEach(sentence => {
                if (sentence[0]) {
                    translatedParagraph += sentence[0];
                }
            });
        }

        targetText.innerText = translatedParagraph;
        targetText.classList.remove('placeholder');

    } catch (error) {
        console.error("Error al traducir el párrafo:", error);
        targetText.innerText = "Hubo un problema de conexión temporal al procesar el párrafo. Intenta de nuevo.";
    } finally {
        btnTranslate.disabled = false;
        btnTranslate.innerHTML = '<i class="fas fa-language"></i> Traducir Párrafo Completo';
    }
}

btnTranslate.addEventListener('click', ejecutarTraduccionReal);

btnCopy.addEventListener('click', () => {
    if (targetText.classList.contains('placeholder') || !targetText.innerText) return;
    
    navigator.clipboard.writeText(targetText.innerText).then(() => {
        statusMsg.innerText = "¡Párrafo copiado!";
        setTimeout(() => statusMsg.innerText = "", 2000);
    }).catch(err => {
        console.error("No se pudo copiar: ", err);
    });
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
  if (typeof googleTranslateElementInit !== 'undefined') __expose('googleTranslateElementInit', googleTranslateElementInit);
if (typeof __onload === "function") __ready(__onload);
