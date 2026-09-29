<script setup>
// "My trips": planes por días (generador) y rutas de Tours, guardados en InsForge.
// Diseño con el mismo lenguaje visual de main.html (hero con foto, insignia, tarjetas redondeadas).
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import L from 'leaflet';
import { useItinerariesStore } from '@/stores/itineraries';
import { toast } from '@/composables/useToast';

const store = useItinerariesStore();
const route = useRoute();
const router = useRouter();

const tab = ref(route.query.tab === 'tours' ? 'tours' : 'plans');
const openId = ref(null);
const editingId = ref(null);
const draft = ref('');
let map = null;
const focusStop = ref(() => {});

const plans = computed(() => store.items.filter((i) => i.source === 'planner'));
const routes = computed(() => store.items.filter((i) => i.source !== 'planner'));
const list = computed(() => (tab.value === 'plans' ? plans.value : routes.value));

function setTab(t) {
  tab.value = t;
  openId.value = null;
  map?.remove(); map = null;
  router.replace({ query: t === 'tours' ? { tab: 'tours' } : {} });
}

/** Puntos del mapa: la ruta de Tours empieza en su partida; el plan por días, en su primera parada. */
function points(it) {
  const stops = it.stops.filter((s) => s.lat != null && s.lng != null).map((s) => [s.lat, s.lng]);
  const hasStart = it.source !== 'planner' && it.start_lat != null && it.start_lng != null;
  return hasStart ? [[it.start_lat, it.start_lng], ...stops] : stops;
}

async function show(it) {
  openId.value = openId.value === it.id ? null : it.id;
  map?.remove(); map = null;
  if (!openId.value) return;
  await nextTick();
  const el = document.getElementById(`map-${it.id}`);
  const pts = points(it);
  if (!el || !pts.length) return;
  map = L.map(el, { scrollWheelZoom: false });
  // Primero la vista (si no, Leaflet no puede dibujar los puntos)
  map.fitBounds(L.latLngBounds(pts).pad(0.2), { maxZoom: 13 });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
  const offset = it.source === 'planner' ? 0 : 1;
  const label = (i) => (i < offset ? 'Start' : `${i - offset + 1}. ${it.stops[i - offset]?.name || ''}${it.stops[i - offset]?.time ? ` · ${it.stops[i - offset].time}` : ''}`);
  L.polyline(pts, { color: '#1C6E6B', weight: 4, opacity: 0.9, dashArray: '6 8' }).addTo(map);
  // Cada punto se puede tocar: tarjeta con foto, nombre, hora y botón "Go here"
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const markers = pts.map((p, i) => {
    const isStart = i < offset;
    const stop = isStart ? null : it.stops[i - offset];
    const title = isStart ? (it.start_label || 'Starting point') : stop?.name;
    const meta = isStart ? 'Starting point' : [stop?.place, stop?.time && `🕒 ${stop.time}`, stop?.duration && `⏱ ${stop.duration}`].filter(Boolean).join(' · ');
    const popup = `
      <div class="pin-card">
        ${stop?.img ? `<img src="${encodeURI(stop.img)}" alt="">` : ''}
        <b>${isStart ? 'A' : i - offset + 1}. ${esc(title)}</b>
        ${meta ? `<small>${esc(meta)}</small>` : ''}
        <a href="https://www.google.com/maps/dir/?api=1&destination=${p[0]},${p[1]}" target="_blank" rel="noopener">Go here →</a>
      </div>`;
    return L.marker(p, {
      riseOnHover: true,
      icon: L.divIcon({
        className: 'trip-pin',
        html: `<span style="background:${isStart ? '#0A2F44' : '#E46D5C'}">${isStart ? 'A' : i - offset + 1}</span>`,
        iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -14],
      }),
    }).bindTooltip(label(i), { direction: 'top', offset: [0, -14] })
      .bindPopup(popup, { maxWidth: 240, className: 'trip-popup' })
      .addTo(map);
  });
  // Lista de paradas debajo del mapa: al tocar una, el mapa vuela a ese punto
  focusStop.value = (i) => { const m = markers[i]; if (!m) return; map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 12), { duration: 0.8 }); setTimeout(() => m.openPopup(), 850); };
  setTimeout(() => map?.invalidateSize(), 200);
}

async function rename(it) {
  try { await store.rename(it, draft.value.trim() || it.title); editingId.value = null; toast('Name updated'); }
  catch (e) { toast(e.message, 'error'); }
}
async function remove(it) {
  if (!confirm(`Delete “${it.title}”?`)) return;
  try { await store.remove(it); toast('Deleted'); } catch (e) { toast(e.message, 'error'); }
}
function mapsLink(it) {
  return `https://www.google.com/maps/dir/${points(it).slice(0, 10).map((p) => p.join(',')).join('/')}`;
}
function openLink(it) {
  return it.source === 'planner'
    ? { path: '/talapo-itinerario', query: { itinerary: it.id } }
    : { path: '/tours', query: { itinerary: it.id } };
}
function fmtDate(d) {
  if (!d) return '';
  return new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function planDays(it) { return it.details?.dias?.length || new Set(it.stops.map((s) => s.day)).size || 1; }
function planDates(it) {
  const d = it.details?.data;
  return d?.fechaInicio ? `${fmtDate(d.fechaInicio)} → ${fmtDate(d.fechaFin || d.fechaInicio)}` : '';
}
function planBudget(it) {
  const days = it.details?.dias || [];
  const total = days.reduce((a, d) => a + (parseFloat(String(d.totalDia || '').replace(/[^0-9.]/g, '')) || 0), 0);
  return total ? `$${total.toFixed(0)} est.` : '';
}
function planPeople(it) {
  const d = it.details?.data; if (!d) return '';
  const a = +d.adultos || 1; const k = +d.ninos || 0;
  return `${a} adult${a > 1 ? 's' : ''}${k ? ` · ${k} child${k > 1 ? 'ren' : ''}` : ''}`;
}

onMounted(() => store.load(true));
onBeforeUnmount(() => map?.remove());
</script>

<template>
  <div class="tp trips">
    <!-- HERO con el mismo estilo del hero de main -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ MY TRAVEL PLANS ✦</div>
        <h1>My trips</h1>
        <p>Your day-by-day itineraries and your Tours routes, saved to your Talapo account.</p>
        <div class="hero-ctas">
          <RouterLink to="/talapo-itinerario" class="cta cta-main"><i class="fas fa-wand-magic-sparkles"></i> Create my itinerary</RouterLink>
          <RouterLink to="/tours" class="cta cta-ghost"><i class="fas fa-route"></i> Build a Tours route</RouterLink>
        </div>
      </div>
    </section>

    <div class="content">
      <!-- Pestañas -->
      <div class="tabs" role="tablist">
        <button role="tab" :aria-selected="tab === 'plans'" :class="{ on: tab === 'plans' }" @click="setTab('plans')">
          <i class="fas fa-calendar-days"></i> Itineraries <span class="count">{{ plans.length }}</span>
        </button>
        <button role="tab" :aria-selected="tab === 'tours'" :class="{ on: tab === 'tours' }" @click="setTab('tours')">
          <i class="fas fa-map-location-dot"></i> Tours routes <span class="count">{{ routes.length }}</span>
        </button>
      </div>

      <p v-if="store.loading && !store.items.length" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading your trips…</p>

      <Transition name="fade" mode="out-in">
        <!-- Vacío -->
        <div v-if="!store.loading && !list.length" :key="`empty-${tab}`" class="empty">
          <div class="empty-icon">{{ tab === 'plans' ? '🗓️' : '🧭' }}</div>
          <template v-if="tab === 'plans'">
            <h2>No itineraries yet</h2>
            <p>Tell Talapo your dates, budget and interests and get a complete day-by-day plan with schedule, map and budget. Then tap “Save to my itineraries”.</p>
            <RouterLink to="/talapo-itinerario" class="cta cta-main">Create my first itinerary</RouterLink>
          </template>
          <template v-else>
            <h2>No Tours routes yet</h2>
            <p>Pick destinations on the map, choose your starting point and save the route.</p>
            <RouterLink to="/tours" class="cta cta-main">Build my first route</RouterLink>
          </template>
        </div>

        <!-- Lista -->
        <TransitionGroup v-else :key="`list-${tab}`" name="card" tag="ul" class="list">
          <li v-for="it in list" :key="it.id" class="trip-card">
            <div class="row">
              <div class="cover">
                <template v-if="it.stops.some((s) => s.img)">
                  <img v-for="s in it.stops.filter((x) => x.img).slice(0, 3)" :key="s.id" :src="s.img" alt="" />
                </template>
                <div v-else class="cover-plan"><span>{{ planDays(it) }}</span><small>day{{ planDays(it) > 1 ? 's' : '' }}</small></div>
              </div>

              <div class="info">
                <form v-if="editingId === it.id" class="rename" @submit.prevent="rename(it)">
                  <input v-model="draft" maxlength="80" aria-label="Name" />
                  <button class="mini-btn dark">Save</button>
                  <button type="button" class="mini-btn" @click="editingId = null">Cancel</button>
                </form>
                <h3 v-else>{{ it.title }}</h3>

                <div class="chips">
                  <template v-if="it.source === 'planner'">
                    <span v-if="planDates(it)"><i class="fas fa-calendar"></i>{{ planDates(it) }}</span>
                    <span v-if="planPeople(it)"><i class="fas fa-user-group"></i>{{ planPeople(it) }}</span>
                    <span v-if="planBudget(it)"><i class="fas fa-wallet"></i>{{ planBudget(it) }}</span>
                  </template>
                  <span><i class="fas fa-location-dot"></i>{{ it.stops.length }} stops</span>
                  <span v-if="it.distance_km"><i class="fas fa-road"></i>{{ it.distance_km }} km</span>
                  <span v-if="it.duration_min"><i class="fas fa-clock"></i>{{ Math.floor(it.duration_min / 60) }} h {{ it.duration_min % 60 }} min</span>
                </div>
                <p class="stops">{{ it.stops.slice(0, 6).map((s) => s.name).join(' → ') }}<template v-if="it.stops.length > 6"> …</template></p>
                <p class="saved">Saved {{ fmtDate(it.created_at) }}</p>
              </div>

              <div class="actions">
                <RouterLink class="act primary" :to="openLink(it)">
                  <i class="fas" :class="it.source === 'planner' ? 'fa-book-open' : 'fa-pen-to-square'"></i>{{ it.source === 'planner' ? 'Open itinerary' : 'Edit route' }}
                </RouterLink>
                <RouterLink v-if="it.source !== 'planner'" class="act" to="/talapo-itinerario" title="Generate a day-by-day itinerary">
                  <i class="fas fa-wand-magic-sparkles"></i>Make itinerary
                </RouterLink>
                <button class="act" :aria-expanded="openId === it.id" @click="show(it)"><i class="fas fa-map"></i>{{ openId === it.id ? 'Hide map' : 'Map' }}</button>
                <a class="act" :href="mapsLink(it)" target="_blank" rel="noopener"><i class="fas fa-diamond-turn-right"></i>Navigate</a>
                <button class="act icon" aria-label="Rename" title="Rename" @click="editingId = it.id; draft = it.title"><i class="fas fa-pen"></i></button>
                <button class="act icon danger" aria-label="Delete" title="Delete" @click="remove(it)"><i class="fas fa-trash-can"></i></button>
              </div>
            </div>
            <Transition name="fade">
              <div v-if="openId === it.id" class="map-block">
                <div :id="`map-${it.id}`" class="mini-map"></div>
                <ol class="stop-list">
                  <li v-if="it.source !== 'planner' && it.start_lat != null">
                    <button @click="focusStop(0)"><span class="n start">A</span>{{ it.start_label || 'Starting point' }}</button>
                  </li>
                  <li v-for="(s, i) in it.stops.filter((x) => x.lat != null)" :key="s.id || i">
                    <button @click="focusStop(i + (it.source !== 'planner' && it.start_lat != null ? 1 : 0))"><span class="n">{{ i + 1 }}</span>{{ s.name }}<small v-if="s.time"> · {{ s.time }}</small></button>
                  </li>
                </ol>
              </div>
            </Transition>
          </li>
        </TransitionGroup>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.trips { font-family: 'Outfit', 'Inter', sans-serif; background: #F8FBFE; min-height: 100vh; }

/* Hero: igual al de main.html */
.hero { background: linear-gradient(rgba(1, 5, 37, 0.5), rgba(4, 12, 73, 0.55)), url('/assets/img/tours/lago suchitlan.jpg') no-repeat center 45%/cover; color: #fff; padding: clamp(3rem, 6vw, 4.5rem) 5%; }
.hero-inner { max-width: 1200px; margin: 0 auto; animation: rise .6s cubic-bezier(.2,.7,.2,1) both; }
.hero-badge { display: inline-block; background: #0A2F44; color: #fff; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; padding: 0.4rem 1rem; border-radius: 40px; margin-bottom: 1rem; }
.hero h1 { font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800; text-transform: uppercase; margin: 0 0 .5rem; line-height: 1; }
.hero p { font-weight: 600; max-width: 52ch; margin: 0 0 1.5rem; color: #eef4f8; }
.hero-ctas { display: flex; gap: .8rem; flex-wrap: wrap; }
.cta { display: inline-flex; align-items: center; gap: .55rem; padding: .85rem 1.4rem; border-radius: 40px; font-weight: 700; text-decoration: none; transition: transform .25s, box-shadow .25s, background .25s; }
.cta:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -10px rgba(0,0,0,.45); }
.cta-main { background: #E46D5C; color: #fff; }
.cta-main:hover { background: #d05a49; }
.cta-ghost { background: rgba(255,255,255,.14); color: #fff; border: 1.5px solid rgba(255,255,255,.55); backdrop-filter: blur(6px); }

.content { max-width: 1200px; margin: 0 auto; padding: 2rem 5% 4rem; }

/* Pestañas */
.tabs { display: inline-flex; background: #fff; border: 1px solid rgba(28,110,107,.18); border-radius: 40px; padding: 5px; gap: 4px; box-shadow: 0 10px 25px -15px rgba(0,32,64,.25); margin-bottom: 1.6rem; }
.tabs button { border: 0; background: none; border-radius: 40px; padding: .65rem 1.2rem; font: inherit; font-weight: 700; color: #1A3A4A; cursor: pointer; display: flex; align-items: center; gap: .5rem; transition: background .25s, color .25s; }
.tabs button.on { background: linear-gradient(105deg, #1C6E6B, #0A2F44); color: #fff; }
.count { background: rgba(0,0,0,.08); border-radius: 20px; padding: 0 .5rem; font-size: .8rem; }
.tabs button.on .count { background: rgba(255,255,255,.22); }
.loading { color: #58717f; }

/* Vacío */
.empty { background: #fff; border-radius: 24px; padding: 3rem 1.5rem; text-align: center; box-shadow: 0 20px 35px -18px rgba(0,32,64,.2); display: grid; justify-items: center; }
.empty-icon { font-size: 3rem; margin-bottom: .5rem; }
.empty h2 { color: #0A2F44; margin: 0 0 .5rem; font-size: 1.6rem; }
.empty p { color: #58717f; max-width: 52ch; margin: 0 0 1.4rem; line-height: 1.6; }

/* Tarjetas */
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.1rem; }
.trip-card { background: #fff; border-radius: 24px; padding: 1.2rem; box-shadow: 0 20px 35px -20px rgba(0,32,64,.25); border: 1px solid rgba(28,110,107,.08); transition: transform .25s, box-shadow .25s; }
.trip-card:hover { transform: translateY(-3px); box-shadow: 0 26px 40px -20px rgba(0,32,64,.32); }
.row { display: grid; grid-template-columns: auto 1fr auto; gap: 1.3rem; align-items: center; }
.cover { display: flex; }
.cover img { width: 70px; height: 70px; border-radius: 16px; object-fit: cover; border: 3px solid #fff; margin-left: -22px; box-shadow: 0 6px 14px -6px rgba(0,0,0,.35); }
.cover img:first-child { margin-left: 0; }
.cover-plan { width: 84px; height: 84px; border-radius: 20px; background: linear-gradient(135deg, #1C6E6B, #0A2F44); color: #fff; display: grid; place-content: center; text-align: center; }
.cover-plan span { font-size: 1.9rem; font-weight: 800; line-height: 1; }
.cover-plan small { font-size: .75rem; opacity: .85; }
.info h3 { margin: 0 0 .45rem; color: #0A2F44; font-size: 1.25rem; }
.chips { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .45rem; }
.chips span { background: #EEF6F6; color: #1C6E6B; border-radius: 20px; padding: .2rem .65rem; font-size: .8rem; font-weight: 600; display: inline-flex; gap: .35rem; align-items: center; }
.stops { margin: 0; color: #4a6472; font-size: .92rem; }
.saved { margin: .3rem 0 0; color: #8aa0ab; font-size: .78rem; }
.actions { display: flex; flex-wrap: wrap; gap: .4rem; justify-content: flex-end; max-width: 360px; }
.act { display: inline-flex; align-items: center; gap: .4rem; border: 1.5px solid #dce7ea; background: #fff; color: #1A3A4A; border-radius: 40px; padding: .45rem .85rem; font: inherit; font-size: .85rem; font-weight: 600; text-decoration: none; cursor: pointer; transition: all .2s; }
.act:hover { border-color: #1C6E6B; color: #1C6E6B; }
.act.primary { background: #0A2F44; border-color: #0A2F44; color: #fff; }
.act.primary:hover { background: #1C6E6B; border-color: #1C6E6B; color: #fff; }
.act.icon { padding: .45rem .6rem; }
.act.danger:hover { border-color: #E46D5C; color: #E46D5C; }
.rename { display: flex; gap: .4rem; margin-bottom: .45rem; flex-wrap: wrap; }
.rename input { flex: 1; min-width: 180px; padding: .5rem .8rem; border: 1.5px solid #cbdbe2; border-radius: 12px; font: inherit; }
.mini-btn { border: 1.5px solid #dce7ea; background: #fff; border-radius: 12px; padding: .4rem .8rem; font: inherit; font-weight: 600; cursor: pointer; }
.mini-btn.dark { background: #0A2F44; border-color: #0A2F44; color: #fff; }
.mini-map { height: 340px; border-radius: 18px; margin-top: 1rem; z-index: 0; }
.stop-list { list-style: none; margin: .8rem 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: .4rem; }
.stop-list button { display: inline-flex; align-items: center; gap: .45rem; border: 1.5px solid #dce7ea; background: #fff; border-radius: 40px; padding: .3rem .8rem .3rem .3rem; font: inherit; font-size: .85rem; font-weight: 600; color: #1A3A4A; cursor: pointer; transition: border-color .2s, transform .15s; }
.stop-list button:hover { border-color: #1C6E6B; transform: translateY(-2px); }
.stop-list .n { width: 24px; height: 24px; border-radius: 50%; background: #E46D5C; color: #fff; display: grid; place-items: center; font-size: .75rem; font-weight: 800; }
.stop-list .n.start { background: #0A2F44; }
.stop-list small { color: #8aa0ab; font-weight: 500; }
:deep(.trip-pin span) { width: 32px; height: 32px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font: 800 13px Outfit, Inter, sans-serif; border: 2px solid #fff; box-shadow: 0 6px 14px -6px rgba(0,0,0,.6); cursor: pointer; transition: transform .2s; }
:deep(.trip-pin:hover span) { transform: scale(1.18); }
:deep(.trip-popup .leaflet-popup-content-wrapper) { border-radius: 16px; }
:deep(.trip-popup .leaflet-popup-content) { margin: 10px; }
:deep(.pin-card) { display: grid; gap: 4px; font-family: Outfit, Inter, sans-serif; min-width: 170px; }
:deep(.pin-card img) { width: 100%; height: 100px; object-fit: cover; border-radius: 10px; }
:deep(.pin-card b) { color: #0A2F44; font-size: 14px; }
:deep(.pin-card small) { color: #58717f; }
:deep(.pin-card a) { color: #E46D5C; font-weight: 700; text-decoration: none; margin-top: 2px; }

/* Transiciones */
@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.fade-enter-active, .fade-leave-active { transition: opacity .25s ease, transform .25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(8px); }
.card-enter-active { transition: opacity .35s ease, transform .35s ease; }
.card-enter-from { opacity: 0; transform: translateY(14px); }
.card-leave-active { transition: opacity .25s ease; }
.card-leave-to { opacity: 0; }
.card-move { transition: transform .3s ease; }

@media (max-width: 860px) {
  .row { grid-template-columns: auto 1fr; }
  .actions { grid-column: 1 / -1; justify-content: flex-start; max-width: none; }
}
@media (max-width: 520px) {
  .tabs { display: flex; width: 100%; }
  .tabs button { flex: 1; justify-content: center; padding: .6rem .5rem; font-size: .9rem; }
  .row { grid-template-columns: 1fr; }
}
</style>