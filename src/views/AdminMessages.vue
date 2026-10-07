<script setup>
// Bandeja de mensajes: responder a los usuarios dentro de Talapo.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { toast } from '@/composables/useToast';
import { logAdmin } from '@/composables/useAdminLog';
import AdminTabs from '@/components/admin/AdminTabs.vue';
import ChatThread from '@/components/support/ChatThread.vue';
import '@/styles/pages/admin-extra.css';

const route = useRoute();
const router = useRouter();
const passport = usePassportStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const loading = ref(true);
const missing = ref(false);
const threads = ref([]);
const selId = ref(null);
const filter = ref('open');
const q = ref('');
let timer = null;

const TOPIC = { general: 'General', plans: 'Travel passes', tours: 'Tours', account: 'Account', report: 'Problem', other: 'Other' };
// Respuestas rápidas — EDITA AQUÍ las que más uses
const QUICK = [
  'Hi! Thanks for writing to Talapo. ',
  'We have received your request and an agent is reviewing it.',
  'Could you tell us your travel dates and how many people are traveling?',
  'Your pass is confirmed! 🎉 We will send you the details here.',
  'Is there anything else we can help you with?',
];

const sel = computed(() => threads.value.find((t) => t.id === selId.value));
const unreadTotal = computed(() => threads.value.reduce((t, x) => t + (x.admin_unread || 0), 0));
const shown = computed(() => {
  const s = q.value.trim().toLowerCase();
  return threads.value.filter((t) => {
    if (filter.value === 'open' && t.status !== 'open') return false;
    if (filter.value === 'unread' && !t.admin_unread) return false;
    if (filter.value === 'closed' && t.status !== 'closed') return false;
    if (s && ![t.subject, t.display_name, t.username, t.preview, t.passport_number].some((v) => String(v || '').toLowerCase().includes(s))) return false;
    return true;
  });
});
const name = (t) => t.display_name || (t.username ? '@' + t.username : 'Traveler');
const initials = (t) => name(t).replace('@', '').slice(0, 2).toUpperCase();
const when = (d) => {
  const x = new Date(d); const today = new Date().toDateString() === x.toDateString();
  return today ? x.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

async function load(silent = false) {
  if (!silent) loading.value = true;
  try {
    threads.value = await unwrap(insforge.database.rpc('admin_support_threads', { p_limit: 500 })) || [];
    missing.value = false;
  } catch (e) {
    if (/support|does not exist|function/i.test(e.message)) missing.value = true; else if (!silent) toast(e.message, 'error');
  } finally { loading.value = false; }
}
function open(t) { selId.value = t.id; router.replace({ query: { t: t.id } }); }
function back() { selId.value = null; router.replace({ query: {} }); }
function onRead() { if (sel.value) sel.value.admin_unread = 0; }
function onSent() { if (sel.value) { sel.value.status = 'open'; sel.value.last_from_admin = true; sel.value.last_message_at = new Date().toISOString(); } logAdmin('message.reply', 'thread', selId.value, { subject: sel.value?.subject }); }

async function setStatus(status) {
  const t = sel.value; if (!t) return;
  try {
    await unwrap(insforge.database.from('support_threads').update({ status }).eq('id', t.id));
    t.status = status;
    logAdmin(status === 'closed' ? 'message.close' : 'message.reopen', 'thread', t.id, { subject: t.subject });
    toast(status === 'closed' ? 'Conversation closed' : 'Conversation reopened');
  } catch (e) { toast(e.message, 'error'); }
}
async function remove() {
  const t = sel.value; if (!t || !confirm(`Delete the whole conversation with ${name(t)}?`)) return;
  try {
    await unwrap(insforge.database.from('support_threads').delete().eq('id', t.id));
    threads.value = threads.value.filter((x) => x.id !== t.id);
    logAdmin('message.delete', 'thread', t.id, { subject: t.subject });
    back(); toast('Deleted');
  } catch (e) { toast(e.message, 'error'); }
}

onMounted(async () => {
  await passport.load(true);
  if (!isAdmin.value) { loading.value = false; return; }
  await load();
  if (route.query.t) selId.value = route.query.t;
  timer = setInterval(() => { if (!document.hidden) load(true); }, 15000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="tp admin" data-admin="messages">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
        <h1>Messages</h1>
        <p>Answer travelers right inside Talapo. They see your reply on their Messages page.</p>
      </div>
    </section>

    <div class="content">
      <p v-if="!passport.loaded" class="note"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
      <div v-else-if="!isAdmin" class="box"><h2><i class="fas fa-lock"></i> Admins only</h2></div>
      <template v-else>
        <AdminTabs :counts="{ messages: unreadTotal }" />
        <div v-if="missing" class="box">
          <h2><i class="fas fa-database"></i> One step first</h2>
          <p class="note">Run <b>migrations/20261006010000_messages-site-coupons.sql</b> in the InsForge SQL Editor, then refresh.</p>
        </div>
        <div v-else class="inbox" :class="{ 'has-sel': sel }">
          <aside class="col">
            <div class="tools">
              <div class="seg">
                <button v-for="f in [['open', 'Open'], ['unread', 'Unread'], ['closed', 'Closed'], ['all', 'All']]" :key="f[0]" :class="{ on: filter === f[0] }" @click="filter = f[0]">{{ f[1] }}</button>
              </div>
              <input v-model="q" type="search" placeholder="Search name, subject, text…" />
            </div>
            <p v-if="loading" class="note pad"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
            <p v-else-if="!shown.length" class="note pad">No conversations here.</p>
            <button v-for="t in shown" :key="t.id" class="item" :class="{ on: t.id === selId, unread: t.admin_unread }" @click="open(t)">
              <span class="av"><img v-if="t.photo_url" :src="t.photo_url" alt="" />{{ t.photo_url ? '' : initials(t) }}</span>
              <span class="txt">
                <span class="row1"><b>{{ name(t) }}</b><small>{{ when(t.last_message_at) }}</small></span>
                <span class="subj">{{ t.subject }}</span>
                <span class="prev"><i v-if="t.last_from_admin" class="fas fa-reply"></i> {{ t.preview }}</span>
              </span>
              <span v-if="t.admin_unread" class="dot">{{ t.admin_unread }}</span>
            </button>
          </aside>

          <section class="pane">
            <template v-if="sel">
              <header class="pane-head">
                <button class="back" aria-label="Back" @click="back"><i class="fas fa-arrow-left"></i></button>
                <div class="who">
                  <b>{{ name(sel) }}</b>
                  <small>{{ sel.subject }} · {{ TOPIC[sel.topic] }}<span v-if="sel.passport_number"> · {{ sel.passport_number }}</span></small>
                </div>
                <div class="acts">
                  <RouterLink v-if="sel.plan_request_id" to="/admin/plans" class="btn-s alt" title="See pass request"><i class="fas fa-tags"></i></RouterLink>
                  <button v-if="sel.status === 'open'" class="btn-s alt" @click="setStatus('closed')"><i class="fas fa-check"></i> Close</button>
                  <button v-else class="btn-s alt" @click="setStatus('open')">Reopen</button>
                  <button class="btn-s danger" aria-label="Delete conversation" @click="remove"><i class="fas fa-trash"></i></button>
                </div>
              </header>
              <ChatThread :thread-id="sel.id" as-admin :closed="sel.status === 'closed'" :quick-replies="QUICK" @read="onRead" @sent="onSent" />
            </template>
            <div v-else class="empty"><i class="fas fa-inbox"></i><p>Pick a conversation.</p></div>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.inbox { display: grid; grid-template-columns: 340px 1fr; background: #fff; border-radius: 20px; box-shadow: 0 16px 28px -22px rgba(0,32,64,.35); overflow: hidden; height: min(720px, calc(100vh - 180px)); min-height: 480px; }
.col { border-right: 1px solid #e5edf0; overflow-y: auto; display: flex; flex-direction: column; }
.tools { padding: .8rem; display: grid; gap: .5rem; border-bottom: 1px solid #eef3f5; position: sticky; top: 0; background: #fff; z-index: 1; }
.tools input { font: inherit; padding: .5rem .8rem; border: 1.5px solid #dce7ea; border-radius: 12px; min-height: 40px; }
.seg { display: flex; background: #f3f7f8; border-radius: 30px; padding: 3px; }
.seg button { flex: 1; border: 0; background: none; padding: .4rem .3rem; border-radius: 30px; font: inherit; font-size: .82rem; font-weight: 700; color: #58717f; cursor: pointer; }
.seg button.on { background: #1C6E6B; color: #fff; }
.pad { padding: 1rem; }
.item { display: flex; gap: .7rem; align-items: flex-start; text-align: left; border: 0; border-bottom: 1px solid #f0f4f6; background: #fff; padding: .75rem .9rem; cursor: pointer; font: inherit; color: #0A2F44; }
.item:hover { background: #f6f9fb; } .item.on { background: #EEF6F6; }
.av { width: 40px; height: 40px; border-radius: 50%; background: #0A2F44; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: .85rem; flex: 0 0 auto; overflow: hidden; }
.av img { width: 100%; height: 100%; object-fit: cover; }
.txt { flex: 1; min-width: 0; display: grid; gap: .1rem; }
.row1 { display: flex; justify-content: space-between; gap: .4rem; } .row1 b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row1 small { color: #8aa0ab; flex: 0 0 auto; }
.unread .row1 b, .unread .subj { font-weight: 800; }
.subj, .prev { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .86rem; }
.prev { color: #6b7f89; } .prev i { font-size: .7rem; }
.dot { background: #E46D5C; color: #fff; font-size: .72rem; font-weight: 800; border-radius: 20px; min-width: 20px; text-align: center; padding: 0 .35rem; align-self: center; }
.pane { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.pane :deep(.chat) { flex: 1; min-height: 0; }
.pane-head { display: flex; align-items: center; gap: .7rem; padding: .7rem 1rem; border-bottom: 1px solid #e5edf0; }
.who { flex: 1; min-width: 0; color: #0A2F44; } .who small { display: block; color: #58717f; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.acts { display: flex; gap: .4rem; } .acts a { text-decoration: none; display: inline-flex; align-items: center; }
.back { display: none; border: 0; background: #EEF6F6; color: #1C6E6B; width: 38px; height: 38px; border-radius: 50%; cursor: pointer; flex: 0 0 auto; }
.empty { margin: auto; text-align: center; color: #8aa0ab; } .empty i { font-size: 2.5rem; color: #cfe0e2; }
@media (max-width: 800px) {
  .inbox { grid-template-columns: 1fr; height: calc(100vh - 160px); }
  .inbox.has-sel .col { display: none; }
  .inbox:not(.has-sel) .pane { display: none; }
  .back { display: inline-grid; place-items: center; }
  .acts .btn-s { padding: .5rem .7rem; }
}
</style>
