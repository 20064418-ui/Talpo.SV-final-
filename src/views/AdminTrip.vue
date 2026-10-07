<script setup>
// Armar el itinerario día por día para una solicitud de pase (opción B).
// Borrador = solo lo ve el admin. "Send to client" = aparece en My trips → From Talapo.
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { toast } from '@/composables/useToast';
import { logAdmin } from '@/composables/useAdminLog';
import { KINDS, kindOf, dayDate } from '@/data/tripKinds';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import '@/styles/pages/admin-extra.css';

const route = useRoute();
const router = useRouter();
const passport = usePassportStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const loading = ref(true);
const missing = ref(false);
const saving = ref(false);
const dirty = ref(false);
const req = ref(null);          // la solicitud de pase
const tripId = ref(null);
const status = ref('draft');
const sentAt = ref(null);
const trip = reactive({ title: '', summary: '', start_date: '', travelers: 1, includedText: '', days: [] });

const blankItem = (kind = 'activity') => ({ time: '', kind, title: '', place: '', notes: '' });
const blankDay = () => ({ title: '', items: [blankItem()] });
const who = computed(() => req.value?.display_name || (req.value?.username ? '@' + req.value.username : 'Traveler'));

async function load() {
  loading.value = true;
  try {
    const all = await unwrap(insforge.database.rpc('admin_plan_requests', { p_limit: 2000 }));
    req.value = (all || []).find((r) => r.id === route.params.request) || null;
    if (!req.value) { toast('Request not found', 'error'); router.replace('/admin/plans'); return; }
    const rows = await unwrap(insforge.database.from('trip_plans').select('*').eq('plan_request_id', req.value.id).limit(1));
    const t = rows?.[0];
    if (t) {
      tripId.value = t.id; status.value = t.status; sentAt.value = t.sent_at;
      Object.assign(trip, { title: t.title, summary: t.summary || '', start_date: t.start_date || '', travelers: t.travelers, includedText: (t.included || []).join('\n'), days: t.days?.length ? t.days : [blankDay()] });
    } else {
      // Borrador nuevo con lo que el cliente pidió
      Object.assign(trip, {
        title: `${req.value.plan_name} · ${who.value}`,
        summary: `Hi ${who.value.replace('@', '')}! Here is your personalized trip in El Salvador. Any change you want, just write us in Messages.`,
        start_date: req.value.trip_date || '', travelers: req.value.travelers || 1,
        includedText: '', days: [blankDay(), blankDay(), blankDay()],
      });
      // Beneficios del plan como punto de partida para "Included"
      const p = await unwrap(insforge.database.from('travel_plans').select('features').eq('id', req.value.plan_id).limit(1)).catch(() => []);
      trip.includedText = (p?.[0]?.features || []).join('\n');
    }
    missing.value = false;
  } catch (e) {
    if (/trip_plans|does not exist|relation/i.test(e.message)) missing.value = true; else toast(e.message, 'error');
  } finally { loading.value = false; dirty.value = false; }
}

/* ---------- edición ---------- */
const touch = () => { dirty.value = true; };
function addDay() { trip.days.push(blankDay()); touch(); }
function removeDay(i) { if (confirm(`Delete day ${i + 1}?`)) { trip.days.splice(i, 1); touch(); } }
function dupDay(i) { trip.days.splice(i + 1, 0, JSON.parse(JSON.stringify(trip.days[i]))); touch(); }
function addItem(d, kind) { d.items.push(blankItem(kind)); touch(); }
function removeItem(d, j) { d.items.splice(j, 1); touch(); }
function move(list, i, dir) { const j = i + dir; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; touch(); }
function sortByTime(d) { d.items.sort((a, b) => (a.time || '99').localeCompare(b.time || '99')); touch(); }

function payload(nextStatus) {
  const days = trip.days.map((d) => ({
    title: d.title.trim(),
    items: d.items.filter((it) => it.title.trim()).map((it) => ({ time: it.time, kind: it.kind, title: it.title.trim(), place: it.place.trim(), notes: it.notes.trim() })),
  })).filter((d) => d.title || d.items.length);
  return {
    plan_request_id: req.value.id, profile_id: req.value.profile_id,
    title: trip.title.trim() || req.value.plan_name, summary: trip.summary.trim() || null,
    start_date: trip.start_date || null, travelers: Math.max(1, +trip.travelers || 1),
    included: trip.includedText.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 20),
    days, status: nextStatus,
  };
}

async function save(nextStatus = status.value) {
  const row = payload(nextStatus);
  if (!row.days.length) { toast('Add at least one day with an activity', 'error'); return false; }
  saving.value = true;
  try {
    if (tripId.value) await unwrap(insforge.database.from('trip_plans').update(row).eq('id', tripId.value));
    else tripId.value = (await unwrap(insforge.database.from('trip_plans').insert([row]).select()))[0].id;
    const wasSent = status.value === 'sent';
    status.value = nextStatus; dirty.value = false;
    if (nextStatus === 'sent') sentAt.value = sentAt.value || new Date().toISOString();
    logAdmin(nextStatus === 'sent' ? (wasSent ? 'trip.update' : 'trip.send') : 'trip.save', 'trip', tripId.value, { title: row.title });
    return true;
  } catch (e) { toast(e.message, 'error'); return false; }
  finally { saving.value = false; }
}

/** Avisa al cliente en Messages (crea la conversación de la solicitud si no existe) */
async function notify(text) {
  try {
    const found = await unwrap(insforge.database.from('support_threads').select('id').eq('plan_request_id', req.value.id).limit(1));
    let id = found?.[0]?.id;
    if (!id) id = (await unwrap(insforge.database.from('support_threads').insert([{ profile_id: req.value.profile_id, subject: `Your ${req.value.plan_name} trip`, topic: 'plans', plan_request_id: req.value.id }]).select()))[0].id;
    await unwrap(insforge.database.from('support_messages').insert([{ thread_id: id, body: text }]));
  } catch { /* si no hay mensajes (migración), el itinerario igual queda enviado */ }
}

async function sendToClient() {
  const first = status.value !== 'sent';
  if (first && !confirm(`Send this itinerary to ${who.value}? They will see it in My trips.`)) return;
  if (!(await save('sent'))) return;
  if (req.value.status === 'new' || req.value.status === 'contacted') {
    await insforge.database.from('plan_requests').update({ status: 'confirmed' }).eq('id', req.value.id).then(() => { req.value.status = 'confirmed'; }, () => {});
  }
  await notify(first
    ? `Your itinerary "${trip.title}" is ready! 🎉 Open My trips → From Talapo to see it day by day. Tell us here if you want to change anything.`
    : `We updated your itinerary "${trip.title}". Open My trips → From Talapo to see the changes.`);
  toast(first ? 'Sent! The client was notified in Messages.' : 'Updated and client notified.');
}
async function unsend() {
  if (!confirm('Hide this itinerary from the client again (back to draft)?')) return;
  if (await save('draft')) toast('Back to draft — the client no longer sees it');
}
async function removeTrip() {
  if (!tripId.value || !confirm('Delete this itinerary completely?')) return;
  try {
    await unwrap(insforge.database.from('trip_plans').delete().eq('id', tripId.value));
    logAdmin('trip.delete', 'trip', tripId.value, { title: trip.title });
    toast('Itinerary deleted'); router.push('/admin/plans');
  } catch (e) { toast(e.message, 'error'); }
}

// Aviso si se sale sin guardar
const beforeUnload = (e) => { if (dirty.value) { e.preventDefault(); e.returnValue = ''; } };
onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnload);
  await passport.load(true);
  if (isAdmin.value) load(); else loading.value = false;
});
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));
</script>

<template>
  <div class="tp admin" data-admin="plans">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
        <h1>Trip builder</h1>
        <p>Build the trip day by day. When it is ready, send it — the client sees it in My trips.</p>
      </div>
    </section>

    <div class="content">
      <p v-if="!passport.loaded" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
      <div v-else-if="!isAdmin" class="box"><h2><i class="fas fa-lock"></i> Admins only</h2></div>
      <template v-else>
        <AdminTabs />
        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
        <div v-else-if="missing" class="box">
          <h2><i class="fas fa-database"></i> One step first</h2>
          <p class="note">Run <b>migrations/20261006020000_trip-plans.sql</b> in the InsForge SQL Editor, then refresh.</p>
        </div>
        <template v-else-if="req">
          <RouterLink to="/admin/plans" class="backlink"><i class="fas fa-arrow-left"></i> Plans &amp; sales</RouterLink>

          <!-- Cliente -->
          <div class="box client">
            <div>
              <span class="chip" :class="status === 'sent' ? '' : 'medium'">{{ status === 'sent' ? 'Sent to client' : 'Draft — client cannot see it yet' }}</span>
              <h2>{{ who }} · {{ req.plan_name }}</h2>
              <p class="note">
                {{ req.travelers }} traveler{{ req.travelers > 1 ? 's' : '' }}
                <span v-if="req.trip_date"> · wants to travel {{ new Date(req.trip_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</span>
                <span v-if="req.phone"> · {{ req.phone }}</span>
              </p>
              <p v-if="req.notes" class="wish">“{{ req.notes }}”</p>
            </div>
          </div>

          <!-- Datos generales -->
          <div class="box form">
            <div class="grid3">
              <label class="f span2">Trip title<input v-model="trip.title" maxlength="100" @input="touch" /></label>
              <label class="f">Start date<input v-model="trip.start_date" type="date" @input="touch" /></label>
            </div>
            <label class="f">Message for the client (shown at the top)<textarea v-model="trip.summary" rows="2" maxlength="1500" @input="touch"></textarea></label>
            <label class="f">What is included (one per line)<textarea v-model="trip.includedText" rows="3" @input="touch" placeholder="Hotel 3 nights&#10;Private shuttle&#10;Certified guide"></textarea></label>
          </div>

          <!-- Días -->
          <div v-for="(d, i) in trip.days" :key="i" class="box day">
            <div class="day-head">
              <span class="num">Day {{ i + 1 }}</span>
              <small v-if="dayDate(trip.start_date, i)">{{ dayDate(trip.start_date, i) }}</small>
              <input v-model="d.title" class="day-title" maxlength="80" placeholder="e.g. Arrival & Ruta de las Flores" @input="touch" />
              <div class="day-acts">
                <button class="ic" title="Sort by time" @click="sortByTime(d)"><i class="fas fa-arrow-down-1-9"></i></button>
                <button class="ic" title="Duplicate day" @click="dupDay(i)"><i class="far fa-copy"></i></button>
                <button class="ic" :disabled="i === 0" title="Move up" @click="move(trip.days, i, -1)"><i class="fas fa-arrow-up"></i></button>
                <button class="ic" :disabled="i === trip.days.length - 1" title="Move down" @click="move(trip.days, i, 1)"><i class="fas fa-arrow-down"></i></button>
                <button class="ic danger" title="Delete day" @click="removeDay(i)"><i class="fas fa-trash"></i></button>
              </div>
            </div>

            <div v-for="(it, j) in d.items" :key="j" class="item" :style="{ '--k': kindOf(it.kind).color }">
              <input v-model="it.time" type="time" class="time" aria-label="Time" @input="touch" />
              <select v-model="it.kind" class="kind" aria-label="Type" @change="touch">
                <option v-for="k in KINDS" :key="k.id" :value="k.id">{{ k.emoji }} {{ k.label }}</option>
              </select>
              <input v-model="it.title" class="ttl" maxlength="100" placeholder="What (e.g. Hotel Santa Leticia check-in)" @input="touch" />
              <input v-model="it.place" class="plc" maxlength="100" placeholder="Where (for the map link)" @input="touch" />
              <input v-model="it.notes" class="nts" maxlength="300" placeholder="Notes for the client (optional)" @input="touch" />
              <div class="it-acts">
                <button class="ic" :disabled="j === 0" aria-label="Up" @click="move(d.items, j, -1)"><i class="fas fa-chevron-up"></i></button>
                <button class="ic" :disabled="j === d.items.length - 1" aria-label="Down" @click="move(d.items, j, 1)"><i class="fas fa-chevron-down"></i></button>
                <button class="ic danger" aria-label="Remove" @click="removeItem(d, j)"><i class="fas fa-xmark"></i></button>
              </div>
            </div>
            <div class="add-row">
              <span>Add:</span>
              <button v-for="k in KINDS" :key="k.id" class="add" @click="addItem(d, k.id)">{{ k.emoji }} {{ k.label }}</button>
            </div>
          </div>
          <button class="btn-s alt addday" @click="addDay"><i class="fas fa-plus"></i> Add day</button>

          <!-- Barra de acciones fija -->
          <div class="bar">
            <span class="state"><i class="fas" :class="dirty ? 'fa-circle-exclamation' : 'fa-circle-check'"></i> {{ dirty ? 'Unsaved changes' : (status === 'sent' ? 'Client sees this version' : 'Saved as draft') }}</span>
            <button class="btn-s alt" :disabled="saving" @click="save(status).then((ok) => ok && toast('Saved'))">Save</button>
            <button class="btn-s" :disabled="saving" @click="sendToClient"><i class="fas fa-paper-plane"></i> {{ status === 'sent' ? 'Update client' : 'Send to client' }}</button>
            <button v-if="status === 'sent'" class="btn-s alt" :disabled="saving" @click="unsend">Hide</button>
            <button v-if="tripId" class="btn-s danger" aria-label="Delete itinerary" @click="removeTrip"><i class="fas fa-trash"></i></button>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.backlink { display: inline-flex; gap: .4rem; align-items: center; color: #1C6E6B; font-weight: 700; text-decoration: none; margin-bottom: .8rem; }
.box { margin-bottom: 1rem; }
.client h2 { margin: .4rem 0 .2rem; }
.client .note { margin: 0; }
.wish { margin: .5rem 0 0; color: #33515f; font-style: italic; background: #f6f9fb; border-radius: 12px; padding: .5rem .8rem; }
.form { display: grid; gap: .8rem; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .8rem; } .span2 { grid-column: span 2; }
.f { display: grid; gap: .25rem; font-size: .78rem; font-weight: 700; color: #58717f; }
input, select, textarea { font: inherit; font-size: .92rem; font-weight: 400; padding: .5rem .7rem; border: 1.5px solid #dce7ea; border-radius: 10px; background: #fff; color: #0A2F44; min-height: 40px; min-width: 0; }
input:focus, select:focus, textarea:focus { outline: none; border-color: #1C6E6B; }
.day { border-top: 4px solid #1C6E6B; }
.day-head { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; margin-bottom: .7rem; }
.num { background: #0A2F44; color: #fff; font-weight: 800; border-radius: 20px; padding: .25rem .8rem; font-size: .85rem; }
.day-head small { color: #58717f; font-weight: 700; }
.day-title { flex: 1; min-width: 200px; font-weight: 700; }
.day-acts, .it-acts { display: flex; gap: .25rem; }
.ic { width: 34px; height: 34px; border-radius: 10px; border: 1px solid #dce7ea; background: #fff; color: #1C6E6B; cursor: pointer; display: grid; place-items: center; }
.ic:disabled { opacity: .35; cursor: default; } .ic.danger { color: #b4432f; }
.item { display: grid; grid-template-columns: 125px 150px 1.4fr 1fr auto; gap: .45rem; align-items: center; padding: .5rem .5rem .5rem .7rem; border-radius: 12px; background: #f8fbfc; border-left: 4px solid var(--k); margin-bottom: .45rem; }
.item .nts { grid-column: 3 / 5; }
.it-acts { grid-row: 1 / 3; grid-column: 5; flex-direction: column; }
.add-row { display: flex; flex-wrap: wrap; gap: .35rem; align-items: center; margin-top: .5rem; }
.add-row span { font-size: .8rem; font-weight: 700; color: #8aa0ab; }
.add { border: 1px dashed #b9cfd4; background: #fff; border-radius: 20px; padding: .3rem .7rem; font: inherit; font-size: .8rem; font-weight: 600; color: #1A3A4A; cursor: pointer; }
.add:hover { border-color: #1C6E6B; color: #1C6E6B; }
.addday { margin-bottom: 5rem; }
.bar { position: sticky; bottom: 12px; z-index: 5; display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; background: #0A2F44; color: #fff; padding: .6rem .8rem; border-radius: 18px; box-shadow: 0 18px 30px -12px rgba(0,32,64,.5); }
.bar .state { flex: 1; min-width: 160px; font-weight: 600; font-size: .9rem; }
@media (max-width: 900px) {
  .item { grid-template-columns: 125px 1fr auto; }
  .item .ttl, .item .plc, .item .nts { grid-column: 1 / 3; }
  .it-acts { grid-row: 1 / 5; grid-column: 3; }
  .grid3 { grid-template-columns: 1fr; } .span2 { grid-column: auto; }
}
</style>
