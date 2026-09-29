<script setup>
// pasaporte.html ORIGINAL (mismo marcado y pasaporte.css) — ahora guardado en InsForge.
// Nuevo: panel del perfil (Streak, Itineraries, Tours, Contests) con la misma estética (.card-box).
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usePassportStore } from '@/stores/passport';
import { useItinerariesStore } from '@/stores/itineraries';
import { useContestsStore } from '@/stores/contests';
import { useSocialStore } from '@/stores/social';
import { challenges } from '@/data/contests';
import { toast } from '@/composables/useToast';
import '@/styles/pages/passport.css';

const router = useRouter();
const auth = useAuthStore();
const passport = usePassportStore();
const itineraries = useItinerariesStore();
const contests = useContestsStore();
const social = useSocialStore();
const savingPublic = ref(false);
async function togglePublic() {
  savingPublic.value = true;
  try { await passport.setPublic(!(passport.profile?.is_public ?? true)); toast(passport.profile.is_public ? 'Your profile is now public' : 'Your profile is now private'); }
  catch (e) { toast(e.message, 'error'); }
  finally { savingPublic.value = false; }
}

const editing = ref(false);
const saving = ref(false);
const form = reactive({ nombre: '', nacionalidad: '', nPasaporte: '', fechaNac: '' });
const photoFile = ref(null);
const preview = ref('');
const photoStatus = ref({ text: 'You can take an instant photo or upload an image file from your device.', ok: false });
const panel = ref('streak'); // panel abierto: streak | contests | itineraries

const p = computed(() => passport.profile || {});
const showForm = computed(() => editing.value || (passport.loaded && !passport.hasPassport));

function fillForm() {
  form.nombre = p.value.display_name || auth.displayName;
  form.nacionalidad = p.value.nationality || '';
  form.nPasaporte = p.value.passport_number || '';
  form.fechaNac = p.value.birth_date || '';
  preview.value = p.value.photo_url || '';
  if (preview.value) photoStatus.value = { text: 'Current photo loaded.', ok: true };
}
watch(() => passport.loaded, (v) => v && fillForm(), { immediate: true });

/* ---------- 1. Cámara web (igual que el original) ---------- */
const video = ref(null);
const cameraOn = ref(false);
let stream = null;
async function activarCamara() {
  try {
    cameraOn.value = true;
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 500 } });
    video.value.srcObject = stream;
  } catch {
    cameraOn.value = false;
    alert('We could not access the camera. Check the permissions or upload a file instead.');
  }
}
function stopCamera() { stream?.getTracks().forEach((t) => t.stop()); stream = null; cameraOn.value = false; }
function capturar() {
  const c = document.createElement('canvas');
  c.width = video.value.videoWidth || 300; c.height = video.value.videoHeight || 400;
  c.getContext('2d').drawImage(video.value, 0, 0, c.width, c.height);
  c.toBlob((blob) => {
    photoFile.value = new File([blob], 'photo.png', { type: 'image/png' });
    preview.value = URL.createObjectURL(blob);
    photoStatus.value = { text: 'Photo captured!', ok: true };
  }, 'image/png');
  stopCamera();
}
function subirArchivo(e) {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 5e6) { toast('Choose an image under 5 MB.', 'error'); return; }
  photoFile.value = f;
  preview.value = URL.createObjectURL(f);
  photoStatus.value = { text: 'Image uploaded successfully.', ok: true };
}
onBeforeUnmount(stopCamera);

async function guardar() {
  if (!preview.value) { alert('Please take a photo or upload an image to continue.'); return; }
  saving.value = true;
  try {
    const photo_url = photoFile.value ? await passport.uploadPhoto(photoFile.value) : p.value.photo_url;
    await passport.savePassport({
      display_name: form.nombre.trim(),
      nationality: form.nacionalidad.trim(),
      passport_number: form.nPasaporte.trim().toUpperCase(),
      birth_date: form.fechaNac || null,
      photo_url,
    });
    await passport.seedDefaultStamps();
    photoFile.value = null;
    editing.value = false;
    toast('Your Talapo Passport is ready 🛂');
  } catch (e) { toast(e.message, 'error'); }
  finally { saving.value = false; }
}

/* ---------- 2. Vista del pasaporte (datos + MRZ como el original) ---------- */
const partes = computed(() => (p.value.display_name || '').trim().split(/\s+/));
const nombre = computed(() => (partes.value[0] || '').toUpperCase());
const apellido = computed(() => (partes.value.slice(1).join(' ') || 'TALAPO').toUpperCase());
const mrz = computed(() => {
  let fechaCode = '990112';
  const f = (p.value.birth_date || '').split('-');
  if (f.length === 3) fechaCode = f[0].slice(2) + f[1] + f[2];
  const lt = '<';
  return [
    `P${lt}SLV${apellido.value.padEnd(10, lt)}${lt}${nombre.value.padEnd(10, lt)}${lt.repeat(22)}`,
    `${(p.value.passport_number || '').toUpperCase()}${lt}4SLV${fechaCode}M2607250${lt.repeat(6)}04`,
  ];
});

/* ---------- 3. Bitácora de lugares (foto de visita por lugar) ---------- */
const placeInput = ref(null);
let activeStamp = null;
function pedirFoto(stamp) { activeStamp = stamp; placeInput.value.click(); }
async function onPlacePhoto(e) {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f || !activeStamp) return;
  try { await passport.stampPhoto(activeStamp, f); toast(`${activeStamp.place_name}: stamped!`); }
  catch (err) { toast(err.message, 'error'); }
}
async function nuevoDestino() {
  const name = prompt('Enter the name of a new place you visited in El Salvador:');
  if (!name || !name.trim()) return;
  try { await passport.addStamp(name.trim().slice(0, 60)); } catch (err) { toast(err.message, 'error'); }
}

/* ---------- 4. Paneles nuevos ---------- */
const plans = computed(() => itineraries.items.filter((i) => i.source === 'planner'));
const tourRoutes = computed(() => itineraries.items.filter((i) => i.source !== 'planner'));
const tabs = computed(() => [
  { id: 'streak', emoji: '🔥', count: passport.streak, label: 'Streak' },
  { id: 'plans', emoji: '🗓️', count: plans.value.length, label: 'Itineraries' },
  { id: 'tours', emoji: '🧭', count: tourRoutes.value.length, label: 'Tours' },
  { id: 'contests', emoji: '🏆', count: contests.count, label: 'Contests' },
  { id: 'community', emoji: '🤝', count: social.followersCount, label: 'Followers' },
]);

/** 12 semanas en columnas (lunes arriba), terminando en la semana actual. */
const calendar = computed(() => {
  const active = new Set(passport.activity);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;            // 0 = lunes
  const start = new Date(today); start.setDate(today.getDate() - dow - 7 * 11);
  const days = [];
  for (let i = 0; i < 84; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const key = d.toLocaleDateString('en-CA');
    days.push({ key, on: active.has(key), today: d.toDateString() === today.toDateString(), pad: d > today });
  }
  return days;
});
const streakMessage = computed(() => {
  const n = passport.streak;
  if (n >= 30) return `Legendary! ${n} days in a row exploring El Salvador with Talapo. 🏆`;
  if (n >= 7) return `A full week and counting — you're a true member of the Talapo Family! ✨`;
  if (n >= 2) return `You're on fire! Come back tomorrow to reach ${n + 1} days in a row.`;
  return 'Visit Talapo every day to grow your streak. Come back tomorrow to keep it going! 🔥';
});
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''; }
const challengeName = (slug) => challenges.find((c) => c.slug === slug)?.title || slug;
const challengeEmoji = (slug) => challenges.find((c) => c.slug === slug)?.emoji || '🏆';
</script>

<template>
  <div class="pg-passport">
    <div class="passport-wrapper">
      <p v-if="!passport.loaded" class="loading-note"><i class="fas fa-passport fa-beat"></i> Loading your passport…</p>

      <Transition name="flip" mode="out-in">
        <!-- 1. FORMULARIO PARA CREAR EL PASAPORTE -->
        <div v-if="passport.loaded && showForm" key="form" id="formContainer" class="card-box">
          <h2>{{ passport.hasPassport ? 'Edit your Talapo Passport' : 'Create your Talapo Passport' }}</h2>
          <form id="passportForm" @submit.prevent="guardar">
            <div class="form-group">
              <label for="nombre">Full Name:</label>
              <input id="nombre" v-model="form.nombre" type="text" required placeholder="e.g. Rocío Calderón">
            </div>
            <div class="form-group">
              <label for="nacionalidad">Nationality:</label>
              <input id="nacionalidad" v-model="form.nacionalidad" type="text" required placeholder="e.g. Salvadoran">
            </div>
            <div class="form-group">
              <label for="nPasaporte">Passport Number:</label>
              <input id="nPasaporte" v-model="form.nPasaporte" type="text" required placeholder="Ej. SV9876543">
            </div>
            <div class="form-group">
              <label for="fechaNac">Date of Birth:</label>
              <input id="fechaNac" v-model="form.fechaNac" type="date" required>
            </div>

            <div class="form-group">
              <label>Profile Photo:</label>
              <div class="camera-section">
                <button type="button" class="btn-action" @click="activarCamara"><i class="fas fa-camera"></i> Take Photo with Camera</button>
                <div :class="{ hidden: !cameraOn }" style="margin-top: 10px;">
                  <video id="videoElement" ref="video" autoplay playsinline></video>
                  <button type="button" class="btn-action btn-capture" @click="capturar"><i class="fas fa-circle"></i> Capture photo</button>
                </div>
                <div class="photo-preview-container">
                  <img v-show="preview" id="photoPreview" :src="preview" alt="Vista previa" style="display:block">
                  <div style="font-size: 12px; color: #64748b; text-align: left;">
                    <span :style="{ color: photoStatus.ok ? '#10b981' : '' }">{{ photoStatus.text }}</span>
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 10px; margin-top: 8px;">
                <input type="file" accept="image/*" style="font-size: 13px; padding: 8px;" @change="subirArchivo">
              </div>
            </div>

            <button type="submit" class="btn-submit" :disabled="saving">
              {{ saving ? 'Saving…' : 'Create your Talapo Passport' }} <i class="fas fa-passport"></i>
            </button>
            <button v-if="passport.hasPassport" type="button" class="btn-secondary" @click="editing = false">Cancel</button>
          </form>
        </div>

        <!-- 2. VISTA DEL PASAPORTE CREADO -->
        <div v-else-if="passport.loaded" key="book" class="book-area">
          <div id="viewContainer" class="passport-book">
            <!-- PÁGINA IZQUIERDA: DATOS PERSONALES -->
            <div class="passport-page left-page">
              <div>
                <div class="page-header">
                  <div class="country-title">
                    <span>REPUBLIC OF EL SALVADOR</span>
                    <span>PASAPORTE / PASSPORT</span>
                  </div>
                  <div class="passport-logo"><img src="/assets/img/logos/logooriginal.png" alt="Talapo Logo"></div>
                </div>
                <div class="passport-content">
                  <div class="passport-photo-frame"><img :src="p.photo_url" alt="Passport photo"></div>
                  <div class="passport-data-grid">
                    <div class="data-item"><label>SURNAME / APELLIDOS</label><span>{{ apellido }}</span></div>
                    <div class="data-item"><label>GIVEN NAMES / NOMBRES</label><span>{{ nombre }}</span></div>
                    <div class="data-item"><label>NATIONALITY / NACIONALIDAD</label><span>{{ (p.nationality || '').toUpperCase() }}</span></div>
                    <div class="data-item"><label>DATE OF BIRTH / FECHA NAC.</label><span>{{ p.birth_date }}</span></div>
                    <div class="data-item"><label>PASSPORT NO. / N° PASAPORTE</label><span>{{ (p.passport_number || '').toUpperCase() }}</span></div>
                  </div>
                </div>
              </div>
              <div class="mrz-zone">{{ mrz[0] }}<br>{{ mrz[1] }}</div>
            </div>

            <!-- PÁGINA DERECHA: BITÁCORA DE LUGARES -->
            <div class="passport-page right-page">
              <div>
                <div class="page-header">
                  <div class="visa-header">TRAVEL LOG / VISITS</div>
                  <div style="font-size: 10px; color: #1e3a8a; font-weight: bold;"><i class="fas fa-stamp"></i> DIGITAL STAMP</div>
                </div>
                <div style="font-size: 10px; color: #64748b; margin-bottom: 5px;">Click on any destination to upload your visit photo:</div>
                <TransitionGroup name="stamp" tag="div" class="places-grid">
                  <div v-for="s in passport.stamps" :key="s.id" class="place-stamp-card" @click="pedirFoto(s)">
                    <div class="place-img-box">
                      <img v-if="s.photo_url" :src="s.photo_url" :alt="s.place_name">
                      <div v-else class="placeholder-icon"><i class="fas fa-camera"></i></div>
                    </div>
                    <div class="place-title">{{ s.place_name }}</div>
                    <div class="place-status">
                      <template v-if="s.visited_at && s.photo_url"><i class="fas fa-check-circle" style="color:#059669"></i> Visited</template>
                      <template v-else><i class="fas fa-plus-circle"></i> Add photo</template>
                    </div>
                  </div>
                  <div key="add" class="add-place-btn" @click="nuevoDestino">
                    <i class="fas fa-map-marked-alt" style="font-size: 16px;"></i>
                    <span>New destination</span>
                  </div>
                </TransitionGroup>
              </div>
              <div style="font-size: 10px; color: #64748b; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 10px;">
                <span>El Salvador Travel Hub</span>
                <span style="font-family: 'Courier Prime', monospace; color: #1e3a8a; font-size: 10px;">Stamp page</span>
              </div>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN EXTERNOS (originales) -->
          <div class="actions-row">
            <button type="button" class="btn-secondary" style="margin-top: 0;" @click="fillForm(); editing = true">
              <i class="fas fa-edit"></i> Edit Personal Data
            </button>
            <button type="button" class="btn-submit" style="background-color: #0284c7; margin-top: 0;" @click="router.push('/main')">
              <i class="fas fa-home"></i> Return to Main
            </button>
          </div>

          <!-- NUEVO: panel del perfil (Streak · Itineraries · Tours · Contests) -->
          <div class="panel-tabs" role="tablist">
            <button v-for="t in tabs" :key="t.id" role="tab" :class="{ on: panel === t.id }" :aria-selected="panel === t.id" @click="panel = t.id">
              <span class="tab-emoji">{{ t.emoji }}</span>
              <span class="tab-num">{{ t.count }}</span>
              <span class="tab-label">{{ t.label }}</span>
            </button>
          </div>

          <Transition name="flip" mode="out-in">
            <!-- STREAK -->
            <div v-if="panel === 'streak'" key="streak" class="card-box panel">
              <div class="streak-hero">
                <div class="flame" :class="{ lit: passport.streak > 0 }">
                  <span class="flame-emoji">🔥</span>
                  <span class="flame-num">{{ passport.streak }}</span>
                  <span class="flame-label">day streak</span>
                </div>
                <div class="streak-text">
                  <h2>Talapo Streak</h2>
                  <p>{{ streakMessage }}</p>
                  <div class="streak-stats">
                    <div><b>{{ passport.longestStreak }}</b><span>Best streak</span></div>
                    <div><b>{{ passport.activity.length }}</b><span>Active days</span></div>
                    <div><b>{{ passport.weeksActive }}</b><span>Active weeks</span></div>
                    <div><b>{{ passport.daysInFamily }}</b><span>Days in the Talapo Family</span></div>
                  </div>
                </div>
              </div>
              <div class="cal">
                <div class="cal-head"><span>Last 12 weeks</span><span class="legend"><i></i> inactive <i class="on"></i> active</span></div>
                <div class="cal-body">
                  <div class="cal-days"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span></div>
                  <div class="heatmap" aria-label="Active days in the last 12 weeks">
                    <span v-for="d in calendar" :key="d.key" :class="{ on: d.on, today: d.today, pad: d.pad }" :title="d.pad ? '' : d.key"></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ITINERARIES (planes por días) -->
            <div v-else-if="panel === 'plans'" key="plans" class="card-box panel">
              <div class="panel-head"><h2>My itineraries</h2><button class="link-btn" @click="router.push('/itineraries')">See all →</button></div>
              <ul v-if="plans.length" class="panel-list">
                <li v-for="it in plans.slice(0, 5)" :key="it.id">
                  <span class="emoji">🗓️</span>
                  <div><b>{{ it.title }}</b><small>{{ it.details?.dias?.length || 1 }} day(s) · {{ it.stops.length }} stops · saved {{ fmtDate(it.created_at) }}</small></div>
                  <RouterLink class="open" :to="{ path: '/talapo-itinerario', query: { itinerary: it.id } }">Open</RouterLink>
                </li>
              </ul>
              <p v-else class="panel-note">You haven't saved any itinerary yet. Generate a day-by-day plan and tap “Save to my itineraries”.</p>
              <div class="actions-row" style="margin-top: 14px;">
                <button class="btn-submit" style="margin-top: 0;" @click="router.push('/talapo-itinerario')"><i class="fas fa-wand-magic-sparkles"></i> Create itinerary</button>
              </div>
            </div>

            <!-- TOURS ROUTES -->
            <div v-else-if="panel === 'tours'" key="tours" class="card-box panel">
              <div class="panel-head"><h2>My Tours routes</h2><button class="link-btn" @click="router.push({ path: '/itineraries', query: { tab: 'tours' } })">See all →</button></div>
              <ul v-if="tourRoutes.length" class="panel-list">
                <li v-for="it in tourRoutes.slice(0, 5)" :key="it.id">
                  <span class="emoji">🧭</span>
                  <div><b>{{ it.title }}</b><small>{{ it.stops.length }} stops<template v-if="it.distance_km"> · {{ it.distance_km }} km</template> · saved {{ fmtDate(it.created_at) }}</small></div>
                  <RouterLink class="open" :to="{ path: '/tours', query: { itinerary: it.id } }">Open</RouterLink>
                </li>
              </ul>
              <p v-else class="panel-note">No Tours routes yet. Pick places on the map and save your route.</p>
              <div class="actions-row" style="margin-top: 14px;">
                <button class="btn-secondary" style="margin-top: 0;" @click="router.push('/talapo-itinerario')"><i class="fas fa-wand-magic-sparkles"></i> Turn a route into an itinerary</button>
                <button class="btn-submit" style="margin-top: 0;" @click="router.push('/tours')"><i class="fas fa-route"></i> New Tours route</button>
              </div>
            </div>

            <!-- COMMUNITY -->
            <div v-else-if="panel === 'community'" key="community" class="card-box panel">
              <div class="panel-head"><h2>Talapo Community</h2><button class="link-btn" @click="router.push('/travelers')">Find travelers →</button></div>
              <div class="streak-stats community-stats">
                <div><b>{{ social.followersCount }}</b><span>Followers</span></div>
                <div><b>{{ social.followingCount }}</b><span>Following</span></div>
              </div>
              <label class="public-toggle">
                <input type="checkbox" :checked="passport.profile?.is_public ?? true" :disabled="savingPublic" @change="togglePublic">
                <span class="switch"></span>
                <span><b>Public profile</b><small>Other travelers can see your name, photo, streak and visited places. Your passport number and birth date are never shown.</small></span>
              </label>
              <div class="actions-row" style="margin-top: 14px;">
                <button class="btn-secondary" style="margin-top: 0;" @click="router.push({ path: '/travelers', query: { tab: 'followers' } })"><i class="fas fa-users"></i> My followers</button>
                <button class="btn-submit" style="margin-top: 0;" :disabled="!(passport.profile?.is_public ?? true)" @click="router.push(`/travelers/${passport.profile.id}`)"><i class="fas fa-id-card"></i> View my public profile</button>
              </div>
            </div>

            <!-- CONTESTS -->
            <div v-else key="contests" class="card-box panel">
              <div class="panel-head"><h2>Talapo Contests</h2></div>
              <ul v-if="contests.entries.length" class="panel-list">
                <li v-for="e in contests.entries" :key="e.id">
                  <span class="emoji">{{ challengeEmoji(e.challenge) }}</span>
                  <div><b>{{ challengeName(e.challenge) }}</b><small>{{ e.institution }} · {{ e.grade }} · {{ e.status }}</small></div>
                  <span class="score">{{ e.score }} pts</span>
                </li>
              </ul>
              <p v-else class="panel-note">You haven't joined any contest yet.</p>
              <div class="actions-row" style="margin-top: 14px;">
                <button class="btn-submit" style="margin-top: 0;" @click="router.push('/contests')"><i class="fas fa-trophy"></i> Join Talapo Contests</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </div>
    <!-- Input oculto para subir fotos de los lugares de visita -->
    <input ref="placeInput" type="file" accept="image/*" class="hidden" @change="onPlacePhoto">
  </div>
</template>

<style scoped>
/* El fondo de pasaporte.css estaba en <body>; aquí va en la página */
.pg-passport { min-height: calc(100vh - 80px); display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px 80px; }
.loading-note { color: #fff; font-weight: 600; }
.book-area { width: 100%; display: flex; flex-direction: column; align-items: center; }
.actions-row { width: 100%; max-width: 860px; display: flex; gap: 15px; margin-top: 15px; }
.actions-row > * { flex: 1; }

/* Panel del perfil: mismos colores, radios y tipografía del pasaporte */
.panel-tabs { width: 100%; max-width: 860px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 28px; }
.panel-tabs button { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.28); color: #e2e8f0; border-radius: 16px; padding: 12px 8px; cursor: pointer; display: grid; justify-items: center; gap: 2px; font-family: 'Inter', sans-serif; backdrop-filter: blur(6px); transition: background .25s, transform .25s, color .25s; }
.panel-tabs button:hover { transform: translateY(-3px); background: rgba(255,255,255,.2); }
.panel-tabs button.on { background: #ffffff; color: #0f172a; box-shadow: 0 14px 30px -14px rgba(0,0,0,.5); }
.tab-emoji { font-size: 1.3rem; line-height: 1; }
.tab-num { font-size: 1.5rem; font-weight: 800; line-height: 1.1; }
.tab-label { font-size: .8rem; font-weight: 600; opacity: .9; }
.panel { width: 100%; max-width: 860px !important; margin-top: 14px; }
.panel-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.panel-head h2 { margin-bottom: 14px; }
.link-btn { background: none; border: 0; color: #2563eb; font-weight: 700; cursor: pointer; font-size: 13px; }

.streak-hero { display: grid; grid-template-columns: auto 1fr; gap: 22px; align-items: center; margin-bottom: 18px; }
.flame { width: 150px; height: 150px; border-radius: 50%; display: grid; place-content: center; justify-items: center; background: radial-gradient(circle at 50% 40%, #fff7e6, #ffe2b3 60%, #fcd28a); box-shadow: inset 0 -6px 18px rgba(245,158,11,.25), 0 16px 30px -16px rgba(245,158,11,.6); }
.flame:not(.lit) { filter: grayscale(1); opacity: .7; }
.flame-emoji { font-size: 2.2rem; line-height: 1; }
.flame.lit .flame-emoji { animation: flicker 1.6s ease-in-out infinite; }
.flame-num { font-size: 2.6rem; font-weight: 900; color: #9a3412; line-height: 1; }
.flame-label { font-size: 12px; font-weight: 700; color: #9a3412; text-transform: uppercase; letter-spacing: .5px; }
.streak-text h2 { text-align: left; margin-bottom: 6px; }
.streak-text > p { font-size: 14px; color: #475569; margin: 0 0 14px; }
.streak-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.streak-stats div { background: #f1f5f9; border-radius: 12px; padding: 10px 8px; text-align: center; }
.streak-stats b { display: block; font-size: 1.4rem; color: #1e3a8a; }
.streak-stats span { font-size: 11px; color: #64748b; line-height: 1.2; display: block; }
.cal { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; }
.cal-head { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 10px; }
.legend { display: inline-flex; align-items: center; gap: 5px; font-weight: 500; }
.legend i { width: 11px; height: 11px; border-radius: 3px; background: #e2e8f0; display: inline-block; margin-left: 6px; }
.legend i.on { background: #f59e0b; }
.cal-body { display: flex; gap: 8px; overflow-x: auto; }
.cal-days { display: grid; grid-template-rows: repeat(7, 14px); gap: 4px; font-size: 10px; color: #94a3b8; }
.heatmap { display: grid; grid-template-rows: repeat(7, 14px); grid-auto-flow: column; grid-auto-columns: 14px; gap: 4px; }
.heatmap span { border-radius: 4px; background: #e2e8f0; transition: transform .2s; }
.heatmap span:hover { transform: scale(1.25); }
.heatmap span.on { background: #f59e0b; }
.heatmap span.today { outline: 2px solid #1e3a8a; outline-offset: 1px; }
.heatmap span.pad { background: transparent; }
.panel-note { font-size: 13px; color: #64748b; margin: 6px 0 0; }
.panel-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.panel-list li { display: flex; align-items: center; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; color: #0f172a; transition: transform .2s, box-shadow .2s; }
.panel-list li:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -14px rgba(15,23,42,.4); }
.panel-list .emoji { font-size: 1.3rem; }
.panel-list small { display: block; color: #64748b; font-size: 12px; }
.panel-list .score, .panel-list .open { margin-left: auto; font-weight: 700; color: #2563eb; text-decoration: none; font-size: 13px; white-space: nowrap; }
/* Comunidad */
.community-stats { grid-template-columns: repeat(2, 1fr) !important; margin-bottom: 14px; }
.public-toggle { display: flex; gap: 12px; align-items: flex-start; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; cursor: pointer; color: #0f172a; }
.public-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.public-toggle .switch { flex: 0 0 44px; height: 24px; border-radius: 20px; background: #cbd5e1; position: relative; transition: background .2s; margin-top: 2px; }
.public-toggle .switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
.public-toggle input:checked + .switch { background: #1C6E6B; }
.public-toggle input:checked + .switch::after { transform: translateX(20px); }
.public-toggle b { display: block; font-size: 14px; }
.public-toggle small { color: #64748b; font-size: 12px; line-height: 1.4; }
@keyframes flicker { 0%, 100% { transform: scale(1) rotate(-3deg); } 50% { transform: scale(1.12) rotate(3deg); } }

/* Transiciones */
.flip-enter-active, .flip-leave-active { transition: opacity .3s ease, transform .35s cubic-bezier(.2,.7,.2,1); }
.flip-enter-from { opacity: 0; transform: translateY(16px) scale(.98); }
.flip-leave-to { opacity: 0; transform: translateY(-8px); }
.stamp-enter-active { transition: opacity .35s ease, transform .35s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.stamp-enter-from { opacity: 0; transform: scale(.8) rotate(-4deg); }
.stamp-move { transition: transform .3s ease; }

@media (max-width: 640px) {
  .panel-tabs { grid-template-columns: repeat(3, 1fr); }
  .streak-hero { grid-template-columns: 1fr; justify-items: center; }
  .streak-text h2, .streak-text > p { text-align: center; }
  .streak-stats { grid-template-columns: repeat(2, 1fr); }
  .actions-row { flex-direction: column; }
}
</style>
