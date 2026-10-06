/* Talapo.SV — Service worker: la página (y sobre todo el Stand) sigue funcionando sin internet.
   · Páginas: primero internet; si no hay, la última versión guardada.
   · Archivos de la app (/assets/…): se guardan al usarse (tienen nombre único por versión).
   · Fotos y mapas externos (Wikimedia, OpenStreetMap, fuentes): se guardan al verse.
   · Las llamadas a InsForge NO se guardan aquí (los formularios usan su propia cola). */
const VERSION = 'talapo-v2';
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const MEDIA = `${VERSION}-media`;
const MEDIA_HOSTS = ['commons.wikimedia.org', 'upload.wikimedia.org', 'tile.openstreetmap.org', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];
const MAX_MEDIA = 400;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.add('/')).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!k.startsWith(VERSION)) await caches.delete(k);
    await self.clients.claim();
  })());
});

// El Stand pide guardar por adelantado sus fotos (para verlas aunque se vaya la señal)
self.addEventListener('message', (e) => {
  if (e.data?.type !== 'precache' || !Array.isArray(e.data.urls)) return;
  e.waitUntil((async () => {
    const cache = await caches.open(MEDIA);
    for (const url of e.data.urls) {
      try {
        if (await cache.match(url)) continue;
        const res = await fetch(url, { mode: url.startsWith(self.location.origin) || url.startsWith('/') ? 'same-origin' : 'no-cors' });
        if (res.ok || res.type === 'opaque') await cache.put(url, res);
      } catch { /* sin conexión: se intentará otra vez */ }
    }
  })());
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 1) Navegación (abrir cualquier página de la SPA)
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(PAGES);
        cache.put('/', res.clone());
        return res;
      } catch {
        return (await caches.match('/')) || new Response('<h1>Sin conexión</h1>', { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  // 2) Archivos propios (JS/CSS con hash, imágenes de /assets)
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/assets/') || /\.(js|css|png|jpe?g|webp|svg|gif|ico|woff2?)$/i.test(url.pathname)) {
      e.respondWith((async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) (await caches.open(ASSETS)).put(req, res.clone());
          return res;
        } catch { return hit || Response.error(); }
      })());
    }
    return;
  }

  // 3) Fotos, mapas y fuentes externas: rápido desde caché y se actualiza por detrás
  if (MEDIA_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const cache = await caches.open(MEDIA);
      const hit = await cache.match(req);
      const net = fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') { cache.put(req, res.clone()); trim(MEDIA, MAX_MEDIA); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })());
  }
});
