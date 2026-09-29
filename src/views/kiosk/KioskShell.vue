<script setup>
// Marco de la página del Stand (tablet en el lugar). Sin navbar ni footer de Talapo:
// pantalla completa, botones grandes y regreso automático al inicio si nadie la usa.
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { stands } from '@/data/stands';

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
  idleTimer = setTimeout(() => router.replace({ name: 'kiosk-home', params: { stand: route.params.stand } }), IDLE_MS);
}
const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
onMounted(() => {
  events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
  clock = setInterval(() => (now.value = new Date()), 30_000);
  resetIdle();
});
onBeforeUnmount(() => { events.forEach((e) => window.removeEventListener(e, resetIdle)); clearTimeout(idleTimer); clearInterval(clock); });
watch(() => route.fullPath, resetIdle);

const time = computed(() => now.value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
</script>

<template>
  <div v-if="stand" class="kiosk">
    <header class="k-head">
      <button v-if="!isHome" class="k-back" aria-label="Back" @click="router.back()"><i class="fas fa-arrow-left"></i></button>
      <RouterLink :to="{ name: 'kiosk-home', params: { stand: stand.id } }" class="k-brand">
        <img src="/assets/img/logos/logooriginal.png" alt="" width="44" height="44" />
        <span><b>TALAPO.SV</b><small>Stand · {{ stand.name }}, {{ stand.city }}</small></span>
      </RouterLink>
      <span class="k-time">{{ time }}</span>
      <RouterLink v-if="!isHome" :to="{ name: 'kiosk-home', params: { stand: stand.id } }" class="k-home"><i class="fas fa-house"></i> Home</RouterLink>
    </header>
    <main class="k-main">
      <RouterView v-slot="{ Component }">
        <Transition name="kfade" mode="out-in"><component :is="Component" :stand="stand" /></Transition>
      </RouterView>
    </main>
  </div>
  <div v-else class="k-missing">
    <h1>Stand not found</h1>
    <RouterLink to="/">Go to Talapo.SV</RouterLink>
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
.k-main { flex: 1; display: flex; flex-direction: column; }
.k-missing { padding: 4rem; text-align: center; font-family: 'Outfit', sans-serif; }
.kfade-enter-active, .kfade-leave-active { transition: opacity .25s ease, transform .3s ease; }
.kfade-enter-from { opacity: 0; transform: translateY(12px); }
.kfade-leave-to { opacity: 0; }
@media (max-width: 560px) { .k-time { display: none; } .k-home { padding: 0 14px; } .k-brand small { display: none; } }
</style>
