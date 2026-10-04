<script setup>
// Usuarios de Talapo: buscar, ocultar/mostrar en la comunidad y (solo la dueña) dar o quitar admin.
import { ref, computed, onMounted, watch } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { useAuthStore } from '@/stores/auth';
import { toast } from '@/composables/useToast';
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

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const isMe = (u) => u.id === auth.user?.id;
onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">TALAPO ADMIN</div>
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
              <RouterLink v-if="u.username && u.is_public" :to="`/travelers/${u.id}`" class="btn-s alt">View profile</RouterLink>
              <button class="btn-s alt" :disabled="busy[u.id]" @click="togglePublic(u)">{{ u.is_public ? 'Hide from community' : 'Show in community' }}</button>
              <button v-if="isOwner && !isMe(u)" class="btn-s" :class="{ danger: u.is_admin }" :disabled="busy[u.id]" @click="toggleAdmin(u)">{{ u.is_admin ? 'Remove admin' : 'Make admin' }}</button>
            </div>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
.who { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin-bottom: .4rem; }
.who b { color: #0A2F44; font-size: 1.05rem; }
.who small { color: #58717f; width: 100%; }
.meta { display: flex; flex-wrap: wrap; gap: .4rem 1.2rem; color: #58717f; font-size: .88rem; margin-bottom: .7rem; }
.meta i { color: #1C6E6B; margin-right: .25rem; }
.actions { display: flex; flex-wrap: wrap; gap: .5rem; }
.actions a { text-decoration: none; display: inline-flex; align-items: center; }
</style>
