import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Páginas heredadas que corren en "modo compatibilidad" dentro de LegacyPage.vue
export const legacyPages = [
  'buses', 'clothing', 'conversiones', 'emergency', 'foro', 'gastronomy', 'planes',
  'planflights', 'planguide', 'planhoteles', 'planrestaurantes', 'plantransporte', 'ra',
  'stand', 'talapo-itinerario', 'traductor', 'travelkits', 'turisticattractions', 'typicalrecipes',
];

function htmlToRoute(page) {
  const p = page.toLowerCase().split('/').pop();
  const map = { index: '/', talapo: '/', registre: '/register', registro: '/register', pasaporte: '/passport', stands: '/stand' };
  return map[p] || `/${p}`;
}

const routes = [
  // index, main y tours usan su HTML/CSS/JS ORIGINAL (diseño sin cambios)
  { path: '/', name: 'index', component: () => import('@/views/LegacyPage.vue'), props: { name: 'index' }, meta: { ownNavbar: true, ownFooter: true } },
  { path: '/main', name: 'main', component: () => import('@/views/LegacyPage.vue'), props: { name: 'main' } },
  { path: '/tours', name: 'tours', component: () => import('@/views/LegacyPage.vue'), props: { name: 'tours' } },
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { guestOnly: true, title: 'Sign in', noNavbar: true } },
  { path: '/register', name: 'register', component: () => import('@/views/Register.vue'), meta: { guestOnly: true, title: 'Create account', noNavbar: true } },
  { path: '/auth/callback', name: 'auth-callback', component: () => import('@/views/AuthCallback.vue'), meta: { bare: true } },
  { path: '/passport', name: 'passport', component: () => import('@/views/Passport.vue'), meta: { requiresAuth: true, title: 'My Passport' } },
  { path: '/itineraries', name: 'itineraries', component: () => import('@/views/Itineraries.vue'), meta: { requiresAuth: true, title: 'My trips' } },
  { path: '/travelers', name: 'travelers', component: () => import('@/views/Travelers.vue'), meta: { title: 'Travelers' } },
  { path: '/travelers/:id', name: 'traveler', component: () => import('@/views/TravelerProfile.vue'), meta: { title: 'Traveler' } },
  { path: '/contests', name: 'contests', component: () => import('@/views/Contests.vue'), meta: { title: 'Talapo Contests' } },
  ...legacyPages.map((name) => ({
    path: `/${name}`, name, component: () => import('@/views/LegacyPage.vue'), props: { name },
    // El catálogo (clothing) va sin footer, como pidió el cliente
    meta: name === 'clothing' ? { ownFooter: true } : {},
  })),
  // Rutas antiguas (.html y nombres en español) para no romper enlaces guardados
  { path: '/registre', redirect: '/register' },
  { path: '/pasaporte', redirect: '/passport' },
  { path: '/stands', redirect: '/stand' },
  // Enlaces viejos a .html: se conserva ?query y #hash (p. ej. ra.html?lugar=el_tunco)
  { path: '/components/:page(.*).html', redirect: (to) => ({ path: htmlToRoute(to.params.page), query: to.query, hash: to.hash }) },
  { path: '/:page(.*).html', redirect: (to) => ({ path: htmlToRoute(to.params.page), query: to.query, hash: to.hash }) },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue'), meta: { title: 'Not found' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 };
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.init();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'main' };
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Talapo.SV` : 'Talapo.SV';
});

export default router;
