<script setup>
// Navegación del panel de administración, agrupada en 5 secciones.
// Arriba: grupos. Abajo: las páginas del grupo donde estás.
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { adminCounts, refreshAdminCounts } from '@/lib/adminCounts';

const props = defineProps({ counts: { type: Object, default: () => ({}) } });
const route = useRoute();

const GROUPS = [
  { key: 'dash', label: 'Dashboard', icon: 'fa-gauge-high', pages: [
    { to: '/admin/overview', label: 'Overview', icon: 'fa-gauge-high' },
  ] },
  { key: 'inbox', label: 'Inbox', icon: 'fa-inbox', pages: [
    { to: '/admin/messages', label: 'Messages', icon: 'fa-comments', count: 'messages' },
    { to: '/admin/reports', label: 'Stand reports', icon: 'fa-clipboard-list', count: 'reports' },
    { to: '/admin/forum', label: 'Forum', icon: 'fa-flag', count: 'forum' },
  ] },
  { key: 'sales', label: 'Sales', icon: 'fa-tags', pages: [
    { to: '/admin/plans', label: 'Plans & requests', icon: 'fa-tags', count: 'plans', also: ['/admin/trip'] },
  ] },
  { key: 'content', label: 'Content', icon: 'fa-pen-nib', pages: [
    { to: '/admin/site', label: 'Home page & settings', icon: 'fa-sliders' },
    { to: '/admin/news', label: 'News', icon: 'fa-newspaper' },
    { to: '/admin/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { to: '/admin/contests', label: 'Contests', icon: 'fa-trophy', count: 'contests' },
  ] },
  { key: 'people', label: 'People', icon: 'fa-users', pages: [
    { to: '/admin/users', label: 'Users', icon: 'fa-users-gear' },
    { to: '/admin/activity', label: 'Activity log', icon: 'fa-clock-rotate-left' },
  ] },
];

// Los números que manda la página (más frescos) mandan sobre los del contador global
const n = (key) => (props.counts[key] ?? adminCounts[key]) || 0;
const isOn = (p) => route.path === p.to || (p.also || []).some((x) => route.path.startsWith(x));
const current = computed(() => GROUPS.find((g) => g.pages.some(isOn)) || GROUPS[0]);
const groupCount = (g) => g.pages.reduce((t, p) => t + (p.count ? n(p.count) : 0), 0);

// En celular la barra se desliza sola para mostrar la sección activa (sin mover la página)
const nav = ref(null);
function centerActive() {
  nav.value?.querySelectorAll('.groups, .pages').forEach((row) => {
    const on = row.querySelector('.on');
    if (on && row.scrollWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
  });
}
onMounted(() => { refreshAdminCounts(); nextTick(centerActive); });
</script>

<template>
  <nav ref="nav" class="anav" aria-label="Admin sections">
    <div class="groups">
      <RouterLink v-for="g in GROUPS" :key="g.key" :to="g.pages[0].to" class="grp" :class="{ on: current.key === g.key }">
        <i class="fas" :class="g.icon"></i><span>{{ g.label }}</span>
        <em v-if="groupCount(g)" class="badge">{{ groupCount(g) }}</em>
      </RouterLink>
    </div>
    <div v-if="current.pages.length > 1" class="pages">
      <RouterLink v-for="p in current.pages" :key="p.to" :to="p.to" class="pg" :class="{ on: isOn(p) }">
        <i class="fas" :class="p.icon"></i> {{ p.label }}
        <em v-if="p.count && n(p.count)" class="badge sm">{{ n(p.count) }}</em>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.anav { background: #fff; border: 1px solid rgba(28,110,107,.15); border-radius: 22px; box-shadow: 0 10px 25px -15px rgba(0,32,64,.25); margin-bottom: 1.4rem; overflow: hidden; }
.groups, .pages { position: relative; }
.groups { display: flex; gap: 4px; padding: 6px; overflow-x: auto; scrollbar-width: none; }
.groups::-webkit-scrollbar, .pages::-webkit-scrollbar { display: none; }
.grp { flex: 1 0 auto; display: flex; align-items: center; justify-content: center; gap: .5rem; padding: .65rem 1rem; border-radius: 16px; font-weight: 700; color: #1A3A4A; text-decoration: none; transition: background .2s, color .2s; white-space: nowrap; min-height: 44px; }
.grp:hover { background: #f1f7f7; }
.grp.on { background: linear-gradient(105deg, #1C6E6B, #0A2F44); color: #fff; }
.grp i { opacity: .85; }
.pages { display: flex; gap: .3rem; padding: 0 .8rem; border-top: 1px solid #edf3f4; background: #fafcfd; overflow-x: auto; scrollbar-width: none; }
.pg { display: flex; align-items: center; gap: .45rem; padding: .7rem .9rem; color: #58717f; font-weight: 600; font-size: .92rem; text-decoration: none; border-bottom: 3px solid transparent; white-space: nowrap; }
.pg:hover { color: #1C6E6B; }
.pg.on { color: #0A2F44; border-bottom-color: #E46D5C; font-weight: 800; }
.badge { font-style: normal; background: #E46D5C; color: #fff; border-radius: 20px; padding: 0 .45rem; font-size: .72rem; font-weight: 800; line-height: 1.5; }
.grp.on .badge { background: #fff; color: #E46D5C; }
.badge.sm { font-size: .68rem; }
@media (max-width: 700px) {
  .grp { flex: 0 0 auto; padding: .6rem .8rem; }
  .grp span { font-size: .9rem; }
}
</style>
