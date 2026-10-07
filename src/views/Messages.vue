<script setup>
// Mensajes con el equipo Talapo, dentro de la página (sin WhatsApp).
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { insforge, unwrap } from '@/lib/insforge';
import { useAuthStore } from '@/stores/auth';
import { toast } from '@/composables/useToast';
import { getSettings, DEFAULT_SETTINGS, refreshUnread } from '@/lib/siteContent';
import ChatThread from '@/components/support/ChatThread.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const threads = ref([]);
const loading = ref(true);
const missing = ref(false);
const selId = ref(null);
const composing = ref(false);
const settings = ref({ ...DEFAULT_SETTINGS });
const TOPICS = [
  { id: 'general', label: 'General question' },
  { id: 'plans', label: 'Travel passes' },
  { id: 'tours', label: 'Tours & itineraries' },
  { id: 'account', label: 'My account / passport' },
  { id: 'report', label: 'Report a problem' },
  { id: 'other', label: 'Other' },
];
const form = reactive({ topic: 'general', subject: '', body: '', plan_request_id: null });
const sending = ref(false);
let timer = null;

const sel = computed(() => threads.value.find((t) => t.id === selId.value));
const when = (d) => {
  const x = new Date(d); const today = new Date().toDateString() === x.toDateString();
  return today ? x.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

async function load(silent = false) {
  if (!silent) loading.value = true;
  try {
    threads.value = await unwrap(insforge.database.from('support_threads')
      .select('id, subject, topic, status, user_unread, last_message_at, last_from_admin, plan_request_id')
      .eq('profile_id', auth.user.id).order('last_message_at', { ascending: false }).limit(100));
    missing.value = false;
  } catch (e) {
    if (/support_threads|does not exist|relation/i.test(e.message)) missing.value = true; else if (!silent) toast(e.message, 'error');
  } finally { loading.value = false; }
}

function open(t) { selId.value = t.id; composing.value = false; router.replace({ query: { t: t.id } }); }
function newThread(prefill = {}) {
  Object.assign(form, { topic: 'general', subject: '', body: '', plan_request_id: null }, prefill);
  composing.value = true; selId.value = null;
}
function back() { selId.value = null; composing.value = false; router.replace({ query: {} }); }

async function create() {
  const subject = form.subject.trim() || TOPICS.find((t) => t.id === form.topic).label;
  const body = form.body.trim();
  if (body.length < 2) { toast('Write your message', 'error'); return; }
  sending.value = true;
  try {
    const rows = await unwrap(insforge.database.from('support_threads')
      .insert([{ subject: subject.slice(0, 120), topic: form.topic, plan_request_id: form.plan_request_id }]).select());
    const t = rows[0];
    await unwrap(insforge.database.from('support_messages').insert([{ thread_id: t.id, body }]));
    toast('Message sent — we will answer here');
    await load(true);
    open(t);
  } catch (e) { toast(e.message, 'error'); }
  finally { sending.value = false; }
}

function onRead() {
  const t = sel.value; if (t) t.user_unread = 0;
  refreshUnread(auth.user.id).catch(() => {});
}

onMounted(async () => {
  settings.value = await getSettings();
  await load();
  // ?t=<id> abre una conversación · ?request=<id>&plan=<nombre> empieza una sobre una solicitud de pase
  if (route.query.t && threads.value.some((t) => t.id === route.query.t)) selId.value = route.query.t;
  else if (route.query.request) {
    const existing = threads.value.find((t) => t.plan_request_id === route.query.request);
    if (existing) open(existing);
    else newThread({ topic: 'plans', subject: `About my ${route.query.plan || 'travel pass'} request`, plan_request_id: route.query.request });
  } else if (route.query.new) newThread();
  timer = setInterval(() => { if (!document.hidden) load(true); }, 20000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="tp msgs-page">
    <section class="head">
      <div class="wrap-in">
        <h1><i class="fas fa-comments"></i> Messages</h1>
        <p>Write to the Talapo team right here. We answer in this same page — no WhatsApp needed.</p>
      </div>
    </section>

    <div class="wrap-in body">
      <div v-if="missing" class="card pad"><p class="muted">Messages will be available very soon.</p></div>
      <div v-else class="card layout" :class="{ 'has-sel': sel || composing }">
        <!-- Lista -->
        <aside class="list">
          <button class="new" :disabled="!settings.messages_open" @click="newThread()"><i class="fas fa-pen-to-square"></i> New message</button>
          <p v-if="!settings.messages_open" class="muted small pad-x">Messages are paused for now. Please try again later.</p>
          <p v-if="loading" class="muted pad-x"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
          <p v-else-if="!threads.length" class="muted pad-x">You have no conversations yet.</p>
          <button v-for="t in threads" :key="t.id" class="item" :class="{ on: t.id === selId, unread: t.user_unread }" @click="open(t)">
            <span class="top"><b>{{ t.subject }}</b><small>{{ when(t.last_message_at) }}</small></span>
            <span class="sub">
              <span v-if="t.status === 'closed'" class="pill grey">Closed</span>
              <span v-else-if="t.last_from_admin" class="pill">Talapo answered</span>
              <span v-else class="pill wait">Waiting for answer</span>
              <span v-if="t.user_unread" class="dot">{{ t.user_unread }}</span>
            </span>
          </button>
        </aside>

        <!-- Conversación / nueva -->
        <section class="pane">
          <template v-if="sel">
            <header class="pane-head">
              <button class="back" aria-label="Back" @click="back"><i class="fas fa-arrow-left"></i></button>
              <div><b>{{ sel.subject }}</b><small>{{ TOPICS.find((x) => x.id === sel.topic)?.label }}<span v-if="sel.plan_request_id"> · <RouterLink to="/planes">see my request</RouterLink></span></small></div>
            </header>
            <ChatThread :thread-id="sel.id" :auto-reply="settings.auto_reply" @read="onRead" @sent="load(true)" />
          </template>

          <form v-else-if="composing" class="compose" @submit.prevent="create">
            <header class="pane-head"><button type="button" class="back" aria-label="Back" @click="back"><i class="fas fa-arrow-left"></i></button><b>New message</b></header>
            <div class="pad">
              <label>Topic
                <select v-model="form.topic"><option v-for="t in TOPICS" :key="t.id" :value="t.id">{{ t.label }}</option></select>
              </label>
              <label>Subject <small>(optional)</small><input v-model="form.subject" maxlength="120" placeholder="e.g. Question about the VIP pass" /></label>
              <label>Message<textarea v-model="form.body" rows="6" maxlength="2000" placeholder="How can we help you?"></textarea></label>
              <button class="send" :disabled="sending">{{ sending ? 'Sending…' : 'Send message' }} <i class="fas fa-paper-plane"></i></button>
            </div>
          </form>

          <div v-else class="empty">
            <i class="fas fa-comments"></i>
            <p>Pick a conversation or start a new one.</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msgs-page { background: #F8FBFE; min-height: calc(100vh - 80px); font-family: 'Outfit', 'Inter', sans-serif; }
.wrap-in { max-width: 1100px; margin: 0 auto; padding: 0 5%; }
.head { background: linear-gradient(105deg, #1C6E6B, #0A2F44); color: #fff; padding: 2.2rem 0 4.5rem; }
.head h1 { margin: 0 0 .3rem; font-size: clamp(1.8rem, 4vw, 2.4rem); display: flex; gap: .6rem; align-items: center; }
.head p { margin: 0; opacity: .9; }
.body { margin-top: -3rem; padding-bottom: 3rem; }
.card { background: #fff; border-radius: 22px; box-shadow: 0 20px 40px -25px rgba(0,32,64,.4); overflow: hidden; }
.pad { padding: 1.2rem; } .pad-x { padding: 0 1rem; }
.muted { color: #58717f; } .small { font-size: .85rem; }
.layout { display: grid; grid-template-columns: 320px 1fr; height: min(680px, calc(100vh - 210px)); min-height: 460px; }
.list { border-right: 1px solid #e5edf0; overflow-y: auto; display: flex; flex-direction: column; }
.new { margin: .9rem; border: 0; border-radius: 30px; background: #E46D5C; color: #fff; font: inherit; font-weight: 800; padding: .7rem; cursor: pointer; min-height: 44px; }
.new:disabled { opacity: .5; cursor: default; }
.item { text-align: left; border: 0; border-top: 1px solid #f0f4f6; background: #fff; padding: .8rem 1rem; cursor: pointer; font: inherit; display: grid; gap: .3rem; color: #0A2F44; }
.item:hover { background: #f6f9fb; } .item.on { background: #EEF6F6; }
.item .top { display: flex; justify-content: space-between; gap: .5rem; } .item .top b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.item.unread .top b { font-weight: 800; } .item small { color: #8aa0ab; flex: 0 0 auto; }
.item .sub { display: flex; align-items: center; gap: .4rem; }
.pill { font-size: .7rem; font-weight: 800; padding: .1rem .5rem; border-radius: 20px; background: #EEF6F6; color: #1C6E6B; }
.pill.wait { background: #fdf3d9; color: #8a6410; } .pill.grey { background: #eef2f4; color: #6b7f89; }
.dot { margin-left: auto; background: #E46D5C; color: #fff; font-size: .72rem; font-weight: 800; border-radius: 20px; min-width: 20px; text-align: center; padding: 0 .35rem; }
.pane { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.pane-head { display: flex; align-items: center; gap: .7rem; padding: .8rem 1rem; border-bottom: 1px solid #e5edf0; color: #0A2F44; }
.pane-head small { display: block; color: #58717f; font-size: .8rem; }
.back { display: none; border: 0; background: #EEF6F6; color: #1C6E6B; width: 38px; height: 38px; border-radius: 50%; cursor: pointer; }
.empty { margin: auto; text-align: center; color: #8aa0ab; } .empty i { font-size: 2.5rem; color: #cfe0e2; }
.compose label { display: grid; gap: .3rem; font-size: .85rem; font-weight: 700; color: #0A2F44; margin-bottom: .9rem; }
.compose small { font-weight: 400; color: #8aa0ab; }
.compose input, .compose select, .compose textarea { font: inherit; font-size: .95rem; font-weight: 400; padding: .65rem .85rem; border: 1.5px solid #dce7ea; border-radius: 12px; color: #0A2F44; background: #fff; min-height: 44px; }
.send { border: 0; border-radius: 30px; background: linear-gradient(105deg, #1C6E6B, #0A2F44); color: #fff; font: inherit; font-weight: 800; padding: .75rem 1.4rem; cursor: pointer; min-height: 46px; }
.send:disabled { opacity: .6; }
.pane :deep(.chat) { flex: 1; min-height: 0; }
@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; height: calc(100vh - 190px); }
  .layout.has-sel .list { display: none; }
  .layout:not(.has-sel) .pane { display: none; }
  .back { display: inline-grid; place-items: center; }
}
</style>
