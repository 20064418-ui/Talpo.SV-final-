<script setup>
// Administración de noticias municipales del Stand (solo administradores).
// Crear, editar, publicar/ocultar y borrar noticias con varias fotos.
import { ref, reactive, computed, onMounted } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { useAuthStore } from '@/stores/auth';
import { stands } from '@/data/stands';
import { toast } from '@/composables/useToast';
import AdminTabs from '@/components/admin/AdminTabs.vue';

const passport = usePassportStore();
const auth = useAuthStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);

const standList = Object.values(stands);
const news = ref([]);
const loading = ref(true);
const saving = ref(false);
const editingId = ref(null);
const MAX_PHOTOS = 6;
const empty = () => ({ stand_id: standList[0]?.id || 'parque-libertad', title: '', body: '', author: '', images: [], published: true });
const form = reactive(empty());
const uploading = ref(0);
const fileInput = ref(null);

async function load() {
  loading.value = true;
  try {
    news.value = await unwrap(insforge.database.from('municipal_news').select('*').order('created_at', { ascending: false }).limit(200));
  } catch (e) { toast(e.message, 'error'); }
  finally { loading.value = false; }
}

/** Reduce la foto (máx. 1600 px, JPEG) antes de subirla: carga más rápido en la tablet. */
function compress(file, max = 1600) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return resolve(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => resolve(b ? new File([b], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file), 'image/jpeg', 0.85);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

async function addPhotos(e) {
  const files = [...e.target.files].slice(0, MAX_PHOTOS - form.images.length);
  e.target.value = '';
  for (const f of files) {
    if (f.size > 15e6) { toast(`${f.name}: max 15 MB`, 'error'); continue; }
    uploading.value += 1;
    try {
      const small = await compress(f);
      const data = await unwrap(insforge.storage.from('news-images')
        .upload(`${form.stand_id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`, small));
      form.images.push(data.url);
    } catch (err) {
      toast(/bucket/i.test(err.message) ? 'Missing storage bucket "news-images" (see instructions).' : err.message, 'error');
    } finally { uploading.value -= 1; }
  }
}
function removePhoto(i) { form.images.splice(i, 1); }
function makeCover(i) { const [x] = form.images.splice(i, 1); form.images.unshift(x); }

async function save() {
  if (form.title.trim().length < 3 || form.body.trim().length < 3) { toast('Write a title and the news text', 'error'); return; }
  saving.value = true;
  const row = {
    stand_id: form.stand_id, title: form.title.trim(), body: form.body.trim(),
    author: form.author.trim() || null, images: form.images, image_url: form.images[0] || null,
    published: form.published,
  };
  try {
    if (editingId.value) await unwrap(insforge.database.from('municipal_news').update(row).eq('id', editingId.value));
    else await unwrap(insforge.database.from('municipal_news').insert([row]));
    toast(form.published ? 'News published on the stand 📰' : 'Saved as draft');
    cancel();
    await load();
  } catch (e) { toast(e.message, 'error'); }
  finally { saving.value = false; }
}

function edit(n) {
  editingId.value = n.id;
  Object.assign(form, {
    stand_id: n.stand_id, title: n.title, body: n.body, author: n.author || '',
    images: n.images?.length ? [...n.images] : (n.image_url ? [n.image_url] : []), published: n.published,
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function cancel() { editingId.value = null; Object.assign(form, empty()); }

async function togglePublish(n) {
  try {
    await unwrap(insforge.database.from('municipal_news').update({ published: !n.published }).eq('id', n.id));
    n.published = !n.published;
    toast(n.published ? 'Published' : 'Hidden from the stand');
  } catch (e) { toast(e.message, 'error'); }
}
async function remove(n) {
  if (!confirm(`Delete “${n.title}”?`)) return;
  try { await unwrap(insforge.database.from('municipal_news').delete().eq('id', n.id)); news.value = news.value.filter((x) => x.id !== n.id); toast('Deleted'); }
  catch (e) { toast(e.message, 'error'); }
}

const fmt = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
const standName = (id) => { const s = stands[id]; return s ? `${s.name}, ${s.city}` : id; };
onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
        <h1>Talapo Admin</h1>
        <p>Publish the news that people send to <b>avisos.talapo@gmail.com</b>, with photos, on the Talapo Stands.</p>
      </div>
    </section>

    <div class="content">
      <div v-if="!passport.loaded" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</div>

      <div v-else-if="!isAdmin" class="card-box noaccess">
        <h2>🔒 Admins only</h2>
        <p>Your account (<b>@{{ passport.profile?.username || auth.displayName }}</b>) is not an administrator.</p>
        <p class="muted">The Talapo team can give you access from the InsForge Dashboard → SQL Editor:</p>
        <code>update profiles set is_admin = true where username = '{{ passport.profile?.username || 'your.username' }}';</code>
      </div>

      <template v-else>
        <AdminTabs />
        <!-- Formulario -->
        <form class="card-box editor" @submit.prevent="save">
          <h2>{{ editingId ? '✏️ Edit news' : '➕ New news' }}</h2>
          <div class="grid2">
            <label>Stand
              <select v-model="form.stand_id"><option v-for="s in standList" :key="s.id" :value="s.id">{{ s.name }}, {{ s.city }}</option></select>
            </label>
            <label>Author / source <small>(optional)</small>
              <input v-model="form.author" maxlength="80" placeholder="e.g. Alcaldía de Santa Ana" />
            </label>
          </div>
          <label>Title
            <input v-model="form.title" maxlength="160" required placeholder="e.g. Food festival this Saturday" />
          </label>
          <label>News
            <textarea v-model="form.body" rows="6" maxlength="4000" required placeholder="What happened / will happen, date, place…"></textarea>
          </label>

          <div class="photos">
            <div class="photos-head">
              <b>Photos</b> <small>({{ form.images.length }}/{{ MAX_PHOTOS }}) — the first one is the cover</small>
            </div>
            <TransitionGroup name="ph" tag="div" class="thumbs">
              <div v-for="(url, i) in form.images" :key="url" class="thumb" :class="{ cover: i === 0 }">
                <img :src="url" alt="" />
                <span v-if="i === 0" class="tag">Cover</span>
                <div class="thumb-actions">
                  <button v-if="i > 0" type="button" title="Make cover" @click="makeCover(i)">★</button>
                  <button type="button" title="Remove" @click="removePhoto(i)">✕</button>
                </div>
              </div>
              <button v-if="form.images.length < MAX_PHOTOS" key="add" type="button" class="add" :disabled="uploading > 0" @click="fileInput.click()">
                <span v-if="uploading"><i class="fas fa-spinner fa-spin"></i><br>Uploading…</span>
                <span v-else>📷<br>Add photos</span>
              </button>
            </TransitionGroup>
            <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="addPhotos" />
          </div>

          <label class="switch-row">
            <input v-model="form.published" type="checkbox" />
            <span class="sw"></span>
            <span><b>{{ form.published ? 'Published' : 'Draft' }}</b> — {{ form.published ? 'visible on the stand' : 'only admins can see it' }}</span>
          </label>

          <div class="actions">
            <button v-if="editingId" type="button" class="btn ghost" @click="cancel">Cancel</button>
            <button class="btn main" :disabled="saving || uploading > 0">{{ saving ? 'Saving…' : editingId ? 'Save changes' : (form.published ? 'Publish' : 'Save draft') }}</button>
          </div>
        </form>

        <!-- Lista -->
        <h2 class="list-title">All news <small>({{ news.length }})</small></h2>
        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading news…</p>
        <p v-else-if="!news.length" class="note">No news yet. Publish the first one above.</p>
        <TransitionGroup v-else name="ph" tag="ul" class="list">
          <li v-for="n in news" :key="n.id" class="item">
            <img v-if="n.image_url" :src="n.image_url" alt="" class="item-img" />
            <div v-else class="item-img none">📰</div>
            <div class="item-body">
              <div class="chips">
                <span class="chip" :class="n.published ? 'ok' : 'draft'">{{ n.published ? 'Published' : 'Draft' }}</span>
                <span class="chip">{{ standName(n.stand_id) }}</span>
                <span v-if="n.images?.length > 1" class="chip">📷 {{ n.images.length }}</span>
              </div>
              <h3>{{ n.title }}</h3>
              <p>{{ n.body }}</p>
              <small>{{ fmt(n.published_at || n.created_at) }}<template v-if="n.author"> · {{ n.author }}</template></small>
            </div>
            <div class="item-actions">
              <button class="btn sm ghost" @click="edit(n)">Edit</button>
              <button class="btn sm ghost" @click="togglePublish(n)">{{ n.published ? 'Hide' : 'Publish' }}</button>
              <button class="btn sm danger" @click="remove(n)">Delete</button>
            </div>
          </li>
        </TransitionGroup>
      </template>
    </div>
  </div>
</template>

<style scoped>
.admin { font-family: 'Outfit', 'Inter', sans-serif; background: #F8FBFE; min-height: 100vh; }
.hero { background: linear-gradient(rgba(10,47,68,.72), rgba(10,47,68,.85)), url('/assets/img/stand/parksantaana.jpg') center/cover; color: #fff; padding: clamp(2.5rem, 5vw, 4rem) 5%; }
.hero-inner { max-width: 1000px; margin: 0 auto; }
.hero-badge { display: inline-block; background: #0A2F44; font-size: .75rem; font-weight: 700; letter-spacing: 1px; padding: .4rem 1rem; border-radius: 40px; margin-bottom: 1rem; }
.hero h1 { font-size: clamp(2.2rem, 5vw, 3.2rem); font-weight: 800; text-transform: uppercase; margin: 0 0 .4rem; }
.hero p { margin: 0; opacity: .9; max-width: 60ch; }
.content { max-width: 1000px; margin: 0 auto; padding: 2rem 5% 4rem; }
.note { color: #58717f; }
.card-box { background: #fff; border-radius: 24px; padding: 1.5rem; box-shadow: 0 20px 35px -22px rgba(0,32,64,.3); }
.noaccess code { display: block; background: #0f172a; color: #7fd6cd; padding: 12px; border-radius: 12px; font-size: .85rem; overflow-x: auto; }
.muted { color: #58717f; }
.editor h2 { margin-top: 0; color: #0A2F44; }
.editor label { display: grid; gap: .35rem; font-weight: 700; color: #0A2F44; margin-bottom: 1rem; }
.editor small { color: #8aa0ab; font-weight: 500; }
.editor input:not([type=checkbox]), .editor select, .editor textarea { font: inherit; font-weight: 400; padding: .75rem .9rem; border: 1.5px solid #dce7ea; border-radius: 12px; background: #fff; outline: none; }
.editor input:focus, .editor select:focus, .editor textarea:focus { border-color: #1C6E6B; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
.photos { margin-bottom: 1rem; }
.photos-head { margin-bottom: .5rem; color: #0A2F44; }
.thumbs { display: flex; flex-wrap: wrap; gap: .6rem; }
.thumb { position: relative; width: 120px; height: 90px; border-radius: 12px; overflow: hidden; border: 2px solid transparent; }
.thumb.cover { border-color: #E46D5C; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.tag { position: absolute; left: 4px; top: 4px; background: #E46D5C; color: #fff; font-size: .65rem; font-weight: 800; padding: 1px 6px; border-radius: 6px; }
.thumb-actions { position: absolute; right: 4px; top: 4px; display: flex; gap: 3px; }
.thumb-actions button { width: 24px; height: 24px; border-radius: 50%; border: 0; background: rgba(0,0,0,.6); color: #fff; cursor: pointer; font-size: .75rem; }
.add { width: 120px; height: 90px; border-radius: 12px; border: 2px dashed #b9cdd3; background: #f4f8fa; color: #1C6E6B; font: inherit; font-weight: 700; cursor: pointer; }
.switch-row { display: flex !important; align-items: center; gap: .7rem; grid-template-columns: none; font-weight: 500 !important; cursor: pointer; }
.switch-row input { position: absolute; opacity: 0; }
.sw { width: 46px; height: 26px; border-radius: 20px; background: #cbd5e1; position: relative; flex-shrink: 0; transition: background .2s; }
.sw::after { content: ''; position: absolute; left: 3px; top: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .2s; }
.switch-row input:checked + .sw { background: #1C6E6B; }
.switch-row input:checked + .sw::after { transform: translateX(20px); }
.actions { display: flex; gap: .6rem; justify-content: flex-end; }
.btn { border: 0; border-radius: 40px; padding: .75rem 1.4rem; font: inherit; font-weight: 800; cursor: pointer; }
.btn.main { background: #E46D5C; color: #fff; }
.btn.ghost { background: #EEF6F6; color: #1C6E6B; }
.btn.danger { background: #fdecea; color: #b42318; }
.btn.sm { padding: .45rem .9rem; font-size: .85rem; }
.btn:disabled { opacity: .5; cursor: default; }
.list-title { margin: 2rem 0 1rem; color: #0A2F44; }
.list-title small { color: #8aa0ab; font-weight: 600; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: .9rem; }
.item { display: grid; grid-template-columns: 130px 1fr auto; gap: 1rem; align-items: start; background: #fff; border-radius: 20px; padding: 1rem; box-shadow: 0 16px 28px -22px rgba(0,32,64,.35); }
.item-img { width: 130px; height: 100px; object-fit: cover; border-radius: 14px; }
.item-img.none { display: grid; place-items: center; background: #EEF6F6; font-size: 2rem; }
.item-body h3 { margin: .3rem 0; color: #0A2F44; }
.item-body p { margin: 0 0 .3rem; color: #4a6472; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.item-body small { color: #8aa0ab; }
.chips { display: flex; flex-wrap: wrap; gap: .3rem; }
.chip { font-size: .72rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #EEF6F6; color: #1C6E6B; }
.chip.ok { background: #d9f2e3; color: #166534; }
.chip.draft { background: #fff1c2; color: #8a5a00; }
.item-actions { display: grid; gap: .4rem; }
.ph-enter-active, .ph-leave-active { transition: all .25s ease; }
.ph-enter-from, .ph-leave-to { opacity: 0; transform: scale(.95); }
@media (max-width: 700px) { .grid2 { grid-template-columns: 1fr; } .item { grid-template-columns: 1fr; } .item-img { width: 100%; height: 160px; } .item-actions { grid-auto-flow: column; } }
</style>
