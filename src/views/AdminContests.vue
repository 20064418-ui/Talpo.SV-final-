<script setup>
// Panel de concursos: calificar participaciones (puntos, estado, comentario) y ver el Ranking Talapo.
import { ref, reactive, computed, onMounted } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { challenges } from '@/data/contests';
import { toast } from '@/composables/useToast';
import AdminTabs from '@/components/admin/AdminTabs.vue';

const passport = usePassportStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const loading = ref(true);
const entries = ref([]);
const ranking = ref([]);
const f = reactive({ challenge: 'all', status: 'all', q: '' });
const saving = ref({});
const edits = reactive({});   // cambios sin guardar por id

const STATUS = [
  { id: 'registered', label: 'Registered', color: '#EEF6F6', text: '#1C6E6B' },
  { id: 'submitted', label: 'Submitted', color: '#e8eefc', text: '#1e3a8a' },
  { id: 'reviewed', label: 'Reviewed', color: '#fff1c2', text: '#8a5a00' },
  { id: 'winner', label: '🏆 Winner', color: '#d9f2e3', text: '#166534' },
];
const ch = (slug) => challenges.find((c) => c.slug === slug) || { emoji: '🏆', title: slug };

async function load() {
  loading.value = true;
  try {
    const [e, r] = await Promise.all([
      unwrap(insforge.database.from('contest_entries').select('*').order('created_at', { ascending: false }).limit(1000)),
      unwrap(insforge.database.from('ranking_talapo').select('*').limit(10)),
    ]);
    entries.value = e; ranking.value = r;
    e.forEach((x) => { edits[x.id] = { score: x.score, status: x.status, review_note: x.review_note || '' }; });
  } catch (err) { toast(err.message, 'error'); }
  finally { loading.value = false; }
}

const shown = computed(() => entries.value.filter((x) =>
  (f.challenge === 'all' || x.challenge === f.challenge)
  && (f.status === 'all' || x.status === f.status)
  && (!f.q || `${x.participant_name} ${x.institution} ${x.grade}`.toLowerCase().includes(f.q.toLowerCase()))));
const dirty = (x) => { const d = edits[x.id]; return d && (Number(d.score) !== x.score || d.status !== x.status || (d.review_note || '') !== (x.review_note || '')); };
const toReview = computed(() => entries.value.filter((x) => x.status === 'submitted').length);

async function save(x) {
  const d = edits[x.id];
  const score = Math.max(0, Math.min(1000, Math.round(Number(d.score) || 0)));
  saving.value = { ...saving.value, [x.id]: true };
  try {
    const rows = await unwrap(insforge.database.from('contest_entries')
      .update({ score, status: d.status, review_note: d.review_note.trim() || null }).eq('id', x.id).select());
    Object.assign(x, rows[0]); d.score = x.score;
    toast(`Saved: ${x.participant_name} · ${x.score} pts`);
    ranking.value = await unwrap(insforge.database.from('ranking_talapo').select('*').limit(10));
  } catch (e) { toast(e.message, 'error'); }
  finally { saving.value = { ...saving.value, [x.id]: false }; }
}
const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
        <h1>Talapo Admin</h1>
        <p>Grade the contest entries sent to avisos.talapo@gmail.com. The Ranking Talapo updates automatically.</p>
      </div>
    </section>
    <div class="content">
      <p v-if="!passport.loaded" class="note">Loading…</p>
      <div v-else-if="!isAdmin" class="box"><h2>🔒 Admins only</h2></div>
      <template v-else>
        <AdminTabs :counts="{ contests: toReview }" />
        <div class="layout">
          <div>
            <div class="filters box">
              <select v-model="f.challenge" aria-label="Challenge">
                <option value="all">All challenges</option>
                <option v-for="c in challenges" :key="c.slug" :value="c.slug">{{ c.emoji }} {{ c.title }}</option>
              </select>
              <select v-model="f.status" aria-label="Status">
                <option value="all">All statuses</option>
                <option v-for="s in STATUS" :key="s.id" :value="s.id">{{ s.label }}</option>
              </select>
              <input v-model="f.q" type="search" placeholder="Search name, school, grade…" />
            </div>
            <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading entries…</p>
            <p v-else-if="!shown.length" class="note">No entries match.</p>
            <TransitionGroup v-else name="ph" tag="ul" class="list">
              <li v-for="x in shown" :key="x.id" class="entry" :class="{ dirty: dirty(x) }">
                <div class="who">
                  <span class="emoji">{{ ch(x.challenge).emoji }}</span>
                  <div>
                    <b>{{ x.participant_name }}</b>
                    <small>{{ ch(x.challenge).title }} · {{ x.institution }} · {{ x.grade }} · {{ fmt(x.created_at) }}</small>
                  </div>
                </div>
                <div class="grade">
                  <label>Points <input v-model.number="edits[x.id].score" type="number" min="0" max="1000" step="5" /></label>
                  <label>Status
                    <select v-model="edits[x.id].status">
                      <option v-for="s in STATUS" :key="s.id" :value="s.id">{{ s.label }}</option>
                    </select>
                  </label>
                  <label class="note-in">Jury note <input v-model="edits[x.id].review_note" maxlength="500" placeholder="Optional comment for the team" /></label>
                  <button class="save" :disabled="!dirty(x) || saving[x.id]" @click="save(x)">{{ saving[x.id] ? 'Saving…' : dirty(x) ? 'Save' : 'Saved ✓' }}</button>
                </div>
              </li>
            </TransitionGroup>
          </div>
          <aside class="box rank">
            <h2>🏆 Ranking Talapo</h2>
            <ol v-if="ranking.length">
              <li v-for="(r, i) in ranking" :key="r.participant_name">
                <span class="pos" :class="`p${i + 1}`">{{ i + 1 }}</span>
                <span class="nm"><b>{{ r.participant_name }}</b><small>{{ r.institution }}</small></span>
                <span class="pts">{{ r.total_score }}</span>
              </li>
            </ol>
            <p v-else class="note">No points yet.</p>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.admin { font-family: 'Outfit', 'Inter', sans-serif; background: #F8FBFE; min-height: 100vh; }
.hero { background: linear-gradient(rgba(10,47,68,.72), rgba(10,47,68,.85)), url('/assets/img/stand/parksantaana.jpg') center/cover; color: #fff; padding: clamp(2.5rem, 5vw, 4rem) 5%; }
.hero-inner { max-width: 1200px; margin: 0 auto; }
.hero-badge { display: inline-block; background: #0A2F44; font-size: .75rem; font-weight: 700; letter-spacing: 1px; padding: .4rem 1rem; border-radius: 40px; margin-bottom: 1rem; }
.hero h1 { font-size: clamp(2.2rem, 5vw, 3.2rem); font-weight: 800; text-transform: uppercase; margin: 0 0 .4rem; }
.hero p { margin: 0; opacity: .9; max-width: 62ch; }
.content { max-width: 1200px; margin: 0 auto; padding: 2rem 5% 4rem; }
.note { color: #58717f; }
.box { background: #fff; border-radius: 20px; padding: 1rem 1.2rem; box-shadow: 0 16px 28px -22px rgba(0,32,64,.35); }
.layout { display: grid; grid-template-columns: 1fr 300px; gap: 1.2rem; align-items: start; }
.filters { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1rem; }
.filters select, .filters input { font: inherit; padding: .55rem .8rem; border: 1.5px solid #dce7ea; border-radius: 12px; background: #fff; }
.filters input { flex: 1; min-width: 180px; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: .7rem; }
.entry { background: #fff; border-radius: 18px; padding: .9rem 1rem; box-shadow: 0 14px 26px -22px rgba(0,32,64,.35); border-left: 5px solid #dce7ea; transition: border-color .2s; }
.entry.dirty { border-left-color: #E46D5C; }
.who { display: flex; gap: .7rem; align-items: center; margin-bottom: .6rem; }
.who .emoji { font-size: 1.6rem; }
.who b { color: #0A2F44; }
.who small { display: block; color: #58717f; }
.grade { display: grid; grid-template-columns: 110px 150px 1fr auto; gap: .6rem; align-items: end; }
.grade label { display: grid; gap: .2rem; font-size: .78rem; font-weight: 700; color: #58717f; }
.grade input, .grade select { font: inherit; font-size: .95rem; padding: .45rem .6rem; border: 1.5px solid #dce7ea; border-radius: 10px; background: #fff; color: #0A2F44; }
.save { border: 0; border-radius: 30px; padding: .55rem 1.1rem; font: inherit; font-weight: 800; background: #E46D5C; color: #fff; cursor: pointer; }
.save:disabled { background: #EEF6F6; color: #1C6E6B; cursor: default; }
.rank { position: sticky; top: 96px; }
.rank h2 { margin: 0 0 .6rem; color: #0A2F44; font-size: 1.2rem; }
.rank ol { list-style: none; margin: 0; padding: 0; display: grid; gap: .45rem; }
.rank li { display: flex; align-items: center; gap: .6rem; }
.pos { width: 28px; height: 28px; border-radius: 50%; background: #EEF6F6; color: #1C6E6B; display: grid; place-items: center; font-weight: 800; flex-shrink: 0; }
.pos.p1 { background: #f2c94c; color: #5c4210; } .pos.p2 { background: #d8dee4; color: #334155; } .pos.p3 { background: #e8b38a; color: #5c3310; }
.nm { flex: 1; min-width: 0; } .nm small { display: block; color: #8aa0ab; }
.pts { font-weight: 800; color: #0A2F44; }
.ph-enter-active, .ph-leave-active { transition: all .25s ease; }
.ph-enter-from, .ph-leave-to { opacity: 0; transform: translateY(8px); }
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .rank { position: static; } .grade { grid-template-columns: 1fr 1fr; } .note-in { grid-column: 1 / -1; } }
</style>
