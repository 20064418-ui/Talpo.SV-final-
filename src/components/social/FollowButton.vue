<script setup>
// Botón Follow / Following reutilizable
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSocialStore } from '@/stores/social';
import { toast } from '@/composables/useToast';

const props = defineProps({ userId: { type: String, required: true }, name: { type: String, default: '' }, small: Boolean });
const emit = defineEmits(['change']);
const auth = useAuthStore();
const social = useSocialStore();
const router = useRouter();
const busy = ref(false);
const hover = ref(false);

const isMe = computed(() => auth.user?.id === props.userId);
const following = computed(() => social.isFollowing(props.userId));

async function toggle() {
  if (!auth.isAuthenticated) {
    toast('Sign in to follow travelers', 'info');
    return router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
  }
  busy.value = true;
  try {
    if (following.value) { await social.unfollow(props.userId); emit('change', -1); }
    else { await social.follow(props.userId); emit('change', 1); toast(`You are now following ${props.name || 'this traveler'} 🤝`); }
  } catch (e) { toast(e.message, 'error'); }
  finally { busy.value = false; }
}
</script>

<template>
  <!-- botón (no enlace) para poder ir dentro de tarjetas que ya son enlaces -->
  <button v-if="isMe" class="fbtn me" :class="{ small }" @click.stop.prevent="router.push('/passport')"><i class="fas fa-passport"></i> My passport</button>
  <button v-else class="fbtn" :class="{ on: following, small }" :disabled="busy"
          @mouseenter="hover = true" @mouseleave="hover = false" @click.stop.prevent="toggle">
    <i class="fas" :class="busy ? 'fa-spinner fa-spin' : following ? (hover ? 'fa-user-minus' : 'fa-user-check') : 'fa-user-plus'"></i>
    {{ following ? (hover ? 'Unfollow' : 'Following') : 'Follow' }}
  </button>
</template>

<style scoped>
.fbtn { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; border: 1.5px solid #E46D5C; background: #E46D5C; color: #fff; border-radius: 40px; padding: .6rem 1.2rem; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; transition: background .2s, color .2s, border-color .2s, transform .15s; min-width: 120px; }
.fbtn:hover { transform: translateY(-2px); }
.fbtn.on { background: #fff; color: #1C6E6B; border-color: #1C6E6B; }
.fbtn.on:hover { color: #E46D5C; border-color: #E46D5C; }
.fbtn.me { background: #0A2F44; border-color: #0A2F44; }
.fbtn.small { padding: .4rem .85rem; font-size: .85rem; min-width: 0; }
.fbtn:disabled { opacity: .7; cursor: wait; }
</style>
