<script setup>
// Conversación entre un usuario y Talapo (la usan /messages y /admin/messages).
// Se actualiza sola cada pocos segundos mientras está abierta.
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { toast } from '@/composables/useToast';

const props = defineProps({
  threadId: { type: String, required: true },
  asAdmin: { type: Boolean, default: false },
  closed: { type: Boolean, default: false },
  autoReply: { type: String, default: '' },
  quickReplies: { type: Array, default: () => [] },
});
const emit = defineEmits(['sent', 'read']);

const msgs = ref([]);
const loading = ref(true);
const text = ref('');
const sending = ref(false);
const box = ref(null);
const input = ref(null);
let timer = null;

const time = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const mine = (m) => (props.asAdmin ? m.from_admin : !m.from_admin);

async function scrollDown() { await nextTick(); if (box.value) box.value.scrollTop = box.value.scrollHeight; }

async function load(silent = false) {
  if (!silent) loading.value = true;
  try {
    const rows = await unwrap(insforge.database.from('support_messages')
      .select('id, body, from_admin, created_at').eq('thread_id', props.threadId).order('created_at', { ascending: true }).limit(500));
    const grew = rows.length !== msgs.value.length;
    msgs.value = rows;
    if (grew) { scrollDown(); markRead(); }
  } catch (e) { if (!silent) toast(e.message, 'error'); }
  finally { loading.value = false; }
}
function markRead() {
  insforge.database.rpc('support_mark_read', { p_thread: props.threadId }).then(() => emit('read'), () => {});
}

async function send(body = text.value) {
  const msg = String(body || '').trim();
  if (!msg || sending.value) return;
  sending.value = true;
  try {
    const rows = await unwrap(insforge.database.from('support_messages').insert([{ thread_id: props.threadId, body: msg }]).select());
    msgs.value.push(rows[0]);
    text.value = '';
    scrollDown();
    emit('sent', rows[0]);
  } catch (e) { toast(e.message, 'error'); }
  finally { sending.value = false; input.value?.focus(); }
}
// Enter envía; Shift+Enter hace salto de línea
function onKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }

function start() {
  clearInterval(timer);
  msgs.value = [];
  load();
  timer = setInterval(() => { if (!document.hidden) load(true); }, 8000);
}
watch(() => props.threadId, start);
onMounted(start);
onBeforeUnmount(() => clearInterval(timer));
defineExpose({ send, reload: () => load(true) });
</script>

<template>
  <div class="chat">
    <div ref="box" class="msgs" aria-live="polite">
      <p v-if="loading" class="hint"><i class="fas fa-spinner fa-spin"></i> Loading…</p>
      <template v-else>
        <div v-for="(m, i) in msgs" :key="m.id" class="msg" :class="{ me: mine(m), admin: m.from_admin }">
          <div class="bubble">
            <span v-if="m.from_admin && !asAdmin" class="who"><i class="fas fa-feather-pointed"></i> Talapo team</span>
            <p>{{ m.body }}</p>
            <time>{{ time(m.created_at) }}</time>
          </div>
          <!-- Respuesta automática (solo se muestra, no se guarda) después del primer mensaje del usuario -->
          <div v-if="i === 0 && !m.from_admin && autoReply && !asAdmin && !msgs.some((x) => x.from_admin)" class="msg system">
            <div class="bubble"><p>{{ autoReply }}</p></div>
          </div>
        </div>
        <p v-if="!msgs.length" class="hint">No messages yet.</p>
      </template>
    </div>

    <div v-if="quickReplies.length && !closed" class="quick">
      <button v-for="q in quickReplies" :key="q" type="button" @click="text = q; input?.focus()">{{ q.length > 38 ? q.slice(0, 36) + '…' : q }}</button>
    </div>
    <form class="composer" @submit.prevent="send()">
      <textarea ref="input" v-model="text" rows="1" maxlength="2000" :placeholder="closed && asAdmin ? 'This conversation is closed — writing reopens it for the user' : 'Write a message…'" @keydown="onKey"></textarea>
      <button type="submit" :disabled="!text.trim() || sending" aria-label="Send"><i class="fas" :class="sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i></button>
    </form>
  </div>
</template>

<style scoped>
.chat { display: flex; flex-direction: column; min-height: 0; height: 100%; }
.msgs { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: .55rem; background: #f6f9fb; min-height: 260px; }
.hint { color: #58717f; text-align: center; margin: auto; }
.msg { display: flex; flex-direction: column; align-items: flex-start; }
.msg.me { align-items: flex-end; }
.bubble { max-width: min(78%, 520px); background: #fff; border-radius: 16px 16px 16px 4px; padding: .55rem .8rem; box-shadow: 0 2px 6px rgba(0,32,64,.07); color: #0A2F44; }
.msg.me .bubble { background: #1C6E6B; color: #fff; border-radius: 16px 16px 4px 16px; }
.msg.system { align-items: center; margin-top: .5rem; }
.msg.system .bubble { background: #EEF6F6; color: #33515f; font-size: .85rem; box-shadow: none; border-radius: 12px; text-align: center; }
.bubble p { margin: 0; white-space: pre-wrap; word-break: break-word; line-height: 1.45; }
.who { display: block; font-size: .72rem; font-weight: 800; color: #1C6E6B; margin-bottom: .15rem; }
time { display: block; font-size: .68rem; opacity: .65; margin-top: .2rem; text-align: right; }
.quick { display: flex; gap: .4rem; overflow-x: auto; padding: .5rem .8rem 0; scrollbar-width: none; }
.quick button { flex: 0 0 auto; border: 1px solid #dce7ea; background: #fff; color: #1C6E6B; font: inherit; font-size: .8rem; font-weight: 700; border-radius: 20px; padding: .35rem .75rem; cursor: pointer; }
.composer { display: flex; gap: .5rem; padding: .7rem .8rem; border-top: 1px solid #e5edf0; background: #fff; align-items: flex-end; }
.composer textarea { flex: 1; resize: none; font: inherit; font-size: .95rem; padding: .65rem .85rem; border: 1.5px solid #dce7ea; border-radius: 18px; min-height: 44px; max-height: 140px; color: #0A2F44; field-sizing: content; }
.composer textarea:focus { outline: none; border-color: #1C6E6B; }
.composer button { width: 44px; height: 44px; border-radius: 50%; border: 0; background: #E46D5C; color: #fff; cursor: pointer; flex: 0 0 auto; font-size: 1rem; }
.composer button:disabled { opacity: .45; cursor: default; }
</style>
