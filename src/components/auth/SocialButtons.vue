<script setup>
// Botones de inicio de sesión social en forma de íconos (Google, GitHub, Facebook) — InsForge OAuth
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

defineProps({ title: { type: String, default: 'or continue with' } });
const emit = defineEmits(['error']);
const auth = useAuthStore();
const busy = ref(null);
const providers = [
  { id: 'google', label: 'Google', icon: 'fab fa-google' },
  { id: 'github', label: 'GitHub', icon: 'fab fa-github' },
  { id: 'facebook', label: 'Facebook', icon: 'fab fa-facebook-f' },
];
async function go(p) {
  busy.value = p;
  try { await auth.signInWithProvider(p); } catch (e) { emit('error', e.message); busy.value = null; }
}
</script>

<template>
  <div class="social-login">
    <p class="social-title">{{ title }}</p>
    <div class="social-icons">
      <button v-for="p in providers" :key="p.id" type="button" class="social-icon" :class="p.id"
              :disabled="!!busy" :aria-label="`Continue with ${p.label}`" :title="p.label" @click="go(p.id)">
        <i :class="busy === p.id ? 'fas fa-spinner fa-spin' : p.icon"></i>
      </button>
    </div>
  </div>
</template>
