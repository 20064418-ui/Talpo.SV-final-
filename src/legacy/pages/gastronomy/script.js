/* eslint-disable */
// Código original de components/gastronomy.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;

/* ============ MODE TOGGLE ============ */
const toggleSwitch = document.getElementById('toggleSwitch');
const modeLabel = document.getElementById('modeLabel');
const btnRestaurant = document.getElementById('btnRestaurant');
const btnStreet = document.getElementById('btnStreet');

function setRestaurantMode(){
  document.body.classList.remove('street-mode');
  modeLabel.textContent = 'Restaurant Mode 🏛️';
  toggleSwitch.classList.remove('active');
  btnRestaurant.classList.add('active');
  btnStreet.classList.remove('active');
}
function setStreetMode(){
  document.body.classList.add('street-mode');
  modeLabel.textContent = 'Street Food Mode 🌮';
  toggleSwitch.classList.add('active');
  btnStreet.classList.add('active');
  btnRestaurant.classList.remove('active');
}
toggleSwitch.addEventListener('click', () => {
  toggleSwitch.classList.contains('active') ? setRestaurantMode() : setStreetMode();
});
btnRestaurant.addEventListener('click', setRestaurantMode);
btnStreet.addEventListener('click', setStreetMode);
setRestaurantMode();

/* ============ ORIGIN MODAL ============ */
const dishStories = {
  pupusas: {
    name: 'Pupusas',
    text: 'Pupusas have pre-Columbian roots, mainly from the Pipil culture. They were once filled with squash blossoms, mushrooms, and wild blackberries. When the Spanish arrived, cheese and pork rinds were added to the mix. Today they are El Salvador\u2019s national pride!'
  },
  yuca: {
    name: 'Fried Yuca with Pork Rinds',
    text: 'Yuca is a root vegetable inherited from our Maya ancestors. In El Salvador, serving it fried with pork rinds on a banana leaf or typical plate is an afternoon tradition. The unmistakable magic touch comes from well-seasoned curtido and homemade tomato salsa.'
  },
  tamales: {
    name: 'Sweet Corn Tamales',
    text: 'Made purely from corn, the sacred Mesoamerican staple. Salvadoran corn tamales are known for their soft texture and subtly sweet flavor, traditionally cooked on rural mornings and served warm with plenty of fresh cream.'
  },
  sopa: {
    name: 'Beef Foot Soup',
    text: 'Born from the rich culinary fusion found in municipal markets, sopa de pata is the quintessential Sunday dish, especially famous in the eastern region. It takes hours of slow cooking to achieve that thick, energizing broth, seasoned with local vegetables.'
  },
  empanadas: {
    name: 'Sweet Plantain Empanadas',
    text: 'An essential sweet treat for afternoon coffee. The dough is made from cooked, mashed ripe plantain, shaped by hand and filled with a delicious milk custard (cream, cornstarch, and cinnamon) or refried beans, then rolled in sugar.'
  },
  pan: {
    name: 'Pan con Pollo',
    text: 'Chicken (or creole hen) sandwiches are synonymous with celebrations, year-end parties, and Salvadoran family gatherings. The absolute secret lies in the "relajo," a blend of toasted seeds and spices that gives its sauce a uniquely aromatic, unmistakable flavor.'
  }
};

const modal = document.getElementById('originModal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalClose = document.getElementById('modalClose');

document.getElementById('dishGrid').addEventListener('click', (e) => {
  if(!e.target.matches('[data-open-modal]')) return;
  const card = e.target.closest('.card');
  const story = dishStories[card.dataset.dish];
  if(!story) return;
  modalTitle.textContent = story.name;
  modalText.textContent = story.text;
  modal.classList.add('show');
});
modalClose.addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('show'); });
__listen(document, 'keydown', (e) => { if(e.key === 'Escape') modal.classList.remove('show'); });

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

if (typeof __onload === "function") __ready(__onload);
