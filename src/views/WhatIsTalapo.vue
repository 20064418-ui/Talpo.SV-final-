<script setup>
// "What is Talapo?": guía de todas las funciones del sitio, con buscador y filtros,
// para que cualquier persona encuentre rápido lo que necesita.
import { ref, computed } from 'vue';
import { useInstall } from '@/composables/useInstall';

const { canPrompt, installed, isIOS, install } = useInstall();

const CATS = [
  { id: 'all', label: 'Everything' },
  { id: 'plan', label: 'Plan your trip' },
  { id: 'eat', label: 'Eat & drink' },
  { id: 'tools', label: 'Travel tools' },
  { id: 'community', label: 'Community' },
  { id: 'passport', label: 'Passport & Stands' },
  { id: 'safety', label: 'Safety' },
];

const features = [
  { cat: 'plan', icon: 'fa-route', title: 'Tours', to: '/tours', where: 'Menu → Maps Tours or Reservations → Tours',
    text: 'Pick the places you want to visit, mark your starting point and Talapo draws the route with time and distance. Sign in to save it to your passport.',
    keys: 'route builder map trip destinations itinerary save' },
  { cat: 'plan', icon: 'fa-calendar-days', title: 'Smart itinerary', to: '/talapo-itinerario', where: 'Main page → Start now',
    text: 'Tell us how you want to travel and get a personalized day-by-day plan with stops, transfers and estimated costs.',
    keys: 'plan days budget personalized schedule' },
  { cat: 'plan', icon: 'fa-suitcase-rolling', title: 'My itineraries', to: '/itineraries', where: 'Profile menu → My itineraries',
    text: 'All your saved tours and plans in one place, ready to open again. You need to be signed in.',
    keys: 'saved tours plans history' },
  { cat: 'plan', icon: 'fa-map-location-dot', title: 'Tourist attractions', to: '/turisticattractions', where: 'Menu → Maps Tours → Tourist attractions',
    text: 'Browse places to visit across El Salvador and choose your next destination.',
    keys: 'places destinations sightseeing explore' },
  { cat: 'plan', icon: 'fa-bus', title: 'Bus routes', to: '/buses', where: 'Menu → Maps Tours → Bus route',
    text: 'Bus routes for the 14 departments of El Salvador. Search by place or route number and see the route on the map.',
    keys: 'transport public bus ruta map departments' },
  { cat: 'plan', icon: 'fa-vr-cardboard', title: 'Augmented reality', to: '/ra', where: 'Menu → Gastronomy → Augmented reality',
    text: 'Look around famous places in 360° before you go, with Google Maps.',
    keys: 'ar 360 street view virtual' },
  { cat: 'plan', icon: 'fa-bell-concierge', title: 'Reservations (Plan Talapo)', where: 'Menu → Reservations',
    text: 'Join Plan Talapo to access certified local guides, hotels, restaurants, transport and flights.',
    keys: 'guide hotels hostels restaurants transport flights book reserve premium',
    links: [{ t: 'Tourist guide', to: '/planguide' }, { t: 'Hotels', to: '/planhoteles' }, { t: 'Restaurants', to: '/planrestaurantes' }, { t: 'Transport', to: '/plantransporte' }, { t: 'Flights', to: '/planflights' }] },

  { cat: 'eat', icon: 'fa-bowl-food', title: 'Typical recipes', to: '/typicalrecipes', where: 'Menu → Gastronomy → Typical recipes',
    text: 'Authentic Salvadoran flavors passed down through generations, with recipes you can cook at home.',
    keys: 'pupusas food cook cuisine recipes' },
  { cat: 'eat', icon: 'fa-utensils', title: 'Restaurant recommendations', to: '/gastronomy', where: 'Menu → Gastronomy → Restaurant recommendations',
    text: 'From traditional restaurants to iconic street stalls. Switch the mode to see prices that match your budget.',
    keys: 'eat restaurants street food prices budget' },

  { cat: 'tools', icon: 'fa-money-bill-transfer', title: 'Conversions', to: '/conversiones', where: 'Menu → Economy → Conversions',
    text: 'Convert amounts instantly to plan your travel expenses.', keys: 'currency money exchange dollars calculator' },
  { cat: 'tools', icon: 'fa-language', title: 'Translator', to: '/traductor', where: 'Menu → Economy → Translator',
    text: 'Translate long texts and whole paragraphs instantly (up to 5,000 characters at a time).', keys: 'spanish english translate language' },
  { cat: 'tools', icon: 'fa-bag-shopping', title: 'Traveler kits', to: '/travelkits', where: 'Menu → Economy → Traveler kits',
    text: 'Everything you need for your trip in one place.', keys: 'kit packing essentials gear' },
  { cat: 'tools', icon: 'fa-crown', title: 'Travel plans', to: '/planes', where: 'Menu → Economy → Travel plans',
    text: 'Premium travel management, private logistics and dedicated concierge support in El Salvador.', keys: 'premium concierge logistics membership' },
  { cat: 'tools', icon: 'fa-shirt', title: 'Talapo Shop', to: '/clothing', where: 'Main page → Talapo Shop → View catalog',
    text: 'Garments that carry the spirit of El Salvador, with an easy size-change policy.', keys: 'clothes shop store merch buy' },
  { cat: 'tools', icon: 'fa-comment-dots', title: 'Talapo AI chat', where: 'Chat button at the bottom right of every page',
    text: 'Ask anything about El Salvador. It can plan a trip for you, teach useful Spanish phrases, share quick facts, show your passport progress and translate.',
    keys: 'assistant bot chatbot ai help planner translator' },

  { cat: 'community', icon: 'fa-users', title: 'Talapo Travelers', to: '/travelers', where: 'Menu → Technology → Talapo Travelers',
    text: 'Meet other travelers, see their public passports and follow the ones you like.', keys: 'people profiles follow social' },
  { cat: 'community', icon: 'fa-comments', title: 'Forum', to: '/foro', where: 'Menu → Technology → Forum',
    text: 'Share your experience, see what other travelers have discovered and plan your next route.', keys: 'posts comments questions share' },
  { cat: 'community', icon: 'fa-trophy', title: 'Talapo Contests', to: '/contests', where: 'Menu → Technology → Talapo Contests',
    text: 'Join creative challenges, send your entry and climb the ranking. The Talapo team grades every entry.', keys: 'challenge prize ranking tiktok meme' },

  { cat: 'passport', icon: 'fa-passport', title: 'Talapo Passport', to: '/passport', where: 'Menu → Technology → Passport',
    text: 'Create your passport with a unique number assigned by Talapo, collect stamps, keep your daily streak and earn badges.',
    keys: 'stamps streak badges profile account number' },
  { cat: 'passport', icon: 'fa-tablet-screen-button', title: 'Talapo Stands', where: 'At the stand, for example in Parque Libertad, Santa Ana',
    text: 'At a Talapo Stand, answer a short form about the condition of the area, type your @username and receive the stamp in your passport. The stand also shows municipal news, history and a map of nearby places.',
    keys: 'kiosk stamp form tablet santa ana park report' },

  { cat: 'safety', icon: 'fa-truck-medical', title: 'Emergency services', to: '/emergency', where: 'Menu → Technology → Emergency services',
    text: 'Official 24/7 helpline for security incidents, roadside assistance and tourist support, plus a hospitals map with directions.',
    keys: 'help police hospital 911 safety' },
];

const menu = [
  { name: 'Maps Tours', text: 'Bus routes and tourist attractions on the map.' },
  { name: 'Reservations', text: 'Guides, hotels, restaurants, tours, transport and flights.' },
  { name: 'Gastronomy', text: 'Recipes, restaurants and augmented reality.' },
  { name: 'Economy', text: 'Conversions, translator, traveler kits and travel plans.' },
  { name: 'Technology', text: 'Chat, contests, travelers, forum, emergency and your passport.' },
];

const q = ref('');
const cat = ref('all');
const shown = computed(() => {
  const s = q.value.trim().toLowerCase();
  return features.filter((f) => (cat.value === 'all' || f.cat === cat.value)
    && (!s || `${f.title} ${f.text} ${f.where} ${f.keys}`.toLowerCase().includes(s)));
});
const countOf = (id) => (id === 'all' ? features.length : features.filter((f) => f.cat === id).length);
</script>

<template>
  <div class="wit">
    <section class="hero">
      <div class="hero-in">
        <span class="badge">WHAT IS TALAPO?</span>
        <h1>One place to plan, explore and enjoy <span>El Salvador</span></h1>
        <p>Talapo personalizes travel itineraries to each person's tastes, interests and dreams. Below you will find every tool we have and exactly where to find it.</p>
        <div class="cta">
          <RouterLink class="btn main" to="/tours"><i class="fas fa-route"></i> Plan with Tours</RouterLink>
          <RouterLink class="btn ghost" to="/passport"><i class="fas fa-passport"></i> Get my passport</RouterLink>
        </div>
      </div>
    </section>

    <section class="wrap">
      <div class="finder">
        <label class="search">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="q" type="search" placeholder="Search a function: bus, recipes, translator, emergency…" aria-label="Search functions">
        </label>
        <div class="chips" role="tablist" aria-label="Categories">
          <button v-for="c in CATS" :key="c.id" role="tab" :aria-selected="cat === c.id" :class="{ on: cat === c.id }" @click="cat = c.id">
            {{ c.label }} <small>{{ countOf(c.id) }}</small>
          </button>
        </div>
      </div>

      <p v-if="!shown.length" class="empty"><i class="fas fa-compass"></i> Nothing matches "{{ q }}". Try another word, like "bus", "food" or "money".</p>

      <div class="grid">
        <article v-for="f in shown" :key="f.title" class="card">
          <span class="ico"><i class="fas" :class="f.icon"></i></span>
          <h3>{{ f.title }}</h3>
          <p>{{ f.text }}</p>
          <p class="where"><i class="fas fa-location-dot"></i> {{ f.where }}</p>
          <div class="acts">
            <RouterLink v-if="f.to" class="open" :to="f.to">Open <i class="fas fa-arrow-right"></i></RouterLink>
            <RouterLink v-for="l in f.links || []" :key="l.to" class="mini" :to="l.to">{{ l.t }}</RouterLink>
          </div>
        </article>
      </div>

      <section class="menu">
        <h2>The menu in 30 seconds</h2>
        <p>The top bar groups everything into five menus:</p>
        <ol>
          <li v-for="m in menu" :key="m.name"><b>{{ m.name }}</b><span>{{ m.text }}</span></li>
        </ol>
      </section>

      <section class="install">
        <div>
          <h2><i class="fas fa-mobile-screen-button"></i> Take Talapo with you</h2>
          <p v-if="installed">Talapo is already installed on this device.</p>
          <p v-else-if="isIOS">On iPhone or iPad: open this page in Safari, tap the <b>Share</b> button and choose <b>Add to Home Screen</b>.</p>
          <p v-else-if="canPrompt">Install Talapo for free. It opens from your home screen like an app, full screen, and keeps working with a weak connection.</p>
          <p v-else>Open the browser menu and choose <b>Install app</b> or <b>Add to Home screen</b> to keep Talapo on your device.</p>
        </div>
        <button v-if="canPrompt && !installed" class="btn main" @click="install"><i class="fas fa-download"></i> Install Talapo</button>
      </section>
    </section>
  </div>
</template>

<style scoped>
.wit { font-family: 'Outfit', 'Inter', sans-serif; background: #F8FBFE; min-height: 100vh; color: #0A2F44; }
.hero { background: linear-gradient(rgba(10,47,68,.78), rgba(10,47,68,.9)), url('/assets/img/index/catedral.jpg') center/cover; color: #fff; padding: clamp(3rem, 7vw, 5.5rem) 5%; }
.hero-in { max-width: 1100px; margin: 0 auto; }
.badge { display: inline-block; background: #E46D5C; font-size: .75rem; font-weight: 800; letter-spacing: 1.5px; padding: .4rem 1rem; border-radius: 40px; margin-bottom: 1rem; }
.hero h1 { font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 800; line-height: 1.1; margin: 0 0 1rem; max-width: 18ch; }
.hero h1 span { color: #7fd6cd; }
.hero p { max-width: 62ch; font-size: 1.1rem; line-height: 1.6; opacity: .92; margin: 0 0 1.6rem; }
.cta { display: flex; flex-wrap: wrap; gap: .8rem; }
.btn { display: inline-flex; align-items: center; gap: .55rem; min-height: 48px; padding: 0 1.6rem; border-radius: 40px; font: inherit; font-weight: 800; text-decoration: none; border: 0; cursor: pointer; transition: transform .2s; }
.btn:hover { transform: translateY(-2px); }
.btn.main { background: #E46D5C; color: #fff; }
.btn.ghost { background: rgba(255,255,255,.14); color: #fff; border: 1.5px solid rgba(255,255,255,.6); }
.wrap { max-width: 1200px; margin: 0 auto; padding: 2rem 5% 4rem; }
.finder { display: grid; gap: 1rem; margin-bottom: 1.6rem; position: sticky; top: 0; z-index: 5; background: #F8FBFE; padding: .8rem 0; }
.search { display: flex; align-items: center; gap: .7rem; background: #fff; border: 2px solid #dce7ea; border-radius: 40px; padding: 0 1.2rem; transition: border-color .2s; }
.search:focus-within { border-color: #1C6E6B; }
.search i { color: #1C6E6B; }
.search input { flex: 1; min-width: 0; font: inherit; font-size: 1.05rem; border: 0; outline: 0; background: none; min-height: 52px; color: #0A2F44; }
.chips { display: flex; gap: .5rem; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
.chips::-webkit-scrollbar { display: none; }
.chips button { flex: none; min-height: 44px; padding: 0 1.1rem; border-radius: 40px; border: 1.5px solid #cbdbe2; background: #fff; font: inherit; font-weight: 700; color: #0A2F44; cursor: pointer; }
.chips button small { opacity: .6; margin-left: .25rem; }
.chips button.on { background: #0A2F44; border-color: #0A2F44; color: #fff; }
.empty { text-align: center; color: #58717f; padding: 2rem 0; font-size: 1.05rem; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
.card { background: #fff; border-radius: 22px; padding: 1.4rem; border: 1px solid rgba(28,110,107,.15); box-shadow: 0 16px 28px -24px rgba(0,32,64,.4); display: flex; flex-direction: column; transition: transform .25s, box-shadow .25s; }
.card:hover { transform: translateY(-4px); box-shadow: 0 24px 34px -22px rgba(0,32,64,.35); }
.ico { width: 48px; height: 48px; border-radius: 14px; background: #EEF6F6; color: #1C6E6B; display: grid; place-items: center; font-size: 1.25rem; margin-bottom: .8rem; }
.card h3 { margin: 0 0 .4rem; font-size: 1.2rem; }
.card p { margin: 0 0 .7rem; color: #4a6472; line-height: 1.55; font-size: .96rem; }
.card .where { color: #1C6E6B; font-weight: 600; font-size: .85rem; margin-top: auto; }
.where i { margin-right: .3rem; }
.acts { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .4rem; }
.open { display: inline-flex; align-items: center; gap: .45rem; min-height: 44px; padding: 0 1.2rem; border-radius: 30px; background: #0A2F44; color: #fff; font-weight: 700; text-decoration: none; }
.open:hover { background: #1C6E6B; }
.mini { display: inline-flex; align-items: center; min-height: 40px; padding: 0 .9rem; border-radius: 30px; background: #EEF6F6; color: #1C6E6B; font-weight: 700; font-size: .85rem; text-decoration: none; }
.mini:hover { background: #1C6E6B; color: #fff; }
.menu { margin-top: 3rem; background: #fff; border-radius: 24px; padding: 1.6rem; border: 1px solid rgba(28,110,107,.15); }
.menu h2, .install h2 { margin: 0 0 .4rem; font-size: 1.5rem; }
.menu p { color: #4a6472; margin: 0 0 1rem; }
.menu ol { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(5, 1fr); gap: .8rem; counter-reset: m; }
.menu li { counter-increment: m; background: #F4F9FC; border-radius: 16px; padding: 1rem; display: grid; gap: .3rem; }
.menu li::before { content: counter(m); width: 28px; height: 28px; border-radius: 50%; background: #1C6E6B; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: .85rem; }
.menu li span { color: #58717f; font-size: .88rem; line-height: 1.45; }
.install { margin-top: 1.4rem; display: flex; align-items: center; justify-content: space-between; gap: 1.2rem; flex-wrap: wrap; background: linear-gradient(105deg, #1C6E6B, #0A2F44); color: #fff; border-radius: 24px; padding: 1.6rem 1.8rem; }
.install p { margin: 0; opacity: .92; max-width: 60ch; line-height: 1.55; }
.install h2 i { margin-right: .5rem; color: #7fd6cd; }
@media (max-width: 1100px) { .grid { grid-template-columns: repeat(2, 1fr); } .menu ol { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } .menu ol { grid-template-columns: 1fr; } .btn { width: 100%; justify-content: center; } }
</style>
