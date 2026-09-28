<script setup>
// Monta una página heredada (HTML + CSS acotado + JS original) dentro de la SPA.
// Es el "modo compatibilidad" de la migración: cada página puede reescribirse luego
// como componente Vue nativo sin tocar el resto del sitio.
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { loadLegacyPage, loadExternal } from '@/legacy/registry';
import { createLegacyBridge } from '@/legacy/bridge';

const props = defineProps({ name: { type: String, required: true } });
const router = useRouter();
const host = ref(null);
const failed = ref(false);
const loading = ref(true);

const cleanups = [];
const exposed = [];

function ctx() {
  const queue = [];
  return {
    queue,
    __ready: (fn) => queue.push(fn),
    __listen: (target, type, handler, opts) => {
      const safe = (e) => { try { return handler.call(target, e); } catch (err) { console.warn(`[legacy:${props.name}]`, err); } };
      target.addEventListener(type, safe, opts);
      cleanups.push(() => target.removeEventListener(type, safe, opts));
    },
    __interval: (fn, ms, ...args) => {
      const id = setInterval(() => { try { fn(...args); } catch (err) { console.warn(`[legacy:${props.name}]`, err); } }, ms);
      cleanups.push(() => clearInterval(id));
      return id;
    },
    __expose: (key, value) => { window[key] = value; exposed.push(key); },
  };
}

// Enlaces internos (<a href="/tours">) navegan con el router, sin recargar la página
function onClick(e) {
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || e.ctrlKey || e.metaKey) return;
  const href = a.getAttribute('href');
  if (href.startsWith('/') && !href.startsWith('//') && !/\.(mp4|pdf|jpg|png|webp)$/i.test(href)) {
    e.preventDefault();
    router.push(href);
  }
}

onMounted(async () => {
  try {
    const { html, code, meta } = await loadLegacyPage(props.name);
    if (meta.title) document.title = `${meta.title.replace(/Talapo\.?SV/i, '').trim() || meta.name} · Talapo.SV`;
    await Promise.all(meta.fonts.map((src) => loadExternal({ type: 'css', src })));
    const c = ctx();
    // Librerías externas (p. ej. OpenLayers) antes del script; las que llaman a un
    // callback global (Google Translate ?cb=) después, cuando el callback ya existe.
    const before = meta.externals.filter((e) => !/[?&]cb=/.test(e.src));
    const after = meta.externals.filter((e) => /[?&]cb=/.test(e.src));
    for (const ext of before) await loadExternal(ext);

    // Elementos "fantasma" ocultos: el JS viejo de cada página buscaba el navbar antiguo
    // (#menuToggle, #navLinks…). Ese navbar ya no existe: ahora es AppNavbar.vue.
    host.value.innerHTML = `${html}<div hidden aria-hidden="true" class="legacy-ghosts">
      <button id="menuToggle"><i class="fas fa-bars"></i></button><div id="navLinks"></div>
      <img id="navProfileImg" class="nav-profile-img" alt=""><span id="navProfileName"></span><a id="logoutBtn"></a></div>`;
    loading.value = false;
    try {
      // Stubs del carrusel de main.js que se copió en todos los JS antiguos
      new Function('__ready', '__listen', '__interval', '__expose', '__talapo', 'updateRotativeCarousel', 'startAutoPlay', code)(
        c.__ready, c.__listen, c.__interval, c.__expose, createLegacyBridge(router), () => {}, () => {});
    } catch (err) {
      console.warn(`[legacy:${props.name}] el script original lanzó un error; la página sigue visible.`, err);
    }
    for (const ext of after) await loadExternal(ext);
    for (const fn of c.queue) {
      try { fn.call(window, new Event('DOMContentLoaded')); } catch (err) { console.warn(`[legacy:${props.name}]`, err); }
    }
    // Anclas (#about, #places…) al llegar desde otra página
    if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' }), 100);
    requestAnimationFrame(setupReveal);
  } catch (err) {
    console.error(`[legacy:${props.name}]`, err);
    failed.value = true;
    loading.value = false;
  }
});

/* Transición al hacer scroll: solo opacidad + desplazamiento, sobre los bloques
   principales y las tarjetas conocidas. No cambia colores, tamaños ni tipografías. */
const CARD_SELECTORS = '.dest-card, .member-card, .partner-card, .social-card, .feature-card, .place-card, .info-card, .testimonial-card, .stats-card, .tour-card, .recipe-card, .kit-card, .product-card, .plan-card';
function setupReveal() {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = host.value;
  const skip = (el) => {
    const cs = getComputedStyle(el);
    return el.hidden || cs.position === 'fixed' || cs.position === 'absolute' || cs.display === 'none'
      || /modal|overlay|toast|cart|backdrop|panel/i.test(`${el.id} ${el.className}`)
      || el.getBoundingClientRect().top < innerHeight * 0.9; // lo que ya se ve no se oculta
  };
  const blocks = [...root.children, ...root.querySelectorAll(CARD_SELECTORS)].filter((el) => !skip(el));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
      // al terminar se quita la clase para no interferir con los efectos hover originales
      setTimeout(() => { e.target.classList.remove('reveal', 'is-visible'); e.target.style.transitionDelay = ''; }, 1200);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  // escalonado suave dentro de cada grupo de tarjetas
  blocks.forEach((el) => {
    const siblings = el.parentElement ? [...el.parentElement.children] : [];
    el.style.transitionDelay = el.matches(CARD_SELECTORS) ? `${Math.min(siblings.indexOf(el), 6) * 70}ms` : '';
    el.classList.add('reveal');
    io.observe(el);
  });
  cleanups.push(() => io.disconnect());
}

onBeforeUnmount(() => {
  cleanups.forEach((fn) => fn());
  exposed.forEach((k) => { try { delete window[k]; } catch { window[k] = undefined; } });
  document.querySelectorAll('video').forEach((v) => v.pause());
});
</script>

<template>
  <div :class="`legacy lg-${name}`" @click="onClick">
    <div v-if="loading" class="legacy-loading" aria-live="polite"><i class="fas fa-feather-pointed fa-bounce"></i> Loading…</div>
    <div v-if="failed" class="tp wrap section">
      <h1>This page could not load</h1>
      <p class="muted">Refresh the page or go back to <RouterLink to="/main">home</RouterLink>.</p>
    </div>
    <div ref="host" class="legacy-host"></div>
  </div>
</template>

<style>
.legacy { position: relative; }
.legacy-loading { padding: 4rem 1rem; text-align: center; color: var(--ink-500); font-weight: 600; }
.legacy-loading i { color: var(--teal-500); margin-right: .4rem; }
</style>
