<script setup>
// Banner de anuncios publicados por los administradores (se puede cerrar).
import { ref, computed, onMounted } from 'vue';
import { insforge, isConfigured } from '@/lib/insforge';

const items = ref([]);
const dismissed = ref([]);
const KEY = 'talapo.dismissed.announcements';

onMounted(async () => {
  try { dismissed.value = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { dismissed.value = []; }
  if (!isConfigured) return;
  try {
    const { data } = await insforge.database.from('announcements')
      .select('id, message, level, link_url, link_label').order('created_at', { ascending: false }).limit(3);
    items.value = data || [];
  } catch { /* sin anuncios */ }
});

const current = computed(() => items.value.find((a) => !dismissed.value.includes(a.id)));
const icon = { info: 'fa-circle-info', success: 'fa-circle-check', warning: 'fa-triangle-exclamation', urgent: 'fa-bullhorn' };
const isInternal = (u) => u?.startsWith('/') && !u.startsWith('//');

function close() {
  dismissed.value = [...dismissed.value, current.value.id].slice(-30);
  try { localStorage.setItem(KEY, JSON.stringify(dismissed.value)); } catch { /* modo privado */ }
}
</script>

<template>
  <div v-if="current" class="ann" :class="current.level" role="status">
    <i class="fas" :class="icon[current.level] || icon.info"></i>
    <span class="msg">{{ current.message }}</span>
    <template v-if="current.link_url">
      <RouterLink v-if="isInternal(current.link_url)" :to="current.link_url" class="go">{{ current.link_label || 'Learn more' }}</RouterLink>
      <a v-else :href="current.link_url" target="_blank" rel="noopener" class="go">{{ current.link_label || 'Learn more' }}</a>
    </template>
    <button class="x" aria-label="Dismiss announcement" @click="close"><i class="fas fa-xmark"></i></button>
  </div>
</template>

<style scoped>
.ann { display: flex; align-items: center; gap: .7rem; padding: .65rem 5%; font-size: .92rem; font-weight: 600; background: #0A2F44; color: #fff; position: relative; z-index: 1001; }
.ann.success { background: #166534; } .ann.warning { background: #8a5a00; } .ann.urgent { background: #b4432f; }
.msg { flex: 1; min-width: 0; }
.go { color: #fff; text-decoration: underline; white-space: nowrap; }
.x { background: none; border: 0; color: #fff; cursor: pointer; font-size: 1rem; min-width: 36px; min-height: 36px; opacity: .85; }
.x:hover { opacity: 1; }
</style>
