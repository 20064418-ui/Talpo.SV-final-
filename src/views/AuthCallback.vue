<script setup>
// Vuelta del proveedor OAuth (Google / GitHub / Facebook).
// Primera vez (sin fila en profiles) -> /passport · Usuario existente -> /main
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usePassportStore } from '@/stores/passport';

const router = useRouter();
const auth = useAuthStore();
const passport = usePassportStore();
const error = ref('');

onMounted(async () => {
  try {
    const user = await auth.completeOAuth();
    const returning = await passport.exists(user.id);
    auth.user = user; // ahora sí: dispara la carga de perfil/racha/itinerarios
    if (!returning) await passport.ensureProfile();
    router.replace(returning ? '/main' : '/passport');
  } catch (e) {
    error.value = e.message;
  }
});
</script>

<template>
  <div class="tp cb">
    <template v-if="!error">
      <img src="/assets/img/logos/logooriginal.png" alt="" width="72" height="72" class="bird" />
      <p>Stamping your passport…</p>
    </template>
    <template v-else>
      <h1>Sign-in didn’t finish</h1>
      <p class="muted">{{ error }}</p>
      <RouterLink class="btn btn-primary" to="/login">Back to sign in</RouterLink>
    </template>
  </div>
</template>

<style scoped>
.cb { min-height: 100vh; display: grid; place-content: center; justify-items: center; text-align: center; gap: .8rem; padding: 2rem; }
.bird { animation: bob 1.2s ease-in-out infinite; }
@keyframes bob { 50% { transform: translateY(-8px); } }
</style>
