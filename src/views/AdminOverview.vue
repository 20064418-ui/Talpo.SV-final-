<script setup>
// Panel general del administrador: números clave y accesos rápidos.
import { ref, computed, onMounted } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { toast } from '@/composables/useToast';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import '@/styles/pages/admin-extra.css';

const passport = usePassportStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const loading = ref(true);
const s = ref(null);

async function load() {
  loading.value = true;
  try {
    const data = await unwrap(insforge.database.rpc('admin_overview'));
    s.value = Array.isArray(data) ? data[0] : data;
  } catch (e) {
    toast(/admin_overview/.test(e.message) ? 'Run the migration 20260930000000_admin-tools.sql in InsForge first.' : e.message, 'error');
  } finally { loading.value = false; }
}

const cards = computed(() => !s.value ? [] : [
  { icon: 'fa-users', label: 'Registered users', value: s.value.users, sub: `+${s.value.users_7d} in the last 7 days`, to: '/admin/users' },
  { icon: 'fa-passport', label: 'Passports created', value: s.value.passports, sub: `${s.value.public_profiles} public profiles`, to: '/admin/users' },
  { icon: 'fa-bolt', label: 'Active today', value: s.value.active_today, sub: 'Users with activity today' },
  { icon: 'fa-stamp', label: 'Stamps collected', value: s.value.stamps, sub: 'Verified at a Talapo Stand' },
  { icon: 'fa-clipboard-list', label: 'Stand reports to review', value: s.value.reports_pending, sub: `${s.value.reports_urgent} urgent · ${s.value.reports} total`, to: '/admin/reports', alert: s.value.reports_urgent > 0 },
  { icon: 'fa-newspaper', label: 'News published', value: s.value.news_published, sub: `${s.value.news_drafts} draft(s)`, to: '/admin/news' },
  { icon: 'fa-comments', label: 'Forum reports pending', value: s.value.forum_reports, sub: `${s.value.forum_hidden} hidden item(s) · ${s.value.forum_posts} posts`, to: '/admin/forum', alert: s.value.forum_reports > 0 },
  { icon: 'fa-trophy', label: 'Contest entries to grade', value: s.value.contest_to_review, sub: `${s.value.contest_entries} total entries`, to: '/admin/contests', alert: s.value.contest_to_review > 0 },
]);

onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">TALAPO ADMIN</div>
        <h1>Overview</h1>
        <p>What is happening in Talapo right now, and what needs your attention.</p>
      </div>
    </section>

    <div class="content">
      <p v-if="!passport.loaded" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
      <div v-else-if="!isAdmin" class="box"><h2><i class="fas fa-lock"></i> Admins only</h2></div>
      <template v-else>
        <AdminTabs :counts="{ reports: s?.reports_pending, forum: s?.forum_reports, contests: s?.contest_to_review }" />
        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading numbers…</p>
        <div v-else-if="s" class="grid">
          <component :is="c.to ? 'RouterLink' : 'div'" v-for="c in cards" :key="c.label" :to="c.to" class="stat box" :class="{ alert: c.alert, link: c.to }">
            <span class="ico"><i class="fas" :class="c.icon"></i></span>
            <span class="val">{{ c.value }}</span>
            <span class="lbl">{{ c.label }}</span>
            <small>{{ c.sub }}</small>
          </component>
        </div>
        <p v-else class="note">No data yet.</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.stat { display: grid; gap: .15rem; text-decoration: none; color: #0A2F44; border-top: 4px solid #1C6E6B; transition: transform .2s, box-shadow .2s; }
.stat.link:hover { transform: translateY(-3px); box-shadow: 0 22px 32px -22px rgba(0,32,64,.45); }
.stat.alert { border-top-color: #E46D5C; }
.ico { width: 40px; height: 40px; border-radius: 12px; background: #EEF6F6; color: #1C6E6B; display: grid; place-items: center; font-size: 1.1rem; margin-bottom: .4rem; }
.alert .ico { background: #fdecea; color: #E46D5C; }
.val { font-size: 2.2rem; font-weight: 800; line-height: 1; }
.lbl { font-weight: 700; }
small { color: #58717f; }
@media (max-width: 1100px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
</style>
