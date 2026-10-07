<script setup>
// Anuncios que aparecen como banner en todo el sitio (avisos, eventos, alertas).
import { ref, reactive, computed, onMounted } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { useAuthStore } from '@/stores/auth';
import { toast } from '@/composables/useToast';
import { logAdmin } from '@/composables/useAdminLog';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import '@/styles/pages/admin-extra.css';

const passport = usePassportStore();
const auth = useAuthStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const loading = ref(true);
const saving = ref(false);
const items = ref([]);
const editingId = ref(null);
const LEVELS = [
  { id: 'info', label: 'Information', icon: 'fa-circle-info' },
  { id: 'success', label: 'Good news', icon: 'fa-circle-check' },
  { id: 'warning', label: 'Warning', icon: 'fa-triangle-exclamation' },
  { id: 'urgent', label: 'Urgent', icon: 'fa-bullhorn' },
];
const empty = () => ({ message: '', level: 'info', link_url: '', link_label: '', ends_at: '', active: true });
const form = reactive(empty());

async function load() {
  loading.value = true;
  try {
    items.value = await unwrap(insforge.database.from('announcements').select('*').order('created_at', { ascending: false }).limit(100));
  } catch (e) {
    toast(/announcements|relation|does not exist/i.test(e.message) ? 'Run the migration 20260930010000_admin-tools-2.sql in InsForge first.' : e.message, 'error');
  } finally { loading.value = false; }
}

const live = (a) => a.active && new Date(a.starts_at) <= new Date() && (!a.ends_at || new Date(a.ends_at) > new Date());
const fmt = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
// <input type="datetime-local"> usa la hora local
const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

async function save() {
  const message = form.message.trim();
  if (message.length < 3) { toast('Write the announcement text', 'error'); return; }
  const link = form.link_url.trim();
  if (link && !(/^https?:\/\//i.test(link) || (link.startsWith('/') && !link.startsWith('//')))) { toast('The link must start with https:// or /', 'error'); return; }
  saving.value = true;
  const row = {
    message, level: form.level, active: form.active,
    link_url: link || null, link_label: link ? (form.link_label.trim() || null) : null,
    ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
  };
  try {
    if (editingId.value) {
      await unwrap(insforge.database.from('announcements').update(row).eq('id', editingId.value));
      logAdmin('announcement.edit', 'announcement', editingId.value, { message });
    } else {
      const rows = await unwrap(insforge.database.from('announcements').insert([{ ...row, created_by: auth.user.id }]).select());
      logAdmin('announcement.create', 'announcement', rows?.[0]?.id, { message });
    }
    toast(form.active ? 'Announcement published' : 'Saved as inactive');
    cancel(); await load();
  } catch (e) { toast(e.message, 'error'); }
  finally { saving.value = false; }
}
function edit(a) {
  editingId.value = a.id;
  Object.assign(form, { message: a.message, level: a.level, link_url: a.link_url || '', link_label: a.link_label || '', ends_at: toLocalInput(a.ends_at), active: a.active });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function cancel() { editingId.value = null; Object.assign(form, empty()); }
async function toggle(a) {
  try {
    await unwrap(insforge.database.from('announcements').update({ active: !a.active }).eq('id', a.id));
    a.active = !a.active;
    logAdmin(a.active ? 'announcement.activate' : 'announcement.deactivate', 'announcement', a.id, { message: a.message });
    toast(a.active ? 'Announcement is live' : 'Announcement turned off');
  } catch (e) { toast(e.message, 'error'); }
}
async function remove(a) {
  if (!confirm('Delete this announcement?')) return;
  try {
    await unwrap(insforge.database.from('announcements').delete().eq('id', a.id));
    items.value = items.value.filter((x) => x.id !== a.id);
    logAdmin('announcement.delete', 'announcement', a.id, { message: a.message });
    toast('Deleted');
  } catch (e) { toast(e.message, 'error'); }
}
onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin" data-admin="announcements">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
        <h1>Announcements</h1>
        <p>Show a message at the top of every page: events, schedule changes, service notices or urgent alerts.</p>
      </div>
    </section>

    <div class="content">
      <p v-if="!passport.loaded" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
      <div v-else-if="!isAdmin" class="box"><h2><i class="fas fa-lock"></i> Admins only</h2></div>
      <template v-else>
        <AdminTabs />

        <div class="box form">
          <h2>{{ editingId ? 'Edit announcement' : 'New announcement' }}</h2>
          <label class="f">Message
            <textarea v-model="form.message" rows="2" maxlength="300" placeholder="e.g. The Talapo Stand in Parque Libertad is open this Saturday from 9 am."></textarea>
            <small>{{ form.message.length }}/300</small>
          </label>
          <div class="grid2">
            <label class="f">Type
              <select v-model="form.level"><option v-for="l in LEVELS" :key="l.id" :value="l.id">{{ l.label }}</option></select>
            </label>
            <label class="f">Stops showing on (optional)
              <input v-model="form.ends_at" type="datetime-local" />
            </label>
            <label class="f">Link (optional)
              <input v-model="form.link_url" type="text" placeholder="https://… or /contests" />
            </label>
            <label class="f">Link text
              <input v-model="form.link_label" type="text" maxlength="40" placeholder="Learn more" :disabled="!form.link_url" />
            </label>
          </div>
          <label class="chk"><input v-model="form.active" type="checkbox" /> Show it now</label>

          <p class="prev-title">Preview</p>
          <div class="prev" :class="form.level">
            <i class="fas" :class="LEVELS.find((l) => l.id === form.level).icon"></i>
            <span>{{ form.message || 'Your message will look like this.' }}</span>
            <u v-if="form.link_url">{{ form.link_label || 'Learn more' }}</u>
          </div>

          <div class="btns">
            <button class="btn-s" :disabled="saving" @click="save">{{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish' }}</button>
            <button v-if="editingId" class="btn-s alt" @click="cancel">Cancel</button>
          </div>
        </div>

        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
        <p v-else-if="!items.length" class="note">No announcements yet.</p>
        <ul v-else class="list">
          <li v-for="a in items" :key="a.id" class="row" :class="live(a) ? '' : 'done'">
            <div class="top">
              <span class="chip" :class="a.level === 'urgent' ? 'high' : a.level === 'warning' ? 'medium' : ''">{{ LEVELS.find((l) => l.id === a.level)?.label }}</span>
              <span class="chip" :class="live(a) ? '' : 'medium'">{{ live(a) ? 'Live now' : (a.active ? 'Expired' : 'Off') }}</span>
              <small class="when">Created {{ fmt(a.created_at) }}<span v-if="a.ends_at"> · ends {{ fmt(a.ends_at) }}</span></small>
            </div>
            <p class="msg">{{ a.message }}</p>
            <div class="btns">
              <button class="btn-s alt" @click="edit(a)">Edit</button>
              <button class="btn-s alt" @click="toggle(a)">{{ a.active ? 'Turn off' : 'Turn on' }}</button>
              <button class="btn-s danger" aria-label="Delete announcement" @click="remove(a)"><i class="fas fa-trash"></i></button>
            </div>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
.form { margin-bottom: 1.2rem; display: grid; gap: .8rem; }
.f { display: grid; gap: .25rem; font-size: .8rem; font-weight: 700; color: #58717f; }
.f textarea, .f input, .f select { font: inherit; font-size: .95rem; font-weight: 400; padding: .6rem .8rem; border: 1.5px solid #dce7ea; border-radius: 12px; background: #fff; color: #0A2F44; min-height: 44px; }
.f small { font-weight: 400; color: #8aa0ab; justify-self: end; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; }
.chk { display: flex; align-items: center; gap: .5rem; font-weight: 700; color: #0A2F44; }
.prev-title { margin: .2rem 0 0; font-size: .8rem; font-weight: 700; color: #58717f; }
.prev { display: flex; align-items: center; gap: .6rem; padding: .7rem 1rem; border-radius: 12px; color: #fff; background: #0A2F44; font-weight: 600; font-size: .92rem; }
.prev.success { background: #166534; } .prev.warning { background: #8a5a00; } .prev.urgent { background: #b4432f; }
.btns { display: flex; flex-wrap: wrap; gap: .5rem; }
.top { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
.when { margin-left: auto; color: #58717f; }
.msg { margin: .6rem 0; color: #0A2F44; }
@media (max-width: 700px) { .grid2 { grid-template-columns: 1fr; } .when { margin-left: 0; width: 100%; } }
</style>
