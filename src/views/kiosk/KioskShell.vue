<script setup>
// Marco de la página del Stand (tablet en el lugar). Sin navbar ni footer de Talapo:
// pantalla completa, botones grandes y regreso automático al inicio si nadie la usa.
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { stands } from '@/data/stands';
import { useKioskI18n, DEFAULT_LANG } from '@/i18n/kiosk';
import { startQueue, pending, online } from '@/lib/kioskQueue';

const { t, lang, setLang, languages, locale } = useKioskI18n();

const route = useRoute();
const router = useRouter();
const stand = computed(() => stands[route.params.stand]);
const isHome = computed(() => route.name === 'kiosk-home');
// La ficha de un lugar se abre también en celulares (por QR): ahí no hay reinicio automático
const idleEnabled = computed(() => route.name !== 'kiosk-place');

const now = ref(new Date());
const IDLE_MS = 90_000;
let idleTimer; let clock;
function resetIdle() {
  clearTimeout(idleTimer);
  if (!idleEnabled.value || isHome.value) return;
  idleTimer = setTimeout(() => {
    setLang(DEFAULT_LANG); // el siguiente visitante empieza en español
    router.replace({ name: 'kiosk-home', params: { stand: route.params.stand } });
  }, IDLE_MS);
}
const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
/** Deja listo el stand para funcionar sin internet: pantallas y fotos guardadas en la tablet. */
function prepareOffline() {
  // Carga por adelantado todas las pantallas del stand
  ['KioskHome', 'KioskNews', 'KioskHistory', 'KioskPlace', 'KioskMap', 'KioskForm'].forEach((v) => {
    import(`./${v}.vue`).catch(() => {});
  });
  // Pide al service worker guardar las fotos del stand
  const urls = [stand.value.cover, ...stand.value.places.map((p) => p.image)].filter(Boolean);
  navigator.serviceWorker?.ready.then((reg) => reg.active?.postMessage({ type: 'precache', urls })).catch(() => {});
}

onMounted(() => {
  startQueue();
  if (stand.value) prepareOffline();
  events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
  clock = setInterval(() => (now.value = new Date()), 30_000);
  resetIdle();
});
onBeforeUnmount(() => { events.forEach((e) => window.removeEventListener(e, resetIdle)); clearTimeout(idleTimer); clearInterval(clock); });
watch(() => route.fullPath, resetIdle);

const time = computed(() => now.value.toLocaleTimeString(locale.value, { hour: 'numeric', minute: '2-digit' }));
const langOpen = ref(false);
const current = computed(() => languages.find((l) => l.code === lang.value));
function choose(code) { setLang(code); langOpen.value = false; }
</script>

<template>
  <div v-if="stand" class="kiosk">
    <header class="k-head">
      <button v-if="!isHome" class="k-back" :aria-label="t('back')" @click="router.back()"><i class="fas fa-arrow-left"></i></button>
      <RouterLink :to="{ name: 'kiosk-home', params: { stand: stand.id } }" class="k-brand">
        <img src="/assets/img/logos/logooriginal.png" alt="" width="44" height="44" />
        <span><b>TALAPO.SV</b><small>{{ t('standOf') }} · {{ stand.name }}, {{ stand.city }}</small></span>
      </RouterLink>
      <span class="k-time">{{ time }}</span>
      <!-- Selector de idioma -->
      <div class="k-lang" :class="{ open: langOpen }">
        <button class="k-lang-btn" :aria-label="t('chooseLang')" :aria-expanded="langOpen" @click="langOpen = !langOpen">
          <span class="flag">{{ current.flag }}</span><span class="code">{{ current.code.toUpperCase() }}</span><i class="fas fa-chevron-down"></i>
        </button>
        <Transition name="kfade">
          <ul v-if="langOpen" class="k-lang-menu" role="listbox">
            <li v-for="l in languages" :key="l.code">
              <button :class="{ on: l.code === lang }" role="option" :aria-selected="l.code === lang" @click="choose(l.code)">
                <span class="flag">{{ l.flag }}</span>{{ l.label }}<i v-if="l.code === lang" class="fas fa-check"></i>
              </button>
            </li>
          </ul>
        </Transition>
      </div>
      <RouterLink v-if="!isHome" :to="{ name: 'kiosk-home', params: { stand: stand.id } }" class="k-home"><i class="fas fa-house"></i> {{ t('home') }}</RouterLink>
    </header>
    <!-- Aviso de "sin conexión" -->
    <Transition name="kfade">
      <div v-if="!online || pending" class="k-offline" :class="{ ok: online }">
        <template v-if="!online">📴 <b>{{ t('offline') }}</b> · {{ t('offlineText') }}</template>
        <template v-if="pending"> <span class="k-pending">{{ t('pendingForms', { n: pending }) }}</span></template>
      </div>
    </Transition>
    <main class="k-main">
      <RouterView v-slot="{ Component }">
        <Transition name="kfade" mode="out-in"><component :is="Component" :stand="stand" /></Transition>
      </RouterView>
    </main>
  </div>
  <div v-else class="k-missing">
    <h1>{{ t('notFound') }}</h1>
    <RouterLink to="/">{{ t('goTalapo') }}</RouterLink>
  </div>
</template>

<style scoped>
.kiosk { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; background: #F4F8FA; font-family: 'Outfit', 'Inter', sans-serif; color: #0A2F44; -webkit-user-select: none; user-select: none; }
.k-head { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 14px; padding: 12px clamp(14px, 3vw, 28px); background: #fff; border-bottom: 1px solid rgba(28,110,107,.15); box-shadow: 0 6px 18px -14px rgba(0,0,0,.35); }
.k-back, .k-home { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; border-radius: 40px; border: 0; font: inherit; font-weight: 700; font-size: 1.05rem; cursor: pointer; text-decoration: none; }
.k-back { width: 52px; background: #EEF6F6; color: #1C6E6B; font-size: 1.2rem; }
.k-home { padding: 0 22px; background: #0A2F44; color: #fff; }
.k-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; margin-right: auto; }
.k-brand b { display: block; font-size: 1.3rem; letter-spacing: .5px; color: #1C6E6B; }
.k-brand small { display: block; color: #58717f; font-size: .85rem; }
.k-time { font-weight: 700; color: #58717f; font-size: 1.1rem; }
.k-lang { position: relative; }
.k-lang-btn { display: inline-flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 16px; border-radius: 40px; border: 2px solid #dce7ea; background: #fff; font: inherit; font-weight: 800; color: #0A2F44; cursor: pointer; }
.k-lang-btn .flag { font-size: 1.5rem; }
.k-lang-btn i { font-size: .75rem; transition: transform .2s; }
.k-lang.open .k-lang-btn i { transform: rotate(180deg); }
.k-lang-menu { position: absolute; right: 0; top: calc(100% + 8px); list-style: none; margin: 0; padding: 8px; background: #fff; border-radius: 18px; box-shadow: 0 20px 40px -12px rgba(0,0,0,.35); min-width: 210px; z-index: 60; }
.k-lang-menu button { width: 100%; display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 14px; border: 0; background: none; border-radius: 12px; font: inherit; font-size: 1.1rem; font-weight: 700; color: #0A2F44; cursor: pointer; text-align: left; }
.k-lang-menu button:hover, .k-lang-menu button.on { background: #EEF6F6; }
.k-lang-menu .flag { font-size: 1.6rem; }
.k-lang-menu i { margin-left: auto; color: #1C6E6B; }
.k-offline { background: #fff4d6; color: #7a4b00; padding: 10px clamp(14px, 3vw, 28px); font-size: 1rem; border-bottom: 1px solid #f7d9a4; }
.k-offline.ok { background: #e6f5ee; color: #166534; border-color: #bfe6cf; }
.k-pending { display: inline-block; margin-left: 6px; background: rgba(0,0,0,.08); padding: 2px 10px; border-radius: 20px; font-weight: 700; }
.k-main { flex: 1; display: flex; flex-direction: column; }
.k-missing { padding: 4rem; text-align: center; font-family: 'Outfit', sans-serif; }
.kfade-enter-active, .kfade-leave-active { transition: opacity .25s ease, transform .3s ease; }
.kfade-enter-from { opacity: 0; transform: translateY(12px); }
.kfade-leave-to { opacity: 0; }
@media (max-width: 560px) { .k-lang-btn .code { display: none; } .k-time { display: none; } .k-home { padding: 0 14px; } .k-brand small { display: none; } }
</style>
