<script setup>
// Mapa del stand: lugares cercanos, distancia caminando y cómo llegar
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import L from 'leaflet';
import QrCode from '@/components/kiosk/QrCode.vue';
import { distanceMeters, walkLabel, directionsUrl } from '@/data/stands';

const props = defineProps({ stand: { type: Object, required: true } });
const el = ref(null);
const map = shallowRef(null);
const selected = ref(null);
const markers = {};
const places = computed(() => props.stand.places.map((p) => ({ ...p, meters: distanceMeters(props.stand, p) })).sort((a, b) => a.meters - b.meters));

function select(p) {
  selected.value = p;
  const m = markers[p.slug];
  if (m && map.value) { map.value.flyTo(m.getLatLng(), 18, { duration: 0.8 }); setTimeout(() => m.openPopup(), 850); }
}

onMounted(() => {
  map.value = L.map(el.value, { zoomControl: true, scrollWheelZoom: false, tap: true });
  map.value.setView([props.stand.lat, props.stand.lng], 17);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map.value);

  // "Estás aquí" (el stand)
  L.marker([props.stand.lat, props.stand.lng], {
    zIndexOffset: 1000,
    icon: L.divIcon({ className: 'k-you', html: '<span>📍 You are here</span>', iconSize: [120, 34], iconAnchor: [60, 38] }),
  }).addTo(map.value);

  places.value.forEach((p, i) => {
    if (p.meters < 30) return; // el propio parque es el stand
    markers[p.slug] = L.marker([p.lat, p.lng], {
      riseOnHover: true,
      icon: L.divIcon({ className: 'k-pin', html: `<span>${i}</span>`, iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -16] }),
    }).bindPopup(`<b>${p.name}</b><br>${walkLabel(p.meters)}`).on('click', () => (selected.value = p)).addTo(map.value);
  });
  const pts = places.value.map((p) => [p.lat, p.lng]).concat([[props.stand.lat, props.stand.lng]]);
  map.value.fitBounds(L.latLngBounds(pts).pad(0.25), { maxZoom: 18 });
  setTimeout(() => map.value?.invalidateSize(), 250);
});
onBeforeUnmount(() => map.value?.remove());
</script>

<template>
  <section class="page">
    <div class="head">
      <span class="emoji">🗺️</span>
      <div><h1>Map</h1><p>Places around {{ stand.name }}. Touch one to see how to get there.</p></div>
    </div>
    <div class="layout">
      <div ref="el" class="map" role="application" aria-label="Map of nearby places"></div>
      <aside class="side">
        <Transition name="kfade" mode="out-in">
          <div v-if="selected" :key="selected.slug" class="detail">
            <img v-if="selected.image" :src="selected.image" alt="" />
            <div v-else class="noimg">{{ selected.emoji }}</div>
            <h2>{{ selected.name }}</h2>
            <p class="dist"><i class="fas fa-person-walking"></i> {{ walkLabel(selected.meters) }}</p>
            <p>{{ selected.short }}</p>
            <div class="qr-row">
              <QrCode :value="directionsUrl(stand, selected)" :size="120" :label="`Directions to ${selected.name}`" />
              <span>📱 Scan to open the walking route on your phone</span>
            </div>
            <div class="btns">
              <RouterLink :to="{ name: 'kiosk-place', params: { stand: stand.id, slug: selected.slug } }" class="b ghost">Read its story</RouterLink>
              <button class="b ghost" @click="selected = null">All places</button>
            </div>
          </div>
          <ol v-else key="list" class="list">
            <li v-for="(p, i) in places" :key="p.slug">
              <button @click="select(p)">
                <span class="n" :class="{ here: p.meters < 30 }">{{ p.meters < 30 ? '📍' : i }}</span>
                <span class="txt"><b>{{ p.name }}</b><small>{{ p.meters < 30 ? 'You are here' : walkLabel(p.meters) }}</small></span>
                <i class="fas fa-chevron-right"></i>
              </button>
            </li>
          </ol>
        </Transition>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.page { flex: 1; display: flex; flex-direction: column; padding: clamp(18px, 3vh, 32px) clamp(16px, 4vw, 44px); max-width: 1300px; width: 100%; margin: 0 auto; }
.head { display: flex; gap: 16px; align-items: center; margin-bottom: 18px; }
.head .emoji { font-size: 3rem; }
.head h1 { margin: 0; font-size: clamp(1.8rem, 4vw, 2.6rem); color: #E46D5C; }
.head p { margin: 4px 0 0; color: #58717f; font-size: 1.05rem; }
.layout { flex: 1; display: grid; grid-template-columns: 1fr 380px; gap: 18px; min-height: 60vh; }
.map { border-radius: 24px; min-height: 420px; z-index: 0; box-shadow: 0 20px 34px -22px rgba(0,32,64,.4); }
.side { background: #fff; border-radius: 24px; padding: 16px; box-shadow: 0 20px 34px -22px rgba(0,32,64,.35); overflow-y: auto; max-height: 75vh; }
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.list button { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; border: 1.5px solid #e2ecef; background: #fff; font: inherit; color: inherit; cursor: pointer; text-align: left; min-height: 64px; transition: border-color .2s, transform .15s; }
.list button:active { transform: scale(.98); }
.list button:hover { border-color: #E46D5C; }
.n { width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%; background: #E46D5C; color: #fff; display: grid; place-items: center; font-weight: 800; }
.n.here { background: #0A2F44; }
.txt { flex: 1; }
.txt b { display: block; font-size: 1.05rem; }
.txt small { color: #58717f; }
.detail img { width: 100%; height: 170px; object-fit: cover; border-radius: 16px; }
.noimg { height: 150px; border-radius: 16px; background: linear-gradient(135deg, #1C6E6B, #0A2F44); display: grid; place-items: center; font-size: 4rem; }
.detail h2 { margin: 12px 0 4px; }
.dist { color: #1C6E6B; font-weight: 700; margin: 0 0 8px; }
.detail p { color: #4a6472; line-height: 1.5; }
.qr-row { display: flex; gap: 12px; align-items: center; background: #0A2F44; color: #fff; border-radius: 16px; padding: 10px; font-weight: 600; }
.btns { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.b { flex: 1; min-height: 52px; border-radius: 40px; border: 1.5px solid #dce7ea; background: #fff; font: inherit; font-weight: 700; color: #0A2F44; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; }
:deep(.k-pin span) { width: 36px; height: 36px; border-radius: 50%; background: #E46D5C; color: #fff; display: flex; align-items: center; justify-content: center; font: 800 15px Outfit, sans-serif; border: 3px solid #fff; box-shadow: 0 6px 14px -6px rgba(0,0,0,.6); transition: transform .2s; }
:deep(.k-pin:hover span) { transform: scale(1.15); }
:deep(.k-you span) { display: inline-block; white-space: nowrap; background: #0A2F44; color: #fff; font: 700 13px Outfit, sans-serif; padding: 7px 12px; border-radius: 30px; box-shadow: 0 8px 18px -8px rgba(0,0,0,.6); animation: bob 1.6s ease-in-out infinite; }
@keyframes bob { 50% { transform: translateY(-4px); } }
.kfade-enter-active, .kfade-leave-active { transition: opacity .2s ease; }
.kfade-enter-from, .kfade-leave-to { opacity: 0; }
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .map { min-height: 340px; } .side { max-height: none; } }
</style>
