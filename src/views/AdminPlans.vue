<script setup>
// Planes (Travel Passes) y solicitudes de compra: editar precios/beneficios y dar seguimiento a cada venta.
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { toast } from '@/composables/useToast';
import { logAdmin } from '@/composables/useAdminLog';
import { downloadCsv } from '@/lib/csv';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import '@/styles/pages/admin-extra.css';

const router = useRouter();
const passport = usePassportStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const view = ref('requests');
const loading = ref(true);
const missing = ref(false);
const requests = ref([]);
const plans = ref([]);
const coupons = ref([]);
const trips = ref({});        // itinerario armado por solicitud: { [request_id]: 'draft' | 'sent' }
const couponsMissing = ref(false);

const STATUSES = [
  { id: 'new', label: 'New', cls: 'high' },
  { id: 'contacted', label: 'Contacted', cls: 'medium' },
  { id: 'confirmed', label: 'Confirmed', cls: '' },
  { id: 'paid', label: 'Paid', cls: '' },
  { id: 'cancelled', label: 'Cancelled', cls: 'medium' },
];
const TIERS = [{ id: 'bronce', label: 'Bronze' }, { id: 'plata', label: 'Silver' }, { id: 'oro', label: 'Gold' }];
const statusOf = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];
const money = (n) => { const v = Number(n || 0); return '$' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
const fmt = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
const fmtDay = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const total = (r) => Number(r.price || 0) * (r.travelers || 1);
const who = (r) => r.display_name || (r.username ? '@' + r.username : 'Traveler');
const wa = (phone) => { const d = String(phone || '').replace(/\D/g, ''); return d ? `https://wa.me/${d.length === 8 ? '503' + d : d}` : null; };

async function load() {
  loading.value = true;
  try {
    const [reqs, pls] = await Promise.all([
      unwrap(insforge.database.rpc('admin_plan_requests', { p_limit: 1000 })),
      unwrap(insforge.database.from('travel_plans').select('*').order('sort', { ascending: true })),
    ]);
    requests.value = (reqs || []).map((r) => ({ ...r, _note: r.admin_note || '' }));
    plans.value = pls || [];
    missing.value = false;
    loadCoupons();
    insforge.database.from('trip_plans').select('plan_request_id, status').then(({ data }) => {
      trips.value = Object.fromEntries((data || []).map((t) => [t.plan_request_id, t.status]));
    }, () => {});
  } catch (e) {
    if (/plan_requests|travel_plans|does not exist|relation|function/i.test(e.message)) missing.value = true;
    else toast(e.message, 'error');
  } finally { loading.value = false; }
}

/* ---------- Resumen ---------- */
const summary = computed(() => {
  const r = requests.value;
  const paid = r.filter((x) => x.status === 'paid');
  const open = r.filter((x) => ['contacted', 'confirmed'].includes(x.status));
  const closed = r.filter((x) => x.status !== 'new');
  return {
    fresh: r.filter((x) => x.status === 'new').length,
    open: open.length,
    pipeline: open.reduce((t, x) => t + total(x), 0),
    revenue: paid.reduce((t, x) => t + total(x), 0),
    paid: paid.length,
    conversion: closed.length ? Math.round((paid.length / closed.length) * 100) : 0,
  };
});
const byPlan = computed(() => {
  const m = {};
  requests.value.filter((r) => r.status === 'paid').forEach((r) => { m[r.plan_name] = (m[r.plan_name] || 0) + total(r); });
  const rows = Object.entries(m).map(([label, n]) => ({ label, n }));
  const max = Math.max(1, ...rows.map((x) => x.n));
  return rows.sort((a, b) => b.n - a.n).map((x) => ({ ...x, pct: (x.n / max) * 100 }));
});

/* ---------- Solicitudes ---------- */
const fStatus = ref('open');
const fPlan = ref('');
const q = ref('');
const filtered = computed(() => {
  const s = q.value.trim().toLowerCase();
  return requests.value.filter((r) => {
    if (fStatus.value === 'open' && !['new', 'contacted', 'confirmed'].includes(r.status)) return false;
    if (!['open', ''].includes(fStatus.value) && r.status !== fStatus.value) return false;
    if (fPlan.value && r.plan_id !== fPlan.value) return false;
    if (s && ![r.display_name, r.username, r.phone, r.notes, r.passport_number, r.plan_name].some((v) => String(v || '').toLowerCase().includes(s))) return false;
    return true;
  });
});

async function setStatus(r, status) {
  const prev = r.status;
  r.status = status;
  try {
    await unwrap(insforge.database.from('plan_requests').update({ status }).eq('id', r.id));
    logAdmin('plan_request.status', 'plan_request', r.id, { from: prev, to: status, plan: r.plan_name });
    toast(`Marked as ${statusOf(status).label.toLowerCase()}`);
  } catch (e) { r.status = prev; toast(e.message, 'error'); }
}
async function saveNote(r) {
  try {
    await unwrap(insforge.database.from('plan_requests').update({ admin_note: r._note.trim() || null }).eq('id', r.id));
    r.admin_note = r._note.trim() || null;
    logAdmin('plan_request.note', 'plan_request', r.id, { plan: r.plan_name });
    toast('Note saved');
  } catch (e) { toast(e.message, 'error'); }
}
async function removeReq(r) {
  if (!confirm(`Delete the request from ${who(r)}? This cannot be undone.`)) return;
  try {
    await unwrap(insforge.database.from('plan_requests').delete().eq('id', r.id));
    requests.value = requests.value.filter((x) => x.id !== r.id);
    logAdmin('plan_request.delete', 'plan_request', r.id, { plan: r.plan_name });
    toast('Deleted');
  } catch (e) { toast(e.message, 'error'); }
}
function exportCsv() {
  downloadCsv('talapo-pass-requests', filtered.value, [
    { label: 'Date', value: (r) => new Date(r.created_at).toLocaleString() },
    { label: 'Status', value: (r) => statusOf(r.status).label },
    { label: 'Plan', key: 'plan_name' },
    { label: 'List price', value: (r) => r.list_price ?? r.price },
    { label: 'Coupon', key: 'coupon_code' },
    { label: 'Discount %', key: 'discount_pct' },
    { label: 'Price', key: 'price' },
    { label: 'Travelers', key: 'travelers' },
    { label: 'Total', value: total },
    { label: 'Trip date', key: 'trip_date' },
    { label: 'Name', key: 'display_name' },
    { label: 'Username', key: 'username' },
    { label: 'Passport', key: 'passport_number' },
    { label: 'Phone', key: 'phone' },
    { label: 'Notes', key: 'notes' },
    { label: 'Admin note', key: 'admin_note' },
  ]);
}

/* ---------- Escribirle al usuario dentro de Talapo (sin WhatsApp) ---------- */
async function messageUser(r) {
  try {
    const found = await unwrap(insforge.database.from('support_threads').select('id').eq('plan_request_id', r.id).limit(1));
    let id = found?.[0]?.id;
    if (!id) {
      const rows = await unwrap(insforge.database.from('support_threads')
        .insert([{ profile_id: r.profile_id, subject: `Your ${r.plan_name} request`, topic: 'plans', plan_request_id: r.id }]).select());
      id = rows[0].id;
    }
    router.push({ path: '/admin/messages', query: { t: id } });
  } catch (e) {
    toast(/support_threads|does not exist/i.test(e.message) ? 'Run migration 20261006010000_messages-site-coupons.sql first.' : e.message, 'error');
  }
}

/* ---------- Cupones ---------- */
const cform = reactive({ code: '', percent: 10, plan_id: '', max_uses: '', expires_at: '', note: '' });
async function loadCoupons() {
  try {
    coupons.value = await unwrap(insforge.database.from('plan_coupons').select('*').order('created_at', { ascending: false }));
    couponsMissing.value = false;
  } catch { couponsMissing.value = true; }
}
const couponState = (c) => !c.active ? 'Off' : (c.expires_at && new Date(c.expires_at) < new Date()) ? 'Expired' : (c.max_uses && c.used >= c.max_uses) ? 'Used up' : 'Active';
async function addCoupon() {
  const code = cform.code.trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) { toast('Code: 3–24 letters, numbers, - or _', 'error'); return; }
  const pct = Math.round(Number(cform.percent));
  if (!(pct >= 1 && pct <= 100)) { toast('Discount must be 1–100 %', 'error'); return; }
  try {
    await unwrap(insforge.database.from('plan_coupons').insert([{
      code, percent: pct, plan_id: cform.plan_id || null,
      max_uses: cform.max_uses ? Math.max(1, parseInt(cform.max_uses, 10)) : null,
      expires_at: cform.expires_at ? new Date(`${cform.expires_at}T23:59:59`).toISOString() : null,
      note: cform.note.trim() || null,
    }]));
    logAdmin('coupon.create', 'coupon', code, { percent: pct });
    toast(`Coupon ${code} created`);
    Object.assign(cform, { code: '', percent: 10, plan_id: '', max_uses: '', expires_at: '', note: '' });
    loadCoupons();
  } catch (e) { toast(/duplicate|unique/i.test(e.message) ? 'That code already exists' : e.message, 'error'); }
}
async function toggleCoupon(c) {
  try {
    await unwrap(insforge.database.from('plan_coupons').update({ active: !c.active }).eq('code', c.code));
    c.active = !c.active;
    logAdmin(c.active ? 'coupon.on' : 'coupon.off', 'coupon', c.code);
  } catch (e) { toast(e.message, 'error'); }
}
async function removeCoupon(c) {
  if (!confirm(`Delete coupon ${c.code}?`)) return;
  try {
    await unwrap(insforge.database.from('plan_coupons').delete().eq('code', c.code));
    coupons.value = coupons.value.filter((x) => x.code !== c.code);
    logAdmin('coupon.delete', 'coupon', c.code);
  } catch (e) { toast(e.message, 'error'); }
}
function copyCode(c) { navigator.clipboard?.writeText(c.code).then(() => toast(`${c.code} copied`), () => {}); }

/* ---------- Editor de planes ---------- */
const emptyPlan = () => ({ id: '', tier: 'bronce', name: '', tagline: '', price: 0, period: '/ trip', featuresText: '', cta_label: '', featured: false, active: true, sort: plans.value.length + 1 });
const form = reactive(emptyPlan());
const editingId = ref(null);
const showForm = ref(false);
const saving = ref(false);
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

function newPlan() { editingId.value = null; Object.assign(form, emptyPlan()); showForm.value = true; }
function editPlan(p) {
  editingId.value = p.id;
  Object.assign(form, { ...p, tagline: p.tagline || '', cta_label: p.cta_label || '', featuresText: (p.features || []).join('\n') });
  showForm.value = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function savePlan() {
  const name = form.name.trim();
  if (name.length < 2) { toast('Write the plan name', 'error'); return; }
  const row = {
    tier: form.tier, name, tagline: form.tagline.trim() || null,
    price: Math.max(0, Number(form.price) || 0), period: form.period.trim() || '/ trip',
    features: form.featuresText.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 12),
    cta_label: form.cta_label.trim() || null, featured: form.featured, active: form.active, sort: Number(form.sort) || 0,
    updated_at: new Date().toISOString(),
  };
  saving.value = true;
  try {
    if (editingId.value) {
      await unwrap(insforge.database.from('travel_plans').update(row).eq('id', editingId.value));
      logAdmin('plan.edit', 'plan', editingId.value, { name, price: row.price });
    } else {
      const id = slug(form.id || name);
      if (id.length < 2) throw new Error('Invalid plan id');
      await unwrap(insforge.database.from('travel_plans').insert([{ id, ...row }]));
      logAdmin('plan.create', 'plan', id, { name, price: row.price });
    }
    // Solo un plan puede ser "Most popular"
    if (row.featured) {
      const others = plans.value.filter((p) => p.featured && p.id !== (editingId.value || slug(form.id || name)));
      await Promise.all(others.map((p) => insforge.database.from('travel_plans').update({ featured: false }).eq('id', p.id)));
    }
    toast('Plan saved — it is already updated on /planes');
    showForm.value = false; editingId.value = null;
    await load();
  } catch (e) { toast(/duplicate|unique/i.test(e.message) ? 'A plan with that id already exists' : e.message, 'error'); }
  finally { saving.value = false; }
}
async function togglePlan(p) {
  try {
    await unwrap(insforge.database.from('travel_plans').update({ active: !p.active }).eq('id', p.id));
    p.active = !p.active;
    logAdmin(p.active ? 'plan.show' : 'plan.hide', 'plan', p.id, { name: p.name });
    toast(p.active ? 'Plan visible on /planes' : 'Plan hidden');
  } catch (e) { toast(e.message, 'error'); }
}
async function move(p, dir) {
  const list = [...plans.value];
  const i = list.indexOf(p); const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  plans.value = list;
  try {
    await Promise.all(list.map((x, k) => insforge.database.from('travel_plans').update({ sort: k + 1 }).eq('id', x.id)));
    list.forEach((x, k) => { x.sort = k + 1; });
  } catch (e) { toast(e.message, 'error'); }
}
async function removePlan(p) {
  if (!confirm(`Delete the plan "${p.name}"? Its past requests are kept.`)) return;
  try {
    await unwrap(insforge.database.from('travel_plans').delete().eq('id', p.id));
    plans.value = plans.value.filter((x) => x.id !== p.id);
    logAdmin('plan.delete', 'plan', p.id, { name: p.name });
    toast('Plan deleted');
  } catch (e) { toast(e.message, 'error'); }
}

onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin" data-admin="plans">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
        <h1>Plans &amp; sales</h1>
        <p>Edit the Travel Passes shown on /planes and follow every request until it is paid.</p>
      </div>
    </section>

    <div class="content">
      <p v-if="!passport.loaded" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
      <div v-else-if="!isAdmin" class="box"><h2><i class="fas fa-lock"></i> Admins only</h2></div>
      <template v-else>
        <AdminTabs :counts="{ plans: summary.fresh }" />

        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
        <div v-else-if="missing" class="box">
          <h2><i class="fas fa-database"></i> One step first</h2>
          <p class="note">Run <b>migrations/20261006000000_plans-sales.sql</b> in the InsForge SQL Editor, then refresh this page.</p>
        </div>
        <template v-else>
          <!-- Resumen -->
          <div class="sum">
            <div class="box stat" :class="{ alert: summary.fresh }"><span class="val">{{ summary.fresh }}</span><span class="lbl">New requests</span><small>Waiting for a call</small></div>
            <div class="box stat"><span class="val">{{ summary.open }}</span><span class="lbl">In progress</span><small>{{ money(summary.pipeline) }} possible</small></div>
            <div class="box stat"><span class="val">{{ money(summary.revenue) }}</span><span class="lbl">Sold</span><small>{{ summary.paid }} paid pass(es)</small></div>
            <div class="box stat"><span class="val">{{ summary.conversion }}%</span><span class="lbl">Conversion</span><small>Paid / answered requests</small></div>
          </div>
          <div v-if="byPlan.length" class="box mb">
            <h2>Sales by plan</h2>
            <div v-for="r in byPlan" :key="r.label" class="hb"><span>{{ r.label }}</span><i><b :style="{ width: r.pct + '%' }"></b></i><em>{{ money(r.n) }}</em></div>
          </div>

          <div class="seg">
            <button :class="{ on: view === 'requests' }" @click="view = 'requests'"><i class="fas fa-inbox"></i> Requests</button>
            <button :class="{ on: view === 'plans' }" @click="view = 'plans'"><i class="fas fa-tags"></i> Edit plans</button>
            <button :class="{ on: view === 'coupons' }" @click="view = 'coupons'"><i class="fas fa-ticket"></i> Coupons</button>
          </div>

          <!-- SOLICITUDES -->
          <template v-if="view === 'requests'">
            <div class="filters">
              <select v-model="fStatus" aria-label="Status">
                <option value="open">Open (new, contacted, confirmed)</option>
                <option value="">All</option>
                <option v-for="s in STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
              </select>
              <select v-model="fPlan" aria-label="Plan">
                <option value="">All plans</option>
                <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <input v-model="q" type="search" placeholder="Search name, phone, passport, notes…" />
              <button class="btn-s alt" :disabled="!filtered.length" @click="exportCsv"><i class="fas fa-file-csv"></i> Export</button>
            </div>
            <p v-if="!filtered.length" class="note">No requests here.</p>
            <ul v-else class="list">
              <li v-for="r in filtered" :key="r.id" class="row" :class="r.status === 'new' ? 'high' : r.status === 'cancelled' || r.status === 'paid' ? 'done' : 'medium'">
                <div class="top">
                  <span class="chip" :class="statusOf(r.status).cls">{{ statusOf(r.status).label }}</span>
                  <b class="plan">{{ r.plan_name }}</b>
                  <span class="amt">{{ money(total(r)) }} <small>({{ r.travelers }} × {{ money(r.price) }})</small></span>
                  <span v-if="r.coupon_code" class="chip"><i class="fas fa-ticket"></i> {{ r.coupon_code }} −{{ r.discount_pct }}%</span>
                  <small class="when">{{ fmt(r.created_at) }}</small>
                </div>
                <div class="det">
                  <span><i class="fas fa-user"></i> {{ who(r) }}<small v-if="r.passport_number"> · {{ r.passport_number }}</small></span>
                  <span><i class="fas fa-calendar"></i> {{ fmtDay(r.trip_date) }}</span>
                  <span v-if="r.phone"><i class="fas fa-phone"></i> {{ r.phone }}</span>
                </div>
                <p v-if="r.notes" class="msg">“{{ r.notes }}”</p>
                <div class="note-row">
                  <input v-model="r._note" maxlength="600" placeholder="Internal note (only admins see it)" @keyup.enter="saveNote(r)" />
                  <button v-if="r._note !== (r.admin_note || '')" class="btn-s alt" @click="saveNote(r)">Save note</button>
                </div>
                <div class="btns">
                  <RouterLink class="btn-s trip" :class="trips[r.id]" :to="`/admin/trip/${r.id}`"><i class="fas fa-route"></i> {{ trips[r.id] === 'sent' ? 'Itinerary sent ✓' : trips[r.id] === 'draft' ? 'Itinerary (draft)' : 'Build itinerary' }}</RouterLink>
                  <button class="btn-s" @click="messageUser(r)"><i class="fas fa-comments"></i> Message</button>
                  <a v-if="wa(r.phone)" class="btn-s wa" :href="wa(r.phone)" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                  <select :value="r.status" class="st" aria-label="Change status" @change="setStatus(r, $event.target.value)">
                    <option v-for="s in STATUSES" :key="s.id" :value="s.id">{{ s.label }}</option>
                  </select>
                  <button class="btn-s danger" aria-label="Delete request" @click="removeReq(r)"><i class="fas fa-trash"></i></button>
                </div>
              </li>
            </ul>
          </template>

          <!-- CUPONES -->
          <template v-else-if="view === 'coupons'">
            <div v-if="couponsMissing" class="box"><p class="note">Run <b>migrations/20261006010000_messages-site-coupons.sql</b> in InsForge to use coupons.</p></div>
            <template v-else>
              <div class="box form">
                <h2>New coupon</h2>
                <div class="grid3">
                  <label class="f">Code<input v-model="cform.code" maxlength="24" placeholder="WELCOME10" style="text-transform: uppercase" /></label>
                  <label class="f">Discount %<input v-model.number="cform.percent" type="number" min="1" max="100" /></label>
                  <label class="f">Only for plan<select v-model="cform.plan_id"><option value="">All plans</option><option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }}</option></select></label>
                  <label class="f">Max uses (optional)<input v-model="cform.max_uses" type="number" min="1" placeholder="Unlimited" /></label>
                  <label class="f">Expires (optional)<input v-model="cform.expires_at" type="date" /></label>
                  <label class="f">Note (optional)<input v-model="cform.note" maxlength="120" placeholder="Instagram promo" /></label>
                </div>
                <div class="btns"><button class="btn-s" @click="addCoupon"><i class="fas fa-plus"></i> Create coupon</button></div>
              </div>
              <p v-if="!coupons.length" class="note">No coupons yet.</p>
              <ul v-else class="list">
                <li v-for="c in coupons" :key="c.code" class="row" :class="couponState(c) === 'Active' ? '' : 'done'">
                  <div class="top">
                    <button class="code" title="Copy" @click="copyCode(c)">{{ c.code }} <i class="far fa-copy"></i></button>
                    <b class="amt">−{{ c.percent }}%</b>
                    <span class="chip" :class="couponState(c) === 'Active' ? '' : 'medium'">{{ couponState(c) }}</span>
                    <small>{{ c.plan_id ? plans.find((p) => p.id === c.plan_id)?.name || c.plan_id : 'All plans' }} · used {{ c.used }}{{ c.max_uses ? ' / ' + c.max_uses : '' }}<span v-if="c.expires_at"> · until {{ new Date(c.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</span><span v-if="c.note"> · {{ c.note }}</span></small>
                  </div>
                  <div class="btns mt">
                    <button class="btn-s alt" @click="toggleCoupon(c)">{{ c.active ? 'Turn off' : 'Turn on' }}</button>
                    <button class="btn-s danger" aria-label="Delete coupon" @click="removeCoupon(c)"><i class="fas fa-trash"></i></button>
                  </div>
                </li>
              </ul>
            </template>
          </template>

          <!-- PLANES -->
          <template v-else>
            <div v-if="showForm" class="box form">
              <h2>{{ editingId ? 'Edit plan' : 'New plan' }}</h2>
              <div class="grid3">
                <label class="f">Name<input v-model="form.name" maxlength="60" placeholder="VIP Concierge" /></label>
                <label class="f">Medal<select v-model="form.tier"><option v-for="t in TIERS" :key="t.id" :value="t.id">{{ t.label }}</option></select></label>
                <label v-if="!editingId" class="f">Id (in the link)<input v-model="form.id" maxlength="40" :placeholder="slug(form.name) || 'vip'" /></label>
                <label class="f">Price (USD)<input v-model.number="form.price" type="number" min="0" step="1" /></label>
                <label class="f">Period<input v-model="form.period" maxlength="20" placeholder="/ trip" /></label>
                <label class="f">Button text<input v-model="form.cta_label" maxlength="40" placeholder="Choose VIP Concierge" /></label>
              </div>
              <label class="f">Short description<input v-model="form.tagline" maxlength="160" /></label>
              <label class="f">Benefits (one per line)<textarea v-model="form.featuresText" rows="5"></textarea></label>
              <div class="checks">
                <label class="chk"><input v-model="form.active" type="checkbox" /> Visible on /planes</label>
                <label class="chk"><input v-model="form.featured" type="checkbox" /> “Most popular” tag</label>
              </div>
              <div class="btns">
                <button class="btn-s" :disabled="saving" @click="savePlan">{{ saving ? 'Saving…' : 'Save plan' }}</button>
                <button class="btn-s alt" @click="showForm = false">Cancel</button>
              </div>
            </div>
            <button v-else class="btn-s mb new-plan" @click="newPlan"><i class="fas fa-plus"></i> New plan</button>

            <ul class="list">
              <li v-for="(p, i) in plans" :key="p.id" class="row" :class="p.active ? '' : 'done'">
                <div class="top">
                  <span class="chip" :class="p.tier === 'oro' ? 'medium' : ''">{{ TIERS.find((t) => t.id === p.tier)?.label }}</span>
                  <b class="plan">{{ p.name }}</b>
                  <span class="amt">{{ money(p.price) }} <small>{{ p.period }}</small></span>
                  <span v-if="p.featured" class="chip medium"><i class="fas fa-star"></i> Most popular</span>
                  <span v-if="!p.active" class="chip">Hidden</span>
                </div>
                <p class="msg small">{{ (p.features || []).length }} benefits · {{ requests.filter((r) => r.plan_id === p.id).length }} requests</p>
                <div class="btns">
                  <button class="btn-s alt" :disabled="i === 0" aria-label="Move up" @click="move(p, -1)"><i class="fas fa-arrow-up"></i></button>
                  <button class="btn-s alt" :disabled="i === plans.length - 1" aria-label="Move down" @click="move(p, 1)"><i class="fas fa-arrow-down"></i></button>
                  <button class="btn-s alt" @click="editPlan(p)">Edit</button>
                  <button class="btn-s alt" @click="togglePlan(p)">{{ p.active ? 'Hide' : 'Show' }}</button>
                  <button class="btn-s danger" aria-label="Delete plan" @click="removePlan(p)"><i class="fas fa-trash"></i></button>
                </div>
              </li>
            </ul>
            <p class="note tip"><i class="fas fa-circle-info"></i> Changes appear on <RouterLink to="/planes">/planes</RouterLink> right away.</p>
          </template>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sum { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; }
.stat { display: grid; gap: .15rem; border-top: 4px solid #1C6E6B; color: #0A2F44; }
.stat.alert { border-top-color: #E46D5C; }
.val { font-size: 2rem; font-weight: 800; line-height: 1.1; } .lbl { font-weight: 700; } small { color: #58717f; }
.mb { margin-bottom: 1rem; }
.hb { display: grid; grid-template-columns: minmax(90px, 1.2fr) 2fr auto; gap: .5rem; align-items: center; margin: .35rem 0; font-size: .9rem; color: #0A2F44; }
.hb i { height: 9px; background: #EEF6F6; border-radius: 9px; overflow: hidden; display: block; }
.hb b { display: block; height: 100%; background: #1C6E6B; border-radius: 9px; } .hb em { font-style: normal; font-weight: 800; }
.seg { display: inline-flex; background: #fff; border: 1px solid #dce7ea; border-radius: 30px; padding: 3px; margin-bottom: 1rem; }
.seg button { border: 0; background: none; padding: .5rem 1rem; border-radius: 30px; font: inherit; font-weight: 700; color: #58717f; cursor: pointer; min-height: 40px; display: inline-flex; gap: .4rem; align-items: center; }
.seg button.on { background: #1C6E6B; color: #fff; }
.top { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.plan { color: #0A2F44; } .amt { font-weight: 800; color: #0A2F44; } .amt small { font-weight: 500; }
.when { margin-left: auto; }
.det { display: flex; flex-wrap: wrap; gap: .4rem 1.2rem; margin: .5rem 0; color: #0A2F44; font-size: .92rem; }
.det i { color: #1C6E6B; width: 16px; }
.msg { margin: .3rem 0 .6rem; color: #33515f; font-style: italic; } .msg.small { font-style: normal; font-size: .88rem; }
.note-row { display: flex; gap: .5rem; margin-bottom: .6rem; }
.note-row input, .st { font: inherit; padding: .5rem .8rem; border: 1.5px solid #dce7ea; border-radius: 12px; background: #fff; min-height: 40px; color: #0A2F44; }
.note-row input { flex: 1; min-width: 0; }
.btns { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.tp.admin .btn-s.wa { background: #25d366; color: #fff; text-decoration: none; display: inline-flex; align-items: center; gap: .4rem; }
.form { margin-bottom: 1.2rem; display: grid; gap: .8rem; }
.f { display: grid; gap: .25rem; font-size: .8rem; font-weight: 700; color: #58717f; }
.f textarea, .f input, .f select { font: inherit; font-size: .95rem; font-weight: 400; padding: .6rem .8rem; border: 1.5px solid #dce7ea; border-radius: 12px; background: #fff; color: #0A2F44; min-height: 44px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: .8rem; }
.checks { display: flex; flex-wrap: wrap; gap: 1.2rem; }
.chk { display: flex; align-items: center; gap: .5rem; font-weight: 700; color: #0A2F44; }
.tip { margin-top: 1rem; }
.new-plan { display: flex; align-items: center; gap: .4rem; }
.tp.admin .btn-s.trip { background: #0A2F44; color: #fff; text-decoration: none; display: inline-flex; align-items: center; gap: .4rem; }
.tp.admin .btn-s.trip.draft { background: #fdf3d9; color: #8a6410; }
.tp.admin .btn-s.trip.sent { background: #dcfce7; color: #166534; }
.code { border: 1.5px dashed #1C6E6B; background: #EEF6F6; color: #0A2F44; font: inherit; font-weight: 800; letter-spacing: .05em; border-radius: 10px; padding: .3rem .7rem; cursor: pointer; }
.mt { margin-top: .6rem; }
@media (max-width: 900px) { .sum { grid-template-columns: 1fr 1fr; } .grid3 { grid-template-columns: 1fr 1fr; } }
@media (max-width: 560px) { .sum, .grid3 { grid-template-columns: 1fr; } .when { margin-left: 0; width: 100%; } .note-row { flex-direction: column; } }
</style>
