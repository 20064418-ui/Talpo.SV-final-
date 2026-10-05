<script setup>
// Panel general del administrador: números clave, lo que necesita atención, gráficas y accesos rápidos.
import { ref, computed, onMounted } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { stands } from '@/data/stands';
import { toast } from '@/composables/useToast';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import '@/styles/pages/admin-extra.css';

const passport = usePassportStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const loading = ref(true);
const s = ref(null);
const a = ref(null);          // estadísticas (migración 2)
const days = ref(30);

async function load() {
  loading.value = true;
  try {
    const data = await unwrap(insforge.database.rpc('admin_overview'));
    s.value = Array.isArray(data) ? data[0] : data;
  } catch (e) {
    toast(/admin_overview/.test(e.message) ? 'Run the migration 20260930000000_admin-tools.sql in InsForge first.' : e.message, 'error');
  } finally { loading.value = false; }
  loadAnalytics();
}
async function loadAnalytics() {
  try {
    const data = await unwrap(insforge.database.rpc('admin_analytics', { p_days: days.value }));
    a.value = Array.isArray(data) ? data[0] : data;
  } catch { a.value = null; /* la migración 2 aún no se ejecutó: se ocultan las gráficas */ }
}

const attention = computed(() => !s.value ? [] : [
  { n: s.value.reports_urgent, text: 'urgent stand reports', to: '/admin/reports', icon: 'fa-triangle-exclamation' },
  { n: s.value.reports_pending - s.value.reports_urgent, text: 'other stand reports to review', to: '/admin/reports', icon: 'fa-clipboard-list' },
  { n: s.value.forum_reports, text: 'forum reports to moderate', to: '/admin/forum', icon: 'fa-flag' },
  { n: s.value.contest_to_review, text: 'contest entries to grade', to: '/admin/contests', icon: 'fa-trophy' },
  { n: s.value.news_drafts, text: 'news drafts not published', to: '/admin/news', icon: 'fa-newspaper' },
].filter((x) => x.n > 0));

const cards = computed(() => !s.value ? [] : [
  { icon: 'fa-users', label: 'Registered users', value: s.value.users, sub: `+${s.value.users_7d} in the last 7 days`, to: '/admin/users' },
  { icon: 'fa-passport', label: 'Passports created', value: s.value.passports, sub: `${s.value.public_profiles} public profiles`, to: '/admin/users' },
  { icon: 'fa-bolt', label: 'Active today', value: s.value.active_today, sub: 'Users with activity today' },
  { icon: 'fa-stamp', label: 'Stamps collected', value: s.value.stamps, sub: 'Verified at a Talapo Stand' },
  { icon: 'fa-clipboard-list', label: 'Stand reports pending', value: s.value.reports_pending, sub: `${s.value.reports_urgent} urgent · ${s.value.reports} total`, to: '/admin/reports', alert: s.value.reports_urgent > 0 },
  { icon: 'fa-newspaper', label: 'News published', value: s.value.news_published, sub: `${s.value.news_drafts} draft(s)`, to: '/admin/news' },
  { icon: 'fa-comments', label: 'Forum reports pending', value: s.value.forum_reports, sub: `${s.value.forum_hidden} hidden · ${s.value.forum_posts} posts`, to: '/admin/forum', alert: s.value.forum_reports > 0 },
  { icon: 'fa-bullhorn', label: 'Live announcements', value: s.value.announcements ?? 0, sub: 'Shown at the top of the site', to: '/admin/announcements' },
]);

/* ---------- Gráficas simples (sin librerías) ---------- */
const W = 520, H = 120;
function bars(series) {
  const max = Math.max(1, ...series.map((x) => x.n));
  const bw = W / Math.max(series.length, 1);
  return series.map((x, i) => ({ x: i * bw + 1, w: Math.max(bw - 3, 1), h: Math.max((x.n / max) * (H - 18), x.n ? 3 : 1), n: x.n, d: x.d }));
}
const signupBars = computed(() => bars(a.value?.signups || []));
const reportBars = computed(() => bars(a.value?.reports || []));
const total = (arr) => (arr || []).reduce((t, x) => t + x.n, 0);

const ZONE = { clean: 'Clean', dirty: 'Dirty', very_dirty: 'Very dirty' };
const URG = { low: 'Low', medium: 'Medium', high: 'High' };
const TRASH = { plastic: 'Plastic', paper: 'Paper', glass: 'Glass', metal: 'Metal', organic: 'Organic', bulky: 'Bulky', other: 'Other' };
const dist = (obj, labels) => {
  const rows = Object.entries(obj || {}).map(([k, n]) => ({ k, label: labels[k] || k, n }));
  const max = Math.max(1, ...rows.map((r) => r.n));
  return rows.sort((x, y) => y.n - x.n).map((r) => ({ ...r, pct: (r.n / max) * 100 }));
};
const zoneRows = computed(() => dist(a.value?.zone, ZONE));
const urgRows = computed(() => dist(a.value?.urgency, URG));
const standRows = computed(() => {
  const rows = (a.value?.by_stand || []).map((r) => ({ label: stands[r.stand_id] ? `${stands[r.stand_id].name}, ${stands[r.stand_id].city}` : r.stand_id, n: r.n }));
  const max = Math.max(1, ...rows.map((r) => r.n));
  return rows.map((r) => ({ ...r, pct: (r.n / max) * 100 }));
});
const trashRows = computed(() => {
  const rows = (a.value?.trash || []).map((r) => ({ label: TRASH[r.type] || r.type, n: r.n }));
  const max = Math.max(1, ...rows.map((r) => r.n));
  return rows.map((r) => ({ ...r, pct: (r.n / max) * 100 }));
});
const shortDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
async function setDays(n) { days.value = n; await loadAnalytics(); }

onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
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
        <template v-else-if="s">
          <!-- Qué necesita atención -->
          <div class="box att">
            <h2><i class="fas fa-bell"></i> Needs your attention</h2>
            <p v-if="!attention.length" class="note ok"><i class="fas fa-circle-check"></i> You are all caught up.</p>
            <ul v-else>
              <li v-for="x in attention" :key="x.text">
                <RouterLink :to="x.to"><i class="fas" :class="x.icon"></i><b>{{ x.n }}</b> {{ x.text }} <i class="fas fa-arrow-right go"></i></RouterLink>
              </li>
            </ul>
          </div>

          <div class="grid">
            <component :is="c.to ? 'RouterLink' : 'div'" v-for="c in cards" :key="c.label" :to="c.to" class="stat box" :class="{ alert: c.alert, link: c.to }">
              <span class="ico"><i class="fas" :class="c.icon"></i></span>
              <span class="val">{{ c.value }}</span>
              <span class="lbl">{{ c.label }}</span>
              <small>{{ c.sub }}</small>
            </component>
          </div>

          <!-- Accesos rápidos -->
          <div class="quick">
            <RouterLink to="/admin/announcements" class="btn-s alt"><i class="fas fa-bullhorn"></i> New announcement</RouterLink>
            <RouterLink to="/admin/news" class="btn-s alt"><i class="fas fa-newspaper"></i> Write news</RouterLink>
            <RouterLink to="/admin/users" class="btn-s alt"><i class="fas fa-user-plus"></i> Find a user</RouterLink>
            <RouterLink to="/kiosk/parque-libertad" class="btn-s alt"><i class="fas fa-tablet-screen-button"></i> Open Talapo Stand</RouterLink>
          </div>

          <!-- Estadísticas -->
          <template v-if="a">
            <div class="range">
              <h2>Statistics</h2>
              <div class="seg"><button v-for="n in [7, 30, 90]" :key="n" :class="{ on: days === n }" @click="setDays(n)">{{ n }} days</button></div>
            </div>
            <div class="charts">
              <div class="box chart">
                <h3>New users <small>{{ total(a.signups) }} in {{ days }} days</small></h3>
                <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="New users per day">
                  <rect v-for="b in signupBars" :key="b.d" :x="b.x" :y="H - 16 - b.h" :width="b.w" :height="b.h" rx="2" class="bar"><title>{{ shortDate(b.d) }}: {{ b.n }}</title></rect>
                  <text x="0" :y="H - 2" class="ax">{{ shortDate(a.signups[0].d) }}</text>
                  <text :x="W" :y="H - 2" class="ax" text-anchor="end">{{ shortDate(a.signups[a.signups.length - 1].d) }}</text>
                </svg>
              </div>
              <div class="box chart">
                <h3>Stand reports <small>{{ total(a.reports) }} in {{ days }} days</small></h3>
                <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Stand reports per day">
                  <rect v-for="b in reportBars" :key="b.d" :x="b.x" :y="H - 16 - b.h" :width="b.w" :height="b.h" rx="2" class="bar alt"><title>{{ shortDate(b.d) }}: {{ b.n }}</title></rect>
                  <text x="0" :y="H - 2" class="ax">{{ shortDate(a.reports[0].d) }}</text>
                  <text :x="W" :y="H - 2" class="ax" text-anchor="end">{{ shortDate(a.reports[a.reports.length - 1].d) }}</text>
                </svg>
              </div>
            </div>

            <div class="charts three">
              <div class="box">
                <h3>Zone condition</h3>
                <p v-if="!zoneRows.length" class="note">No reports yet.</p>
                <div v-for="r in zoneRows" :key="r.k" class="hb"><span>{{ r.label }}</span><i><b :style="{ width: r.pct + '%' }"></b></i><em>{{ r.n }}</em></div>
                <h3 class="mt">Urgency</h3>
                <div v-for="r in urgRows" :key="r.k" class="hb"><span>{{ r.label }}</span><i><b :class="r.k" :style="{ width: r.pct + '%' }"></b></i><em>{{ r.n }}</em></div>
              </div>
              <div class="box">
                <h3>Reports by stand</h3>
                <p v-if="!standRows.length" class="note">No reports yet.</p>
                <div v-for="r in standRows" :key="r.label" class="hb"><span>{{ r.label }}</span><i><b :style="{ width: r.pct + '%' }"></b></i><em>{{ r.n }}</em></div>
                <h3 class="mt">Trash types reported</h3>
                <p v-if="!trashRows.length" class="note">None yet.</p>
                <div v-for="r in trashRows" :key="r.label" class="hb"><span>{{ r.label }}</span><i><b :style="{ width: r.pct + '%' }"></b></i><em>{{ r.n }}</em></div>
              </div>
              <div class="box">
                <h3>Top travelers</h3>
                <p v-if="!a.top_travelers.length" class="note">No travelers yet.</p>
                <ol class="top">
                  <li v-for="t in a.top_travelers" :key="t.username || t.name"><b>{{ t.username ? '@' + t.username : (t.name || 'Traveler') }}</b><span>{{ t.stamps }} stamps · {{ t.streak }} day streak</span></li>
                </ol>
              </div>
            </div>
          </template>
          <p v-else class="note tip"><i class="fas fa-circle-info"></i> To see the charts, run <b>20260930010000_admin-tools-2.sql</b> in the InsForge SQL Editor.</p>
        </template>
        <p v-else class="note">No data yet.</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.att { margin-bottom: 1rem; border-left: 5px solid #E46D5C; }
.att ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .3rem; }
.att a { display: flex; align-items: center; gap: .6rem; padding: .5rem .2rem; color: #0A2F44; text-decoration: none; min-height: 44px; }
.att a:hover { color: #1C6E6B; }
.att a > i:first-child { width: 22px; color: #E46D5C; text-align: center; } .att .go { margin-left: auto; opacity: .5; }
.ok { color: #166534; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.stat { display: grid; gap: .15rem; text-decoration: none; color: #0A2F44; border-top: 4px solid #1C6E6B; transition: transform .2s, box-shadow .2s; }
.stat.link:hover { transform: translateY(-3px); box-shadow: 0 22px 32px -22px rgba(0,32,64,.45); }
.stat.alert { border-top-color: #E46D5C; }
.ico { width: 40px; height: 40px; border-radius: 12px; background: #EEF6F6; color: #1C6E6B; display: grid; place-items: center; font-size: 1.1rem; margin-bottom: .4rem; }
.alert .ico { background: #fdecea; color: #E46D5C; }
.val { font-size: 2.2rem; font-weight: 800; line-height: 1; }
.lbl { font-weight: 700; }
small { color: #58717f; }
.quick { display: flex; flex-wrap: wrap; gap: .6rem; margin: 1.2rem 0; }
.quick a { text-decoration: none; display: inline-flex; align-items: center; gap: .45rem; }
.range { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .6rem; margin: 1.6rem 0 .8rem; }
.range h2 { margin: 0; color: #0A2F44; }
.seg { display: flex; background: #fff; border: 1px solid #dce7ea; border-radius: 30px; padding: 3px; }
.seg button { border: 0; background: none; padding: .45rem .9rem; border-radius: 30px; font: inherit; font-weight: 700; color: #58717f; cursor: pointer; min-height: 36px; }
.seg button.on { background: #1C6E6B; color: #fff; }
.charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.charts.three { grid-template-columns: repeat(3, 1fr); }
.box h3 { margin: 0 0 .6rem; color: #0A2F44; font-size: 1rem; display: flex; justify-content: space-between; gap: .5rem; flex-wrap: wrap; }
.box h3 small { font-weight: 600; } .mt { margin-top: 1.1rem !important; }
.chart svg { width: 100%; height: auto; display: block; }
.bar { fill: #1C6E6B; } .bar.alt { fill: #E46D5C; } .ax { font-size: 10px; fill: #8aa0ab; }
.hb { display: grid; grid-template-columns: minmax(70px, 1.2fr) 2fr auto; gap: .5rem; align-items: center; margin: .35rem 0; font-size: .88rem; color: #0A2F44; }
.hb i { height: 9px; background: #EEF6F6; border-radius: 9px; overflow: hidden; display: block; }
.hb b { display: block; height: 100%; background: #1C6E6B; border-radius: 9px; } .hb b.high { background: #E46D5C; } .hb b.medium { background: #E2B13C; }
.hb em { font-style: normal; font-weight: 800; }
.top { margin: 0; padding-left: 1.2rem; display: grid; gap: .5rem; } .top li b { display: block; color: #0A2F44; } .top li span { color: #58717f; font-size: .85rem; }
.tip { margin-top: 1.2rem; }
@media (max-width: 1100px) { .grid { grid-template-columns: repeat(2, 1fr); } .charts.three { grid-template-columns: 1fr 1fr; } }
@media (max-width: 760px) { .charts, .charts.three { grid-template-columns: 1fr; } }
@media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
</style>
