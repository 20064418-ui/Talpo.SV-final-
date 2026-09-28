/* eslint-disable */
// Código original de components/planes.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
// Menú móvil: abre/cierra la navegación en pantallas angostas
__ready( () => {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // En móvil, tocar un ítem con submenú despliega su dropdown en vez de navegar
  document.querySelectorAll(".nav-item-dropdown > a").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (window.innerWidth <= 1024) {
        event.preventDefault();
        const dropdown = link.nextElementSibling;
        if (dropdown) dropdown.classList.toggle("show-mobile");
      }
    });
  });
});

;

if (typeof __onload === "function") __ready(__onload);
