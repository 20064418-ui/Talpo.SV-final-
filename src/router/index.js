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
  { path: '/what-is-talapo', name: 'what-is-talapo', component: () => import('@/views/WhatIsTalapo.vue'), meta: { guestOnly: true, title: 'What is Talapo?' } },
  { path: '/main', name: 'main', component: () => import('@/views/LegacyPage.vue'), props: { name: 'main' } },
  { path: '/tours', name: 'tours', component: () => import('@/views/LegacyPage.vue'), props: { name: 'tours' } },
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { guestOnly: true, title: 'Sign in', noNavbar: true } },
  { path: '/register', name: 'register', component: () => import('@/views/Register.vue'), meta: { guestOnly: true, title: 'Create account', noNavbar: true } },
  { path: '/reset-password', name: 'reset-password', component: () => import('@/views/ResetPassword.vue'), meta: { title: 'Reset password', noNavbar: true } },
  { path: '/auth/callback', name: 'auth-callback', component: () => import('@/views/AuthCallback.vue'), meta: { bare: true } },
  { path: '/passport', name: 'passport', component: () => import('@/views/Passport.vue'), meta: { requiresAuth: true, title: 'My Passport' } },
  { path: '/itineraries', name: 'itineraries', component: () => import('@/views/Itineraries.vue'), meta: { requiresAuth: true, title: 'My trips' } },
  // Página del STAND (tablet en el lugar): pantalla completa, sin navbar/footer/chat
  {
    path: '/kiosk/:stand',
    component: () => import('@/views/kiosk/KioskShell.vue'),
    meta: { bare: true, kiosk: true, title: 'Talapo Stand' },
    children: [
      { path: '', name: 'kiosk-home', component: () => import('@/views/kiosk/KioskHome.vue'), meta: { bare: true, kiosk: true, title: 'Talapo Stand' } },
      { path: 'news', name: 'kiosk-news', component: () => import('@/views/kiosk/KioskNews.vue'), meta: { bare: true, kiosk: true, title: 'Municipal News' } },
      { path: 'history', name: 'kiosk-history', component: () => import('@/views/kiosk/KioskHistory.vue'), meta: { bare: true, kiosk: true, title: 'History' } },
      { path: 'place/:slug', name: 'kiosk-place', component: () => import('@/views/kiosk/KioskPlace.vue'), meta: { bare: true, kiosk: true, title: 'Place' } },
      { path: 'map', name: 'kiosk-map', component: () => import('@/views/kiosk/KioskMap.vue'), meta: { bare: true, kiosk: true, title: 'Map' } },
      { path: 'form', name: 'kiosk-form', component: () => import('@/views/kiosk/KioskForm.vue'), meta: { bare: true, kiosk: true, title: 'Fill the form' } },
    ],
  },
  { path: '/admin', redirect: '/admin/overview' },
  { path: '/admin/overview', name: 'admin-overview', component: () => import('@/views/AdminOverview.vue'), meta: { requiresAuth: true, title: 'Admin · Overview' } },
  { path: '/admin/reports', name: 'admin-reports', component: () => import('@/views/AdminReports.vue'), meta: { requiresAuth: true, title: 'Admin · Stand reports' } },
  { path: '/admin/users', name: 'admin-users', component: () => import('@/views/AdminUsers.vue'), meta: { requiresAuth: true, title: 'Admin · Users' } },
  { path: '/admin/announcements', name: 'admin-announcements', component: () => import('@/views/AdminAnnouncements.vue'), meta: { requiresAuth: true, title: 'Admin · Announcements' } },
  { path: '/admin/activity', name: 'admin-activity', component: () => import('@/views/AdminActivity.vue'), meta: { requiresAuth: true, title: 'Admin · Activity log' } },
  { path: '/admin/news', name: 'admin-news', component: () => import('@/views/AdminNews.vue'), meta: { requiresAuth: true, title: 'Admin · News' } },
  { path: '/admin/forum', name: 'admin-forum', component: () => import('@/views/AdminForum.vue'), meta: { requiresAuth: true, title: 'Admin · Forum' } },
  { path: '/messages', name: 'messages', component: () => import('@/views/Messages.vue'), meta: { requiresAuth: true, title: 'Messages' } },
  { path: '/admin/messages', name: 'admin-messages', component: () => import('@/views/AdminMessages.vue'), meta: { requiresAuth: true, title: 'Admin · Messages' } },
  { path: '/admin/site', name: 'admin-site', component: () => import('@/views/AdminSite.vue'), meta: { requiresAuth: true, title: 'Admin · Site' } },
  { path: '/admin/plans', name: 'admin-plans', component: () => import('@/views/AdminPlans.vue'), meta: { requiresAuth: true, title: 'Admin · Plans & sales' } },
  { path: '/admin/contests', name: 'admin-contests', component: () => import('@/views/AdminContests.vue'), meta: { requiresAuth: true, title: 'Admin · Contests' } },
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

const PUBLIC_ROUTES = new Set(['index', 'what-is-talapo', 'login', 'register', 'reset-password', 'auth-callback', 'not-found']);

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  // Páginas públicas (inicio, What is Talapo…) se muestran YA, sin esperar al servidor:
  // antes la pantalla quedaba en blanco hasta que InsForge respondía la sesión.
  if (!auth.ready && PUBLIC_ROUTES.has(to.name) && !to.meta.guestOnly) {
    auth.init();
    return true;
  }
  await auth.init();
  // Sin sesión solo se ve: inicio, "What is Talapo?", las pantallas para entrar y el Stand (la tablet no inicia sesión).
  // Todo lo demás pide iniciar sesión y, al entrar, vuelve a la página que quería abrir.
  if (!auth.isAuthenticated && !to.meta.kiosk && !PUBLIC_ROUTES.has(to.name)) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'main' };
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Talapo.SV` : 'Talapo.SV';
});

export default router;
