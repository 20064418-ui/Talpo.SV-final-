<script setup>
import { computed, watch, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import AppNavbar from '@/components/layout/AppNavbar.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import TalapoAI from '@/components/layout/TalapoAI.vue';
import ToastHost from '@/components/ui/ToastHost.vue';
import { useAuthStore } from '@/stores/auth';
import { usePassportStore } from '@/stores/passport';
import { useItinerariesStore } from '@/stores/itineraries';
import { useContestsStore } from '@/stores/contests';

const route = useRoute();
const router = useRouter();

// Barra de progreso al navegar entre páginas
const progress = ref({ width: 0, visible: false });
let timer;
router.beforeEach(() => { clearTimeout(timer); progress.value = { width: 35, visible: true }; timer = setTimeout(() => { progress.value.width = 75; }, 200); });
router.afterEach(() => { clearTimeout(timer); progress.value.width = 100; timer = setTimeout(() => { progress.value = { width: 0, visible: false }; }, 350); });
const bare = computed(() => route.meta.bare);
// El index conserva su navbar original; el resto usa el navbar global de main
const showNavbar = computed(() => !route.meta.bare && !route.meta.ownNavbar && !route.meta.noNavbar);
const auth = useAuthStore();
const passport = usePassportStore();
const itineraries = useItinerariesStore();
const contests = useContestsStore();

// Persistencia: al haber sesión se cargan perfil + racha + itinerarios + concursos
watch(() => auth.user?.id, (id) => {
  if (id) {
    passport.load().catch((e) => console.error('[Talapo] passport', e));
    itineraries.load().catch((e) => console.error('[Talapo] itineraries', e));
    contests.load().catch((e) => console.error('[Talapo] contests', e));
  } else {
    passport.reset(); itineraries.reset(); contests.reset();
  }
}, { immediate: true });
</script>

<template>
  <a class="skip-link" href="#content">Skip to content</a>
  <div class="route-progress" :style="{ width: progress.width + '%', opacity: progress.visible ? 1 : 0 }"></div>
  <AppNavbar v-if="showNavbar" />
  <main id="content" class="app-main">
    <!-- Transición entre páginas (lo único nuevo a nivel visual) -->
    <RouterView v-slot="{ Component, route: r }">
      <Transition name="page" mode="out-in" appear>
        <component :is="Component" :key="r.path" />
      </Transition>
    </RouterView>
  </main>
  <AppFooter v-if="!bare && !route.meta.ownFooter" />
  <TalapoAI />
  <ToastHost />
</template>
