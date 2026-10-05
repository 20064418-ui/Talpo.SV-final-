<script setup>
// Pestañas del panel de administración
defineProps({ counts: { type: Object, default: () => ({}) } });
const tabs = [
  { to: '/admin/overview', icon: 'fa-gauge-high', label: 'Overview', key: 'overview' },
  { to: '/admin/news', icon: 'fa-newspaper', label: 'News', key: 'news' },
  { to: '/admin/reports', icon: 'fa-clipboard-list', label: 'Stand reports', key: 'reports' },
  { to: '/admin/forum', icon: 'fa-comments', label: 'Forum', key: 'forum' },
  { to: '/admin/contests', icon: 'fa-trophy', label: 'Contests', key: 'contests' },
  { to: '/admin/users', icon: 'fa-users-gear', label: 'Users', key: 'users' },
  { to: '/admin/announcements', icon: 'fa-bullhorn', label: 'Announcements', key: 'announcements' },
  { to: '/admin/activity', icon: 'fa-clock-rotate-left', label: 'Activity log', key: 'activity' },
];
</script>

<template>
  <nav class="admin-tabs" aria-label="Admin sections">
    <RouterLink v-for="t in tabs" :key="t.to" :to="t.to" class="tab" active-class="on">
      <i class="fas" :class="t.icon"></i> {{ t.label }}
      <span v-if="counts[t.key]" class="badge">{{ counts[t.key] }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.admin-tabs { display: flex; flex-wrap: wrap; gap: 4px; width: fit-content; max-width: 100%; background: #fff; border: 1px solid rgba(28,110,107,.18); border-radius: 28px; padding: 5px; box-shadow: 0 10px 25px -15px rgba(0,32,64,.25); margin-bottom: 1.4rem; }
.tab { display: flex; align-items: center; gap: .45rem; padding: .6rem 1.1rem; border-radius: 40px; font-weight: 700; color: #1A3A4A; text-decoration: none; transition: background .25s, color .25s; white-space: nowrap; }
.tab.on { background: linear-gradient(105deg, #1C6E6B, #0A2F44); color: #fff; }
.badge { background: #E46D5C; color: #fff; border-radius: 20px; padding: 0 .5rem; font-size: .75rem; }
/* Tablet y celular: las pestañas se deslizan en una sola fila, con botones fáciles de tocar */
@media (max-width: 1100px) {
  .admin-tabs { width: 100%; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .admin-tabs::-webkit-scrollbar { display: none; }
  .tab { min-height: 44px; flex: 0 0 auto; }
}
</style>
