<script setup>
// Registro de actividad: quién hizo qué en el panel de administración.
import { ref, computed, onMounted, watch } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { toast } from '@/composables/useToast';
import { downloadCsv } from '@/lib/csv';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import '@/styles/pages/admin-extra.css';

const passport = usePassportStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const loading = ref(true);
const rows = ref([]);
const q = ref('');
const group = ref('all');

const LABEL = {
  'report.resolve': 'Resolved a stand report', 'report.reopen': 'Reopened a stand report', 'report.delete': 'Deleted a stand report',
  'user.hide': 'Hid a user from the community', 'user.show': 'Showed a user in the community', 'user.note': 'Edited a user note',
  'admin.grant': 'Gave admin access', 'admin.revoke': 'Removed admin access',
  'stamp.add': 'Added a passport stamp', 'stamp.remove': 'Removed a passport stamp',
  'announcement.create': 'Created an announcement', 'announcement.edit': 'Edited an announcement', 'announcement.delete': 'Deleted an announcement',
  'announcement.activate': 'Turned an announcement on', 'announcement.deactivate': 'Turned an announcement off',
  'news.create': 'Published/saved news', 'news.edit': 'Edited news', 'news.publish': 'Published news', 'news.unpublish': 'Hid news', 'news.delete': 'Deleted news',
  'forum.keep': 'Kept a forum item visible', 'forum.hide': 'Hid a forum item', 'forum.delete': 'Deleted a forum item',
  'contest.grade': 'Graded a contest entry',
};
const GROUPS = [
  { id: 'all', label: 'Everything' }, { id: 'report', label: 'Stand reports' }, { id: 'user', label: 'Users' },
  { id: 'admin', label: 'Admin access' }, { id: 'stamp', label: 'Stamps' }, { id: 'announcement', label: 'Announcements' },
  { id: 'news', label: 'News' }, { id: 'forum', label: 'Forum' }, { id: 'contest', label: 'Contests' },
];
const label = (a) => LABEL[a] || a;

async function load() {
  loading.value = true;
  try { rows.value = (await unwrap(insforge.database.rpc('admin_activity', { p_limit: 500, p_action: null }))) || []; }
  catch (e) { toast(/admin_activity/.test(e.message) ? 'Run the migration 20260930010000_admin-tools-2.sql in InsForge first.' : e.message, 'error'); }
  finally { loading.value = false; }
}
const shown = computed(() => rows.value.filter((r) => {
  if (group.value !== 'all' && !r.action.startsWith(`${group.value}.`)) return false;
  const s = q.value.trim().toLowerCase();
  return !s || `${r.admin_name} ${label(r.action)} ${JSON.stringify(r.details)}`.toLowerCase().includes(s);
}));
const detail = (d) => {
  const parts = [];
  if (d?.title) parts.push(d.title); if (d?.message) parts.push(d.message); if (d?.note) parts.push(`note: ${d.note}`);
  if (d?.place) parts.push(d.place); if (d?.stand) parts.push(d.stand); if (d?.who) parts.push(d.who);
  if (d?.score !== undefined) parts.push(`${d.score} pts`); if (d?.status) parts.push(d.status);
  return parts.join(' · ');
};
const fmt = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
function exportCsv() {
  downloadCsv('talapo-activity-log', shown.value, [
    { label: 'Date', value: (r) => new Date(r.created_at).toISOString() }, { label: 'Admin', key: 'admin_name' },
    { label: 'Action', value: (r) => label(r.action) }, { label: 'Type', key: 'target_type' }, { label: 'Target', key: 'target_id' },
    { label: 'Details', value: (r) => detail(r.details) },
  ]);
}
watch(group, () => {});
onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
        <h1>Activity log</h1>
        <p>Everything the administrators did, with who and when. Useful to review changes or find a mistake.</p>
      </div>
    </section>
    <div class="content">
      <p v-if="!passport.loaded" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
      <div v-else-if="!isAdmin" class="box"><h2><i class="fas fa-lock"></i> Admins only</h2></div>
      <template v-else>
        <AdminTabs />
        <div class="filters box">
          <select v-model="group" aria-label="Type of action"><option v-for="g in GROUPS" :key="g.id" :value="g.id">{{ g.label }}</option></select>
          <input v-model="q" type="search" placeholder="Search admin or detail…" />
          <button class="btn-s alt" :disabled="!shown.length" @click="exportCsv"><i class="fas fa-file-csv"></i> Export CSV</button>
        </div>
        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
        <p v-else-if="!shown.length" class="note">No activity yet. Actions you take in the admin panel will appear here.</p>
        <ul v-else class="list">
          <li v-for="r in shown" :key="r.id" class="row">
            <div class="line"><b>{{ r.admin_name || 'An admin' }}</b> <span>{{ label(r.action).toLowerCase() }}</span></div>
            <small v-if="detail(r.details)" class="det">{{ detail(r.details) }}</small>
            <small class="when">{{ fmt(r.created_at) }}</small>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
.line { color: #0A2F44; } .line b { color: #1C6E6B; }
.det { display: block; color: #58717f; margin-top: .15rem; overflow-wrap: anywhere; }
.when { display: block; color: #8aa0ab; margin-top: .15rem; }
</style>
