<script setup>
import { ref, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { insforge, isConfigured } from '@/lib/insforge';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const open = ref(false);
const input = ref('');
const busy = ref(false);
const box = ref(null);
const messages = ref([
  { role: 'assistant', content: '💙 **Welcome, ¡qué chivo tenerte por aquí!** I’m Talapo, your El Salvador travel guide. What would you like to discover today?\n\n💡 Tip: ask me about the San Salvador Volcano or where to eat the best pupusas!' },
]);

const suggestions = [
  { text: 'Which tour do you recommend for a weekend?', to: null },
  { text: 'Build my route on the map', to: '/tours' },
  { text: 'How do I join the contests?', to: '/contests' },
];

// Contexto de la página actual para respuestas más útiles
const pageContext = computed(() => `El usuario está en la página "${route.meta.title || route.name}" (${route.path}).`);

function render(text) {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*/g, '').replace(/\n/g, '<br>');
}

async function scrollDown() { await nextTick(); box.value?.scrollTo({ top: box.value.scrollHeight, behavior: 'smooth' }); }

// Mismo "cerebro" que la edge function, para el respaldo directo
const SYSTEM = 'Actúa como "Talapo", el guía experto en turismo de El Salvador de talapo.sv. Alegre, con modismos salvadoreños moderados (¡Qué chivo!, ¡Púchica!). Responde en el idioma del usuario (inglés si no está claro), máximo ~120 palabras, con emojis puntuales. Recomienda secciones del sitio cuando sirva: Tours (/tours), Buses (/buses), Recetas (/typicalrecipes), Concursos (/contests), Pasaporte (/passport). No inventes precios ni horarios exactos. Termina con "💡 Mi sugerencia:" y una idea concreta.';

/** Explica en español por qué falló (útil mientras configuras InsForge). */
function diagnose(fnError, fallbackError) {
  const t = `${fnError?.message || ''} ${fallbackError?.message || ''}`;
  if (!isConfigured) return 'Falta conectar InsForge: crea el archivo .env.local (o ejecuta npm run setup:insforge) y reinicia npm run dev.';
  if (/OPENROUTER_API_KEY/i.test(t)) return 'Falta el secreto OPENROUTER_API_KEY en InsForge. Cópialo de Dashboard → Model Gateway y guárdalo con: npx @insforge/cli secrets add OPENROUTER_API_KEY <clave>. Luego vuelve a desplegar talapo-chat.';
  if (fnError?.statusCode === 404 || /not found/i.test(t)) return 'La función talapo-chat no está desplegada. Ejecuta: npx @insforge/cli functions deploy talapo-chat --file insforge/functions/talapo-chat/index.ts';
  if (fnError?.statusCode === 401 || fnError?.statusCode === 403) return 'InsForge rechazó la llamada (401/403). Revisa que VITE_INSFORGE_ANON_KEY en .env.local sea la anon key correcta.';
  if (/Failed to fetch|NetworkError|CORS/i.test(t)) return 'No se pudo conectar con InsForge. Revisa VITE_INSFORGE_URL en .env.local y tu conexión a internet.';
  return t.trim() || 'Error desconocido';
}

async function askTalapo(history, context) {
  if (!isConfigured) throw new Error(diagnose());
  // 1) Ruta recomendada: edge function (la clave del modelo vive como secreto)
  const { data, error } = await insforge.functions.invoke('talapo-chat', { body: { messages: history, context } });
  if (!error && data?.reply) return data.reply;
  console.warn('[TalapoAI] talapo-chat falló, probando respaldo:', error || data);
  // 2) Respaldo: proxy de IA de InsForge (compatibilidad) — funciona sin la función desplegada
  try {
    const c = await insforge.ai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'system', content: `${SYSTEM}\nContexto: ${context}` }, ...history],
    });
    const text = c?.choices?.[0]?.message?.content;
    if (text) return text;
    throw new Error('Respuesta vacía del modelo');
  } catch (e2) {
    throw new Error(diagnose(error, e2));
  }
}

async function send(text = input.value) {
  const q = text.trim();
  if (!q || busy.value) return;
  messages.value.push({ role: 'user', content: q });
  input.value = '';
  busy.value = true;
  scrollDown();
  try {
    const reply = await askTalapo(
      messages.value.slice(-10).map(({ role, content }) => ({ role, content })),
      `${pageContext.value} ${auth.isAuthenticated ? `Se llama ${auth.displayName}.` : 'No ha iniciado sesión.'}`,
    );
    messages.value.push({ role: 'assistant', content: reply });
  } catch (e) {
    console.error('[TalapoAI]', e.message);
    // En desarrollo se muestra la causa exacta; en producción, un mensaje amable
    messages.value.push({
      role: 'assistant',
      content: import.meta.env.DEV
        ? `⚠️ **The AI isn’t connected yet.** ${e.message}`
        : '⚠️ Oops! I lost my signal for a moment. Please try again in a little while.',
    });
  } finally {
    busy.value = false;
    scrollDown();
  }
}

function useSuggestion(s) { if (s.to) { router.push(s.to); open.value = false; } else send(s.text); }
</script>

<template>
  <!-- Burbuja y ventana ORIGINALES de main.html (ahora en todas las páginas) -->
  <button class="talapo-chat-bubble" :aria-expanded="open" aria-label="Open Talapo chat" @click="open = !open">
    <div class="talapo-avatar-circle">✈️</div>
  </button>

  <Transition name="chat">
    <div v-if="open" class="talapo-chat-window" role="dialog" aria-label="Talapo Bot">
      <div class="talapo-chat-header">
        <div class="talapo-avatar-small">✈️</div>
        <div>
          <h4>Talapo Bot</h4>
          <small>El Salvador travel expert 🇸🇻</small>
        </div>
        <button class="close-chat-btn" aria-label="Close" @click="open = false"><i class="fas fa-times"></i></button>
      </div>
      <div ref="box" class="talapo-chat-messages">
        <TransitionGroup name="msg">
          <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role === 'user' ? 'user-msg' : 'bot-msg'" v-html="render(m.content)"></div>
        </TransitionGroup>
        <div v-if="busy" class="msg bot-msg-thinking"><b>✈️ Talapo is thinking...</b></div>
        <div v-if="messages.length === 1" class="chips">
          <button v-for="s in suggestions" :key="s.text" @click="useSuggestion(s)">{{ s.text }}</button>
        </div>
      </div>
      <form class="talapo-chat-footer" @submit.prevent="send()">
        <input v-model="input" type="text" placeholder="Type your question..." aria-label="Your question" maxlength="1000">
        <button :disabled="busy || !input.trim()" aria-label="Send"><i class="fas fa-paper-plane"></i></button>
      </form>
    </div>
  </Transition>
</template>

<style scoped>
/* ===== CSS original de assets/css/main.css (chat) ===== */
.talapo-chat-bubble {
  position: fixed; bottom: 30px; right: 30px; width: 65px; height: 65px;
  background: linear-gradient(135deg, #1C6E6B, #0A2F44); color: white; border: 0; border-radius: 50%;
  font-family: 'Outfit', sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.3); cursor: pointer; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.talapo-chat-bubble:hover { transform: scale(1.1) rotate(5deg); box-shadow: 0 15px 30px rgba(28, 110, 107, 0.4); }
.talapo-avatar-circle { font-size: 30px; }
.talapo-chat-window {
  position: fixed; bottom: 110px; right: 30px; width: 380px; height: 550px; background: white;
  border-radius: 25px; box-shadow: 0 15px 40px rgba(0,0,0,0.2); display: flex; flex-direction: column;
  overflow: hidden; z-index: 9999; font-family: 'Outfit', sans-serif; border: 1px solid rgba(10, 47, 68, 0.1);
}
.talapo-chat-header { background: linear-gradient(105deg, #0A2F44, #1C6E6B); color: white; padding: 18px; display: flex; align-items: center; gap: 15px; position: relative; }
.talapo-avatar-small { font-size: 22px; }
.talapo-chat-header h4 { margin: 0; font-size: 1.1rem; font-weight: 700; }
.talapo-chat-header small { opacity: 0.8; }
.close-chat-btn { background: none; border: none; color: white; position: absolute; right: 20px; cursor: pointer; font-size: 1.3rem; }
.talapo-chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; background: #F4F9FC; }
.msg { padding: 14px 18px; border-radius: 18px; max-width: 85%; font-size: 0.95rem; line-height: 1.5; }
.bot-msg, .bot-msg-thinking { background: #FFFFFF; color: #0A2F44; align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid rgba(28, 110, 107, 0.1); }
.bot-msg-thinking { animation: pulse 1.2s ease-in-out infinite; }
.user-msg { background: #1C6E6B; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
.talapo-chat-footer { padding: 15px; display: flex; gap: 10px; border-top: 1px solid #E2EAF0; background: white; }
.talapo-chat-footer input { flex: 1; padding: 12px 18px; border: 1px solid #cbdbe2; border-radius: 30px; outline: none; font-family: inherit; }
.talapo-chat-footer input:focus { border-color: #1C6E6B; }
.talapo-chat-footer button { background: #E46D5C; border: none; color: white; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; transition: background 0.2s; }
.talapo-chat-footer button:hover { background: #0A2F44; }
.talapo-chat-footer button:disabled { opacity: .6; cursor: default; }
.chips { display: grid; gap: 8px; }
.chips button { text-align: left; background: #fff; border: 1px dashed #1C6E6B; color: #1C6E6B; border-radius: 14px; padding: 8px 12px; cursor: pointer; font-family: inherit; font-weight: 600; transition: background .2s; }
.chips button:hover { background: rgba(28,110,107,.06); }

/* ===== Transiciones nuevas ===== */
.chat-enter-active, .chat-leave-active { transition: opacity .25s ease, transform .3s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: bottom right; }
.chat-enter-from, .chat-leave-to { opacity: 0; transform: translateY(16px) scale(.94); }
.msg-enter-active { transition: opacity .3s ease, transform .3s ease; }
.msg-enter-from { opacity: 0; transform: translateY(8px); }
@keyframes pulse { 50% { opacity: .55; } }

@media (max-width: 520px) {
  .talapo-chat-bubble { bottom: 18px; right: 18px; width: 58px; height: 58px; }
  .talapo-chat-window { right: 10px; left: 10px; width: auto; bottom: 90px; height: min(70vh, 550px); }
}
</style>
