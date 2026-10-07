<script setup>
// Usuarios de Talapo: buscar, ocultar/mostrar en la comunidad y (solo la dueña) dar o quitar admin.
import { ref, computed, onMounted, watch } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { useAuthStore } from '@/stores/auth';
import { toast } from '@/composables/useToast';
import { stands } from '@/data/stands';
import { downloadCsv } from '@/lib/csv';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import '@/styles/pages/admin-extra.css';

const OWNER = 'rocio.calderon';
const passport = usePassportStore();
const auth = useAuthStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const isOwner = computed(() => isAdmin.value && passport.profile?.username === OWNER);
const loading = ref(true);
const users = ref([]);
const q = ref('');
const busy = ref({});
let timer;

async function load() {
  loading.value = true;
  try {
    const data = await unwrap(insforge.database.rpc('admin_list_users', { p_search: q.value.trim() || null, p_limit: 200 }));
    users.value = data || [];
  } catch (e) {
    toast(/admin_list_users/.test(e.message) ? 'Run the migration 20260930000000_admin-tools.sql in InsForge first.' : e.message, 'error');
  } finally { loading.value = false; }
}
watch(q, () => { clearTimeout(timer); timer = setTimeout(load, 300); });

async function run(u, fn, args, apply, okMsg) {
  busy.value[u.id] = true;
  try { await unwrap(insforge.database.rpc(fn, args)); apply(); toast(okMsg); }
  catch (e) { toast(e.message, 'error'); }
  finally { busy.value[u.id] = false; }
}
const togglePublic = (u) => run(u, 'admin_set_public', { p_user: u.id, p_value: !u.is_public }, () => { u.is_public = !u.is_public; }, u.is_public ? 'Profile hidden from the community' : 'Profile visible again');
function toggleAdmin(u) {
  const make = !u.is_admin;
  if (!confirm(make ? `Give admin access to @${u.username || u.display_name}?` : `Remove admin access from @${u.username || u.display_name}?`)) return;
  run(u, 'admin_set_admin', { p_user: u.id, p_value: make }, () => { u.is_admin = make; }, make ? 'Now an administrator' : 'Admin access removed');
}

/* ---------- Ficha del usuario ---------- */
const sel = ref(null);          // usuario abierto
const detail = ref(null);
const detailLoading = ref(false);
const note = ref('');
const standToAdd = ref('');
const standList = Object.values(stands);

async function openUser(u) {
  sel.value = u; detail.value = null; detailLoading.value = true; standToAdd.value = standList[0]?.id || '';
  try {
    const d = await unwrap(insforge.database.rpc('admin_user_detail', { p_user: u.id }));
    detail.value = Array.isArray(d) ? d[0] : d;
    note.value = detail.value?.note || '';
  } catch (e) {
    toast(/admin_user_detail/.test(e.message) ? 'Run the migration 20260930010000_admin-tools-2.sql in InsForge first.' : e.message, 'error');
    sel.value = null;
  } finally { detailLoading.value = false; }
}
function closeUser() { sel.value = null; detail.value = null; }
async function saveNote() {
  try { await unwrap(insforge.database.rpc('admin_save_user_note', { p_user: sel.value.id, p_note: note.value })); detail.value.note = note.value.trim() || null; toast('Note saved'); }
  catch (e) { toast(e.message, 'error'); }
}
async function addStamp() {
  if (!standToAdd.value) return;
  try {
    await unwrap(insforge.database.rpc('admin_add_stamp', { p_user: sel.value.id, p_stand: standToAdd.value }));
    toast('Stamp added'); sel.value.stamps = Number(sel.value.stamps) + 1; await openUser(sel.value);
  } catch (e) { toast(e.message, 'error'); }
}
async function removeStamp(st) {
  if (!confirm(`Remove the "${st.place_name}" stamp?`)) return;
  try {
    await unwrap(insforge.database.rpc('admin_remove_stamp', { p_stamp: st.id }));
    detail.value.stamps = detail.value.stamps.filter((x) => x.id !== st.id);
    sel.value.stamps = Math.max(0, Number(sel.value.stamps) - 1);
    toast('Stamp removed');
  } catch (e) { toast(e.message, 'error'); }
}

function exportCsv() {
  downloadCsv('talapo-users', users.value, [
    { label: 'Username', key: 'username' }, { label: 'Name', key: 'display_name' }, { label: 'Nationality', key: 'nationality' },
    { label: 'Passport', key: 'passport_number' }, { label: 'Joined', value: (u) => u.joined_at ? new Date(u.joined_at).toISOString().slice(0, 10) : '' },
    { label: 'Stamps', key: 'stamps' }, { label: 'Current streak', key: 'current_streak' }, { label: 'Stand reports', key: 'reports' },
    { label: 'Public profile', value: (u) => (u.is_public ? 'yes' : 'no') }, { label: 'Admin', value: (u) => (u.is_admin ? 'yes' : 'no') },
  ]);
}
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const isMe = (u) => u.id === auth.user?.id;
onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin" data-admin="users">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
        <h1>Users</h1>
        <p>Find travelers, manage their visibility in the community{{ isOwner ? ' and choose who is an administrator.' : '.' }}</p>
      </div>
    </section>

    <div class="content">
      <p v-if="!passport.loaded" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
      <div v-else-if="!isAdmin" class="box"><h2><i class="fas fa-lock"></i> Admins only</h2></div>
      <template v-else>
        <AdminTabs />
        <div class="filters box">
          <input v-model="q" type="search" placeholder="Search @username, name or passport number…" aria-label="Search users" />
          <button class="btn-s alt" :disabled="!users.length" @click="exportCsv"><i class="fas fa-file-csv"></i> Export CSV</button>
        </div>
        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading users…</p>
        <p v-else-if="!users.length" class="note">No users found.</p>
        <ul v-else class="list">
          <li v-for="u in users" :key="u.id" class="row user">
            <div class="who">
              <b>{{ u.username ? '@' + u.username : (u.display_name || 'No name yet') }}</b>
              <span v-if="u.is_admin" class="chip admin"><i class="fas fa-user-shield"></i> Admin</span>
              <span v-if="!u.is_public" class="chip"><i class="fas fa-eye-slash"></i> Hidden</span>
              <small>{{ u.display_name }}<span v-if="u.nationality"> · {{ u.nationality }}</span></small>
            </div>
            <div class="meta">
              <span><i class="fas fa-passport"></i> {{ u.passport_number || 'No passport' }}</span>
              <span><i class="fas fa-stamp"></i> {{ u.stamps }} stamps</span>
              <span><i class="fas fa-fire"></i> {{ u.current_streak }} streak</span>
              <span><i class="fas fa-clipboard-list"></i> {{ u.reports }} reports</span>
              <span><i class="fas fa-calendar"></i> Joined {{ fmt(u.joined_at) }}</span>
            </div>
            <div class="actions">
              <button class="btn-s" @click="openUser(u)"><i class="fas fa-id-card"></i> Manage</button>
              <RouterLink v-if="u.username && u.is_public" :to="`/travelers/${u.id}`" class="btn-s alt">View profile</RouterLink>
              <button class="btn-s alt" :disabled="busy[u.id]" @click="togglePublic(u)">{{ u.is_public ? 'Hide from community' : 'Show in community' }}</button>
              <button v-if="isOwner && !isMe(u)" class="btn-s" :class="{ danger: u.is_admin }" :disabled="busy[u.id]" @click="toggleAdmin(u)">{{ u.is_admin ? 'Remove admin' : 'Make admin' }}</button>
            </div>
          </li>
        </ul>
      </template>
    </div>

    <Transition name="drawer">
      <div v-if="sel" class="drawer-wrap" @keydown.esc="closeUser">
        <div class="backdrop" @click="closeUser"></div>
        <aside class="drawer" role="dialog" aria-label="Manage user">
          <header>
            <div><h2>{{ sel.username ? '@' + sel.username : (sel.display_name || 'User') }}</h2><small>{{ sel.display_name }}<span v-if="sel.passport_number"> · {{ sel.passport_number }}</span></small></div>
            <button class="x" aria-label="Close" @click="closeUser"><i class="fas fa-xmark"></i></button>
          </header>
          <p v-if="detailLoading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
          <template v-else-if="detail">
            <div class="mini">
              <div><b>{{ detail.stamps.length }}</b><span>Stamps</span></div>
              <div><b>{{ sel.current_streak }}</b><span>Streak</span></div>
              <div><b>{{ detail.longest_streak ?? 0 }}</b><span>Best streak</span></div>
              <div><b>{{ detail.active_days }}</b><span>Active days</span></div>
              <div><b>{{ detail.posts }}</b><span>Forum posts</span></div>
              <div><b>{{ detail.contests }}</b><span>Contests</span></div>
              <div><b>{{ detail.reports }}</b><span>Stand reports</span></div>
            </div>

            <h3>Passport stamps</h3>
            <p v-if="!detail.stamps.length" class="note">No stamps yet.</p>
            <ul class="stamps"><li v-for="st in detail.stamps" :key="st.id"><span>{{ st.place_name }}<small v-if="!st.visited_at"> (not collected)</small></span><button class="btn-s danger" aria-label="Remove stamp" @click="removeStamp(st)"><i class="fas fa-trash"></i></button></li></ul>
            <div class="add">
              <select v-model="standToAdd" aria-label="Stand"><option v-for="s in standList" :key="s.id" :value="s.id">{{ s.name }}, {{ s.city }}</option></select>
              <button class="btn-s alt" @click="addStamp"><i class="fas fa-stamp"></i> Add stamp</button>
            </div>
            <small class="hint">Use this if a stamp was missed because the tablet failed. It is saved in the activity log.</small>

            <h3>Internal note</h3>
            <textarea v-model="note" rows="3" maxlength="1000" placeholder="Only administrators can see this note."></textarea>
            <div class="add"><button class="btn-s" @click="saveNote">Save note</button></div>
          </template>
        </aside>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.drawer-wrap { position: fixed; inset: 0; z-index: 3000; display: flex; justify-content: flex-end; }
.backdrop { position: absolute; inset: 0; background: rgba(10,47,68,.45); }
.drawer { position: relative; width: min(460px, 100%); height: 100%; overflow-y: auto; background: #fff; padding: 1.2rem 1.3rem 2rem; box-shadow: -20px 0 40px rgba(0,32,64,.25); padding-top: calc(1.2rem + env(safe-area-inset-top, 0px)); }
.drawer header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
.drawer h2 { margin: 0; color: #0A2F44; } .drawer h3 { margin: 1.3rem 0 .5rem; color: #0A2F44; font-size: 1rem; }
.x { background: #EEF6F6; border: 0; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; color: #1C6E6B; font-size: 1.1rem; flex: none; }
.mini { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; }
.mini div { background: #F4F9FC; border-radius: 12px; padding: .5rem; text-align: center; }
.mini b { display: block; font-size: 1.25rem; color: #0A2F44; } .mini span { font-size: .7rem; color: #58717f; }
.stamps { list-style: none; margin: 0 0 .7rem; padding: 0; display: grid; gap: .4rem; }
.stamps li { display: flex; align-items: center; justify-content: space-between; gap: .5rem; background: #F4F9FC; border-radius: 12px; padding: .4rem .4rem .4rem .8rem; }
.add { display: flex; flex-wrap: wrap; gap: .5rem; margin: .4rem 0; }
.add select { flex: 1; min-width: 160px; font: inherit; padding: .5rem .7rem; border: 1.5px solid #dce7ea; border-radius: 12px; min-height: 44px; }
.drawer textarea { width: 100%; font: inherit; padding: .6rem .8rem; border: 1.5px solid #dce7ea; border-radius: 12px; resize: vertical; }
.hint { color: #8aa0ab; display: block; margin-top: .3rem; }
.drawer-enter-active, .drawer-leave-active { transition: opacity .25s; } .drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform .3s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; } .drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(100%); }
.who { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin-bottom: .4rem; }
.who b { color: #0A2F44; font-size: 1.05rem; }
.who small { color: #58717f; width: 100%; }
.meta { display: flex; flex-wrap: wrap; gap: .4rem 1.2rem; color: #58717f; font-size: .88rem; margin-bottom: .7rem; }
.meta i { color: #1C6E6B; margin-right: .25rem; }
.actions { display: flex; flex-wrap: wrap; gap: .5rem; }
.actions a { text-decoration: none; display: inline-flex; align-items: center; }
</style>
