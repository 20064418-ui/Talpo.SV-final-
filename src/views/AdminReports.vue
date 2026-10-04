<script setup>
// Reportes del formulario del Talapo Stand: revisar, marcar como resueltos, anotar y borrar.
import { ref, reactive, computed, onMounted } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { stands } from '@/data/stands';
import { toast } from '@/composables/useToast';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import '@/styles/pages/admin-extra.css';

const passport = usePassportStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const loading = ref(true);
const reports = ref([]);
const notes = reactive({});
const busy = reactive({});
const f = reactive({ status: 'pending', urgency: 'all', stand: 'all', q: '' });

const ZONE = { clean: 'Clean', dirty: 'Dirty', very_dirty: 'Very dirty' };
const URG = { low: 'Low', medium: 'Medium', high: 'High' };
const TRASH = { plastic: 'Plastic', paper: 'Paper', glass: 'Glass', metal: 'Metal', organic: 'Organic', bulky: 'Bulky', other: 'Other' };

async function load() {
  loading.value = true;
  try {
    const data = await unwrap(insforge.database.rpc('admin_stand_reports', { p_limit: 500 }));
    reports.value = data || [];
    reports.value.forEach((r) => { notes[r.id] = r.admin_note || ''; });
  } catch (e) {
    toast(/admin_stand_reports/.test(e.message) ? 'Run the migration 20260930000000_admin-tools.sql in InsForge first.' : e.message, 'error');
  } finally { loading.value = false; }
}

const pending = computed(() => reports.value.filter((r) => !r.resolved).length);
const shown = computed(() => reports.value.filter((r) => {
  if (f.status === 'pending' && r.resolved) return false;
  if (f.status === 'resolved' && !r.resolved) return false;
  if (f.urgency !== 'all' && r.urgency !== f.urgency) return false;
  if (f.stand !== 'all' && r.stand_id !== f.stand) return false;
  const q = f.q.trim().toLowerCase();
  return !q || [r.comment, r.username, r.display_name, r.passport_number].some((v) => (v || '').toLowerCase().includes(q));
}).sort((a, b) => (a.resolved - b.resolved) || (['high', 'medium', 'low'].indexOf(a.urgency) - ['high', 'medium', 'low'].indexOf(b.urgency)) || (new Date(b.created_at) - new Date(a.created_at))));

async function setResolved(r, value) {
  busy[r.id] = true;
  try {
    await unwrap(insforge.database.rpc('admin_resolve_report', { p_id: r.id, p_resolved: value, p_note: notes[r.id] || null }));
    r.resolved = value; r.admin_note = notes[r.id] || null; r.resolved_at = value ? new Date().toISOString() : null;
    toast(value ? 'Marked as resolved' : 'Reopened');
  } catch (e) { toast(e.message, 'error'); }
  finally { busy[r.id] = false; }
}
async function remove(r) {
  if (!confirm('Delete this report permanently?')) return;
  busy[r.id] = true;
  try {
    await unwrap(insforge.database.rpc('admin_delete_report', { p_id: r.id }));
    reports.value = reports.value.filter((x) => x.id !== r.id);
    toast('Deleted');
  } catch (e) { toast(e.message, 'error'); busy[r.id] = false; }
}

const fmt = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const standName = (id) => { const s = stands[id]; return s ? `${s.name}, ${s.city}` : id; };
onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">TALAPO ADMIN</div>
        <h1>Stand reports</h1>
        <p>Zone status reports sent from the Talapo Stands. Urgent ones appear first.</p>
      </div>
    </section>

    <div class="content">
      <p v-if="!passport.loaded" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
      <div v-else-if="!isAdmin" class="box"><h2><i class="fas fa-lock"></i> Admins only</h2></div>
      <template v-else>
        <AdminTabs :counts="{ reports: pending }" />
        <div class="filters box">
          <select v-model="f.status" aria-label="Status">
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
          <select v-model="f.urgency" aria-label="Urgency">
            <option value="all">Any urgency</option>
            <option v-for="(l, k) in URG" :key="k" :value="k">{{ l }}</option>
          </select>
          <select v-model="f.stand" aria-label="Stand">
            <option value="all">All stands</option>
            <option v-for="s in Object.values(stands)" :key="s.id" :value="s.id">{{ s.name }}, {{ s.city }}</option>
          </select>
          <input v-model="f.q" type="search" placeholder="Search comment, user, passport…" />
        </div>

        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading reports…</p>
        <p v-else-if="!shown.length" class="note">No reports match.</p>
        <ul v-else class="list">
          <li v-for="r in shown" :key="r.id" class="row" :class="[r.resolved ? 'done' : r.urgency]">
            <div class="top">
              <span class="chip" :class="r.urgency">Urgency: {{ URG[r.urgency] }}</span>
              <span class="chip">{{ ZONE[r.zone_status] || r.zone_status }}</span>
              <span v-for="t in r.trash_types" :key="t" class="chip"><i class="fas fa-trash-can"></i> {{ TRASH[t] || t }}</span>
              <span v-if="r.resolved" class="chip"><i class="fas fa-check"></i> Resolved</span>
              <small class="when">{{ standName(r.stand_id) }} · {{ fmt(r.created_at) }}</small>
            </div>
            <p v-if="r.comment" class="comment">{{ r.comment }}</p>
            <p v-else class="comment muted">No comment.</p>
            <small class="by">
              <template v-if="r.username || r.display_name">Sent by <b>{{ r.username ? '@' + r.username : r.display_name }}</b><span v-if="r.passport_number"> · {{ r.passport_number }}</span></template>
              <template v-else>Anonymous report</template>
            </small>
            <div class="actions">
              <input v-model="notes[r.id]" maxlength="500" placeholder="Internal note (optional)" aria-label="Internal note" />
              <button v-if="!r.resolved" class="btn-s" :disabled="busy[r.id]" @click="setResolved(r, true)"><i class="fas fa-check"></i> Resolve</button>
              <button v-else class="btn-s alt" :disabled="busy[r.id]" @click="setResolved(r, false)">Reopen</button>
              <button class="btn-s danger" :disabled="busy[r.id]" aria-label="Delete report" @click="remove(r)"><i class="fas fa-trash"></i></button>
            </div>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
.top { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
.when { margin-left: auto; color: #58717f; }
.comment { margin: .6rem 0 .3rem; color: #0A2F44; }
.muted { color: #8aa0ab; }
.by { color: #58717f; display: block; margin-bottom: .6rem; }
.actions { display: flex; flex-wrap: wrap; gap: .5rem; }
.actions input { flex: 1; min-width: 220px; font: inherit; padding: .5rem .8rem; border: 1.5px solid #dce7ea; border-radius: 12px; min-height: 40px; }
@media (max-width: 700px) { .when { margin-left: 0; width: 100%; } }
</style>
