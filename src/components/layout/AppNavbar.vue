<script setup>
// Navbar ORIGINAL de main.html (mismo marcado y CSS), ahora un único componente global.
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usePassportStore } from '@/stores/passport';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const passport = usePassportStore();

const menuOpen = ref(false);   // menú móvil (antes #menuToggle / #navLinks.active)
const openGroup = ref(null);   // desplegable abierto con toque (en escritorio abre con hover)
const root = ref(null);

const groups = [
  { label: 'Maps Tours', items: [
    { label: 'Bus route', to: '/buses' },
    { label: 'Tourist attractions', to: '/turisticattractions' },
  ] },
  { label: 'Reservations', items: [
    { label: 'Tourist Guide', to: '/planguide' },
    { label: 'Hotels and Hostels', to: '/planhoteles' },
    { label: 'Restaurants', to: '/planrestaurantes' },
    { label: 'Tours', to: '/tours' },
    { label: 'Transport', to: '/plantransporte' },
    { label: 'Flights', to: '/planflights' },
  ] },
  { label: 'Gastronomy', items: [
    { label: 'Typical recipes', to: '/typicalrecipes' },
    { label: 'Restaurant recommendations', to: '/gastronomy' },
    { label: 'Augmented reality', to: '/ra' },
  ] },
  { label: 'Economy', items: [
    { label: 'Conversions', to: '/conversiones' },
    { label: 'Translator', to: '/traductor' },
    { label: 'Traveler kits', to: '/travelkits' },
    { label: 'Travel plans', to: '/planes' },
  ] },
  { label: 'Technology', items: [
    { label: 'Chatbot Talapo', href: 'https://talapo-gu-a-de-el-salvador-298518227672.us-west1.run.app/' },
    { label: 'Talapo Contests', to: '/contests' },
    { label: 'Forum', to: '/foro' },
    { label: 'The journalistic corner', to: '/planguide' },
    { label: 'Emergency services', to: '/emergency' },
    { label: 'Passport', to: '/passport' },
  ] },
];

const photo = () => passport.profile?.photo_url || auth.avatar || '/assets/img/integrantes/daniel.png';

function toggleGroup(label) { openGroup.value = openGroup.value === label ? null : label; }
async function logout() {
  menuOpen.value = false;
  await auth.signOut();
  router.push('/');
}
function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) { menuOpen.value = false; openGroup.value = null; }
}
onMounted(() => document.addEventListener('click', onDocClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocClick));
watch(() => route.fullPath, () => { menuOpen.value = false; openGroup.value = null; });
</script>

<template>
  <div ref="root" class="main-nav">
    <RouterLink :to="auth.isAuthenticated ? '/main' : '/'" class="logo">
      <img src="/assets/img/logos/logooriginal.png" alt="Talapo Logo" class="nav-logo-img">
      TALAPO.SV
    </RouterLink>

    <button class="menu-toggle" aria-label="Open menu" :aria-expanded="menuOpen" @click.stop="menuOpen = !menuOpen">
      <i class="fas" :class="menuOpen ? 'fa-times' : 'fa-bars'"></i>
    </button>

    <div class="nav-links" :class="{ active: menuOpen }">

      <div v-for="g in groups" :key="g.label" class="nav-item-dropdown" :class="{ open: openGroup === g.label }">
        <a href="#" @click.prevent.stop="toggleGroup(g.label)">{{ g.label }} <i class="fas fa-chevron-down text-xs"></i></a>
        <ul class="dropdown-menu">
          <li v-for="i in g.items" :key="i.label">
            <a v-if="i.href" :href="i.href" target="_blank" rel="noopener">{{ i.label }}</a>
            <RouterLink v-else :to="i.to">{{ i.label }}</RouterLink>
          </li>
        </ul>
      </div>

      <!-- Menú desplegable de perfil (igual que el original) -->
      <div v-if="auth.isAuthenticated" class="nav-item-dropdown profile-dropdown" :class="{ open: openGroup === 'profile' }">
        <a href="#" class="nav-profile-badge" @click.prevent.stop="toggleGroup('profile')">
          <img :src="photo()" alt="Profile" class="nav-profile-img">
          <span>{{ passport.profile?.display_name || auth.displayName }}</span>
          <span v-if="passport.streak" class="streak-chip" :title="`Talapo streak: ${passport.streak} day(s)`">🔥{{ passport.streak }}</span>
          <i class="fas fa-chevron-down text-xs"></i>
        </a>
        <ul class="dropdown-menu dropdown-menu-right">
          <li><RouterLink to="/passport"><i class="fas fa-passport"></i> My passport</RouterLink></li>
          <li><RouterLink to="/itineraries"><i class="fas fa-calendar-days"></i> My itineraries</RouterLink></li>
          <li><RouterLink to="/contests"><i class="fas fa-trophy"></i> My contests</RouterLink></li>
          <li><a href="#" @click.prevent="logout"><i class="fas fa-sign-out-alt"></i> Sign out</a></li>
        </ul>
      </div>
      <RouterLink v-else to="/login" class="btn-sign"><i class="fas fa-user"></i> Sign in</RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* ===== CSS original de assets/css/main.css (navbar) ===== */
.main-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.2rem 5%;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 1000;
    border-bottom: 1px solid rgba(28, 110, 107, 0.2);
    flex-wrap: wrap;
}

.logo {
    font-size: 1.9rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #1c6e6b, #0a2540);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
}

.nav-logo-img {
    height: 42px; /* Puedes ajustar la altura según prefieras */
    width: auto;
    object-fit: contain;
    display: block;
}

.nav-links {
    display: flex;
    gap: 2rem;
    align-items: center;
    flex-wrap: wrap;
}

.nav-links a {
    text-decoration: none;
    color: #1A3A4A;
    font-weight: 500;
    font-size: 0.95rem;
    transition: all 0.25s;
    position: relative;
    padding-bottom: 4px;
}

.nav-links a::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2.5px;
    background: linear-gradient(90deg, #012a18, #053049);
    transition: width 0.3s ease;
    border-radius: 2px;
}

.nav-links a:hover::after {
    width: 100%;
}

.nav-links a:hover {
    color: #1C6E6B;
    transform: translateY(-1px);
}

/* Botón Ver Perfil */
.btn-sign {
    background: linear-gradient(105deg, #1C6E6B, #0A2F44);
    color: white !important;
    padding: 0.6rem 1.6rem;
    border-radius: 40px;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(28, 110, 107, 0.25);
}

.btn-sign::after {
    display: none !important;
}

.btn-sign:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 20px -8px rgba(28, 110, 107, 0.4);
}

/* Estilos para los menús desplegables (Dropdowns) */
.nav-item-dropdown {
    position: relative;
    display: inline-block;
}

.nav-item-dropdown .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    background-color: #FFFFFF;
    min-width: 180px;
    box-shadow: 0 10px 25px rgba(0, 48, 73, 0.12);
    border-radius: 12px;
    padding: 0.6rem 0;
    list-style: none;
    opacity: 0;
    visibility: hidden;
    transition: all 0.25s ease;
    z-index: 1100;
    border: 1px solid rgba(28, 110, 107, 0.1);
}

.nav-item-dropdown .dropdown-menu::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 7px solid transparent;
    border-bottom-color: #FFFFFF;
}

.nav-item-dropdown .dropdown-menu li a {
    display: block;
    padding: 0.6rem 1.2rem;
    color: #1A3A4A;
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
    text-align: left;
    transition: background 0.2s, color 0.2s;
}

.nav-item-dropdown .dropdown-menu li a::after {
    display: none;
}

.nav-item-dropdown .dropdown-menu li a:hover {
    background-color: rgba(28, 110, 107, 0.06);
    color: #1C6E6B;
}

.nav-item-dropdown:hover .dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
}

.nav-item-dropdown a i {
    font-size: 0.75rem;
    margin-left: 4px;
    transition: transform 0.2s;
}

.nav-item-dropdown:hover > a i {
    transform: rotate(180deg);
}



/* ===== Perfil (estilos que estaban en <style> de main.html y al final de main.css) ===== */
.profile-dropdown { position: relative; }
.profile-dropdown .nav-profile-badge { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.profile-dropdown .dropdown-menu-right { right: 0; left: auto; transform: translateY(10px); }
.profile-dropdown:hover .dropdown-menu-right,
.profile-dropdown.open .dropdown-menu-right { opacity: 1; visibility: visible; transform: translateY(0); }
.profile-dropdown .dropdown-menu-right::before { left: auto; right: 24px; transform: none; }
.profile-dropdown .dropdown-menu li a { display: flex; align-items: center; gap: 8px; padding: 0.7rem 1.2rem; font-size: 0.9rem; color: #1A3A4A; }
.profile-dropdown .dropdown-menu li a:hover { background-color: rgba(228, 109, 92, 0.08); color: #E46D5C; }
.nav-profile-badge {
  display: inline-flex; align-items: center; gap: 10px;
  background: linear-gradient(105deg, #1C6E6B, #0A2F44); color: white !important;
  padding: 0.35rem 1rem 0.35rem 0.4rem; border-radius: 40px; font-weight: 600; text-decoration: none;
  transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(28, 110, 107, 0.25);
}
.nav-profile-badge::after { display: none !important; }
.nav-profile-img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid #E2B13C; }
.nav-profile-badge:hover { transform: translateY(-2px); box-shadow: 0 8px 18px -6px rgba(28, 110, 107, 0.4); }
.streak-chip { font-size: 0.8rem; background: rgba(255,255,255,.18); padding: 1px 7px; border-radius: 20px; }

/* Abrir desplegables también con toque (en celulares no existe hover) */
.nav-item-dropdown.open .dropdown-menu { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
.nav-item-dropdown.open > a i { transform: rotate(180deg); }
.nav-links a.router-link-exact-active:not(.nav-profile-badge):not(.btn-sign) { color: #1C6E6B; }
.menu-toggle { display: none; }
.dropdown-menu { margin: 0; }
.nav-item-plain { position: relative; display: inline-block; }

/* ===== Responsive original ===== */
@media (max-width: 768px) {
  .main-nav { padding: 1rem 5%; flex-direction: row; justify-content: space-between; align-items: center; }
  .menu-toggle { display: block; background: none; border: none; color: #0A2F44; font-size: 1.5rem; cursor: pointer; padding: 0.5rem; }
  .nav-links {
    display: none; flex-direction: column; width: 100%; position: absolute; top: 100%; left: 0;
    background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px); padding: 1.5rem;
    box-shadow: 0 10px 20px rgba(0,0,0,0.05); border-bottom: 1px solid rgba(28, 110, 107, 0.15);
    gap: 1.2rem; z-index: 999; max-height: calc(100vh - 80px); overflow-y: auto;
  }
  .nav-links.active { display: flex; animation: navDrop .25s ease; }
  .nav-links a { width: 100%; text-align: center; padding: 0.5rem 0; font-size: 1.1rem; }
  .btn-sign { width: 100%; justify-content: center; margin-top: 0.5rem; }
  /* en móvil los desplegables se abren debajo, empujando el contenido */
  .nav-item-dropdown, .nav-item-plain { width: 100%; }
  .nav-item-dropdown .dropdown-menu { position: static; transform: none; display: none; box-shadow: none; margin-top: .4rem; }
  .nav-item-dropdown .dropdown-menu::before { display: none; }
  .nav-item-dropdown.open .dropdown-menu { display: block; transform: none; }
  .nav-item-dropdown .dropdown-menu li a { text-align: center; }
  .profile-dropdown .nav-profile-badge { justify-content: center; }
}
@keyframes navDrop { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
</style>