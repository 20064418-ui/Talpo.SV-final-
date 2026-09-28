/* eslint-disable */
// Código original de components/turisticattractions.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
const cards = document.querySelectorAll(".card");
const info = document.getElementById("info");

let current = 0;

const data = [
  {
    title: "San Salvador Historic Center",
    rating: "⭐⭐⭐⭐⭐",
    desc: "The cultural and historic heart of El Salvador. Here you'll find the Metropolitan Cathedral, the National Palace and some of the country's most iconic monuments."
  },
  {
    title: "Joya de Cerén",
    rating: "⭐⭐⭐⭐⭐",
    desc: "A UNESCO World Heritage archaeological site that preserves the remains of an ancient Maya community in remarkable condition."
  },
  {
    title: "Los Tercios",
    rating: "⭐⭐⭐⭐⭐",
    desc: "An impressive natural formation of volcanic rock columns in Morazán — perfect for nature and photography lovers."
  },
  {
    title: "Lago de Coatepeque",
    rating: "⭐⭐⭐⭐⭐",
    desc: "One of the most beautiful lakes in Central America, famous for its turquoise water, floating restaurants and spectacular views."
  },
  {
    title: "Playa El Tunco",
    rating: "⭐⭐⭐⭐⭐",
    desc: "An internationally known destination for its surf waves, laid-back vibe and spectacular Pacific Ocean sunsets."
  }
];

function update() {
  cards.forEach((card, i) => {
    card.classList.remove("active", "prev", "next", "hidden");

    if (i === current) {
      card.classList.add("active");
    } else if (i === (current + 1) % cards.length) {
      card.classList.add("next");
    } else if (i === (current - 1 + cards.length) % cards.length) {
      card.classList.add("prev");
    } else {
      card.classList.add("hidden");
    }
  });

  // actualizar panel derecho
  info.innerHTML = `
    <h1>${data[current].title}</h1>
    <p class="rating">${data[current].rating}</p>
    <p class="desc">${data[current].desc}</p>

    <div class="controls">
      <button onclick="prev()">‹</button>
      <button onclick="next()">›</button>
    </div>
  `;
}

function next() {
  current = (current + 1) % cards.length;
  update();
}

function prev() {
  current = (current - 1 + cards.length) % cards.length;
  update();
}

/* AUTO SUAVE */
let auto = __interval(next, 3500);

/* PAUSA */
document.querySelector(".carousel").addEventListener("mouseenter", () => {
  clearInterval(auto);
});

document.querySelector(".carousel").addEventListener("mouseleave", () => {
  auto = __interval(next, 3500);
});

update();

//==========================================================================
// 3. EVENTOS CARGADOS AL INICIALIZAR EL DOCUMENTO (CARRUSEL Y MENÚ MÓVIL)
// ==========================================================================
/* [migración] listener del carrusel de main.js eliminado */

__ready( () => {
    // Inicializar carrusel y auto-play
    updateRotativeCarousel();
    startAutoPlay();

    // Configuración del Menú de Navegación Móvil (Hamburguesa)
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        navLinks?.classList.toggle('active');
        
        // Cambia el icono de barras (☰) a una equis (✕) al estar abierto
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        }
    });

    // Cierra el menú automáticamente si tocas cualquier parte fuera de él
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

;
  if (typeof next !== 'undefined') __expose('next', next);
  if (typeof prev !== 'undefined') __expose('prev', prev);
if (typeof __onload === "function") __ready(__onload);
