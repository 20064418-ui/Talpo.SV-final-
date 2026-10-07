<script setup>
// Ajustes del sitio y editor del INICIO (destinos, reseñas y números) sin tocar el HTML.
import { ref, reactive, computed, onMounted } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { useAuthStore } from '@/stores/auth';
import { toast } from '@/composables/useToast';
import { logAdmin } from '@/composables/useAdminLog';
import { getSiteContent, saveSiteContent, DEFAULT_SETTINGS } from '@/lib/siteContent';
import { HOME_DEFAULTS } from '@/data/homeDefaults';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import '@/styles/pages/admin-extra.css';

const passport = usePassportStore();
const auth = useAuthStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const loading = ref(true);
const missing = ref(false);
const view = ref('home');
const saving = ref(false);
const settings = reactive({ ...DEFAULT_SETTINGS });
const clone = (x) => JSON.parse(JSON.stringify(x));
const home = reactive(clone(HOME_DEFAULTS));
const homeSaved = ref(false);     // ¿ya hay contenido guardado en la base?
const uploading = ref(-1);

async function load() {
  loading.value = true;
  try {
    const { error } = await insforge.database.from('site_content').select('key').limit(1);
    if (error) throw new Error(error.message);
    const [s, h] = await Promise.all([getSiteContent('settings', { fresh: true }), getSiteContent('home', { fresh: true })]);
    Object.assign(settings, DEFAULT_SETTINGS, s || {});
    if (h) { Object.assign(home, clone(HOME_DEFAULTS), h); homeSaved.value = true; }
  } catch (e) {
    if (/site_content|does not exist|relation/i.test(e.message)) missing.value = true; else toast(e.message, 'error');
  } finally { loading.value = false; }
}

async function saveSettings() {
  saving.value = true;
  try {
    await saveSiteContent('settings', { ...settings, auto_reply: settings.auto_reply.trim().slice(0, 300) }, auth.user.id);
    logAdmin('site.settings', 'site', 'settings', { ...settings });
    toast('Settings saved');
  } catch (e) { toast(e.message, 'error'); }
  finally { saving.value = false; }
}

/* ---------- Inicio ---------- */
function validHome() {
  if (home.places.some((p) => !p.name.trim() || !p.image.trim())) { toast('Every destination needs a name and a photo', 'error'); return false; }
  if (home.testimonials.some((t) => !t.name.trim() || !t.text.trim())) { toast('Every review needs a name and a text', 'error'); return false; }
  return true;
}
async function saveHome() {
  if (!validHome()) return;
  saving.value = true;
  try {
    const value = clone(home);
    value.places.forEach((p) => { p.location = p.location?.trim() || `${p.region}, El Salvador`; });
    await saveSiteContent('home', value, auth.user.id);
    homeSaved.value = true;
    logAdmin('site.home', 'site', 'home', { places: value.places.length, testimonials: value.testimonials.length });
    toast('Homepage updated — open the home page to see it');
  } catch (e) { toast(e.message, 'error'); }
  finally { saving.value = false; }
}
async function resetHome() {
  if (!confirm('Go back to the original homepage content? Your edits will be removed.')) return;
  try {
    await unwrap(insforge.database.from('site_content').delete().eq('key', 'home'));
    Object.assign(home, clone(HOME_DEFAULTS)); homeSaved.value = false;
    logAdmin('site.home_reset', 'site', 'home');
    toast('Homepage restored to the original');
  } catch (e) { toast(e.message, 'error'); }
}
const move = (list, i, d) => { const j = i + d; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; };
const addPlace = () => home.places.push({ name: '', image: '', region: '', rating: '4.8', short: '', description: '', location: '' });
const addReview = () => home.testimonials.push({ name: '', title: '', stars: 5, text: '' });

function compress(file, max = 1400) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => resolve(b ? new File([b], 'photo.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', 0.82);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
async function uploadPhoto(e, p, i) {
  const f = e.target.files[0]; e.target.value = '';
  if (!f || !f.type.startsWith('image/')) return;
  uploading.value = i;
  try {
    const small = await compress(f);
    const data = await unwrap(insforge.storage.from('news-images').upload(`site/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`, small));
    p.image = data.url;
  } catch (err) { toast(/bucket/i.test(err.message) ? 'Missing storage bucket "news-images".' : err.message, 'error'); }
  finally { uploading.value = -1; }
}

onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin" data-admin="site">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
        <h1>Site</h1>
        <p>Edit the home page and turn site features on or off — no code needed.</p>
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
          <p class="note">Run <b>migrations/20261006010000_messages-site-coupons.sql</b> in the InsForge SQL Editor, then refresh.</p>
        </div>
        <template v-else>
          <div class="seg">
            <button :class="{ on: view === 'home' }" @click="view = 'home'"><i class="fas fa-house"></i> Home page</button>
            <button :class="{ on: view === 'settings' }" @click="view = 'settings'"><i class="fas fa-sliders"></i> Settings</button>
          </div>

          <!-- AJUSTES -->
          <div v-if="view === 'settings'" class="box form">
            <h2>Site settings</h2>
            <label class="sw"><input v-model="settings.plan_requests_open" type="checkbox" /><span><b>Accept travel pass requests</b><small>Turn off to pause new requests on /planes (e.g. holidays or fully booked).</small></span></label>
            <label class="sw"><input v-model="settings.messages_open" type="checkbox" /><span><b>Users can start new messages</b><small>Existing conversations keep working.</small></span></label>
            <label class="f">Automatic reply (shown after a user's first message)
              <textarea v-model="settings.auto_reply" rows="2" maxlength="300"></textarea>
            </label>
            <div class="btns"><button class="btn-s" :disabled="saving" @click="saveSettings">{{ saving ? 'Saving…' : 'Save settings' }}</button></div>
          </div>

          <!-- INICIO -->
          <template v-else>
            <p class="note state">
              <i class="fas" :class="homeSaved ? 'fa-circle-check' : 'fa-circle-info'"></i>
              {{ homeSaved ? 'The home page is showing your edited content.' : 'The home page is showing its original content. Edit below and save to change it.' }}
              <a href="/" target="_blank" rel="noopener">Open home page <i class="fas fa-arrow-up-right-from-square"></i></a>
            </p>

            <div class="box">
              <h2>Numbers under the title</h2>
              <div class="grid3">
                <div v-for="(s, i) in home.stats" :key="i" class="stat-ed">
                  <input v-model="s.number" maxlength="10" placeholder="12K+" class="big" />
                  <input v-model="s.label" maxlength="30" placeholder="Happy Travelers" />
                </div>
              </div>
            </div>

            <div class="box">
              <h2>Most visited destinations <small>{{ home.places.length }}</small></h2>
              <div v-for="(p, i) in home.places" :key="i" class="ed">
                <div class="ph">
                  <img v-if="p.image" :src="p.image" alt="" />
                  <label class="up"><input type="file" accept="image/*" hidden @change="uploadPhoto($event, p, i)" /><i class="fas" :class="uploading === i ? 'fa-spinner fa-spin' : 'fa-camera'"></i> {{ p.image ? 'Change' : 'Photo' }}</label>
                </div>
                <div class="fields">
                  <div class="grid3">
                    <label class="f">Name<input v-model="p.name" maxlength="50" /></label>
                    <label class="f">Region<input v-model="p.region" maxlength="40" placeholder="Santa Ana" /></label>
                    <label class="f">Rating<input v-model="p.rating" maxlength="4" placeholder="4.9" /></label>
                  </div>
                  <label class="f">Short text (on the card)<input v-model="p.short" maxlength="140" /></label>
                  <label class="f">Full description (when they tap “Explore”)<textarea v-model="p.description" rows="2" maxlength="600"></textarea></label>
                </div>
                <div class="side">
                  <button class="btn-s alt" :disabled="i === 0" aria-label="Move up" @click="move(home.places, i, -1)"><i class="fas fa-arrow-up"></i></button>
                  <button class="btn-s alt" :disabled="i === home.places.length - 1" aria-label="Move down" @click="move(home.places, i, 1)"><i class="fas fa-arrow-down"></i></button>
                  <button class="btn-s danger" aria-label="Remove" @click="home.places.splice(i, 1)"><i class="fas fa-trash"></i></button>
                </div>
              </div>
              <button v-if="home.places.length < 8" class="btn-s alt" @click="addPlace"><i class="fas fa-plus"></i> Add destination</button>
            </div>

            <div class="box">
              <h2>Traveler reviews <small>{{ home.testimonials.length }}</small></h2>
              <div v-for="(t, i) in home.testimonials" :key="i" class="ed rev">
                <div class="fields">
                  <div class="grid3">
                    <label class="f">Name<input v-model="t.name" maxlength="40" /></label>
                    <label class="f">From / title<input v-model="t.title" maxlength="40" placeholder="San Salvador" /></label>
                    <label class="f">Stars
                      <select v-model.number="t.stars"><option v-for="n in [5, 4.5, 4, 3.5, 3]" :key="n" :value="n">{{ n }} ★</option></select>
                    </label>
                  </div>
                  <label class="f">Review<textarea v-model="t.text" rows="2" maxlength="400"></textarea></label>
                </div>
                <div class="side">
                  <button class="btn-s alt" :disabled="i === 0" aria-label="Move up" @click="move(home.testimonials, i, -1)"><i class="fas fa-arrow-up"></i></button>
                  <button class="btn-s alt" :disabled="i === home.testimonials.length - 1" aria-label="Move down" @click="move(home.testimonials, i, 1)"><i class="fas fa-arrow-down"></i></button>
                  <button class="btn-s danger" aria-label="Remove" @click="home.testimonials.splice(i, 1)"><i class="fas fa-trash"></i></button>
                </div>
              </div>
              <button v-if="home.testimonials.length < 8" class="btn-s alt" @click="addReview"><i class="fas fa-plus"></i> Add review</button>
            </div>

            <div class="savebar">
              <button class="btn-s" :disabled="saving" @click="saveHome">{{ saving ? 'Saving…' : 'Save home page' }}</button>
              <button v-if="homeSaved" class="btn-s alt" @click="resetHome">Restore original</button>
            </div>
          </template>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.seg { display: inline-flex; background: #fff; border: 1px solid #dce7ea; border-radius: 30px; padding: 3px; margin-bottom: 1rem; }
.seg button { border: 0; background: none; padding: .5rem 1rem; border-radius: 30px; font: inherit; font-weight: 700; color: #58717f; cursor: pointer; min-height: 40px; display: inline-flex; gap: .4rem; align-items: center; }
.seg button.on { background: #1C6E6B; color: #fff; }
.box { margin-bottom: 1rem; }
.box h2 small { font-size: .8rem; color: #8aa0ab; font-weight: 600; }
.form { display: grid; gap: 1rem; }
.sw { display: flex; gap: .8rem; align-items: flex-start; cursor: pointer; color: #0A2F44; }
.sw input { width: 20px; height: 20px; margin-top: .15rem; accent-color: #1C6E6B; flex: 0 0 auto; }
.sw small { display: block; color: #58717f; }
.f { display: grid; gap: .25rem; font-size: .78rem; font-weight: 700; color: #58717f; }
.f input, .f textarea, .f select, .stat-ed input { font: inherit; font-size: .93rem; font-weight: 400; padding: .55rem .75rem; border: 1.5px solid #dce7ea; border-radius: 12px; background: #fff; color: #0A2F44; min-height: 42px; min-width: 0; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: .7rem; }
.stat-ed { display: grid; gap: .4rem; } .stat-ed .big { font-size: 1.4rem; font-weight: 800; }
.ed { display: grid; grid-template-columns: 150px 1fr auto; gap: 1rem; padding: 1rem 0; border-top: 1px solid #eef3f5; }
.ed.rev { grid-template-columns: 1fr auto; }
.ph { position: relative; height: 150px; border-radius: 14px; background: #EEF6F6; overflow: hidden; display: grid; place-items: center; }
.ph img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.up { position: relative; background: rgba(10,47,68,.8); color: #fff; font-size: .8rem; font-weight: 700; padding: .4rem .8rem; border-radius: 20px; cursor: pointer; align-self: end; margin-bottom: .6rem; }
.fields { display: grid; gap: .6rem; min-width: 0; }
.side { display: flex; flex-direction: column; gap: .4rem; }
.state { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; background: #fff; padding: .8rem 1rem; border-radius: 14px; margin: 0 0 1rem; }
.state a { margin-left: auto; color: #1C6E6B; font-weight: 700; }
.savebar { position: sticky; bottom: 0; display: flex; gap: .6rem; padding: .8rem 0; background: linear-gradient(transparent, #F8FBFE 30%); z-index: 2; }
.btns { display: flex; gap: .5rem; }
@media (max-width: 760px) {
  .ed { grid-template-columns: 1fr; } .ed.rev { grid-template-columns: 1fr; }
  .side { flex-direction: row; } .grid3 { grid-template-columns: 1fr; }
  .state a { margin-left: 0; }
}
</style>
