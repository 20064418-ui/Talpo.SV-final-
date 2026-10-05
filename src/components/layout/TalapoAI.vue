<script setup>
// Talapo Bot: guía de viaje con IA + herramientas instantáneas (plan de viaje, frases útiles,
// datos rápidos, pasaporte y concursos). Las herramientas no gastan IA: usan datos del sitio.
import { ref, reactive, nextTick, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { insforge, isConfigured } from '@/lib/insforge';
import { useAuthStore } from '@/stores/auth';
import { usePassportStore } from '@/stores/passport';
import { challenges } from '@/data/contests';
import { toast } from '@/composables/useToast';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const passport = usePassportStore();

const STORE_KEY = 'talapo.chat.v2';
const open = ref(false);
const input = ref('');
const busy = ref(false);
const box = ref(null);
const mode = ref('guide'); // guide | translator

const WELCOME = {
  role: 'assistant', welcome: true,
  content: "💙 **Welcome, ¡qué chivo tenerte por aquí!** I’m Talapo, your El Salvador travel guide. What would you like to discover today?\n\n💡 Tip: ask me about the San Salvador Volcano, where to eat the best pupusas, or use the tools below to plan a trip.",
};
const messages = ref([WELCOME]);

onMounted(() => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
    if (Array.isArray(saved) && saved.length) messages.value = saved.slice(-40);
  } catch { /* sin historial */ }
});
watch(messages, (v) => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(v.slice(-40))); } catch { /* modo privado */ } }, { deep: true });

/* ---------- Herramientas ---------- */
const tools = [
  { id: 'planner', icon: 'fa-map-location-dot', label: 'Plan a trip' },
  { id: 'phrases', icon: 'fa-language', label: 'Spanish phrases' },
  { id: 'facts', icon: 'fa-circle-info', label: 'Quick facts' },
  { id: 'passport', icon: 'fa-passport', label: 'My passport' },
  { id: 'contests', icon: 'fa-trophy', label: 'Contests' },
];
const suggestions = [
  'Which tour do you recommend for a weekend?',
  'Where can I eat the best pupusas?',
  'How do I get from San Salvador to Santa Ana by bus?',
];

const INTERESTS = ['Beaches', 'Volcanoes', 'Culture', 'Food', 'Nature', 'Surf', 'Coffee'];
const planner = reactive({ days: 3, budget: 'mid', from: '', interests: ['Culture', 'Food'] });
function toggleInterest(i) {
  const k = planner.interests.indexOf(i);
  if (k >= 0) planner.interests.splice(k, 1); else if (planner.interests.length < 4) planner.interests.push(i);
}

const PHRASES = [
  { group: 'Greetings', items: [['Hello / Good morning', 'Hola / Buenos días'], ['Thank you very much', 'Muchas gracias'], ['Nice to meet you', 'Mucho gusto'], ['Do you speak English?', '¿Habla inglés?']] },
  { group: 'Food', items: [['The menu, please', 'El menú, por favor'], ['What do you recommend?', '¿Qué me recomienda?'], ['I am vegetarian', 'Soy vegetariano(a)'], ['The check, please', 'La cuenta, por favor']] },
  { group: 'Getting around', items: [['Where is the bus stop?', '¿Dónde está la parada de bus?'], ['How much is the fare?', '¿Cuánto cuesta el pasaje?'], ['Please stop here', 'Aquí me bajo, por favor'], ['How do I get to the beach?', '¿Cómo llego a la playa?']] },
  { group: 'Emergency', items: [['I need help', 'Necesito ayuda'], ['Call the police', 'Llame a la policía'], ['I need a doctor', 'Necesito un médico'], ['I lost my passport', 'Perdí mi pasaporte']] },
];
const SLANG = [['Qué chivo', 'How cool'], ['Vaya pues', 'Okay, sounds good'], ['Cipote / cipota', 'Kid'], ['Púchica', 'Wow / Oh my'], ['Al chilazo', 'Right away']];
const FACTS = [
  ['Currency', 'US dollar (USD). Small bills and coins are handy for buses and markets.'],
  ['Language', 'Spanish. English is common in tourist areas, but a few Spanish phrases go a long way.'],
  ['Emergency', 'Dial 911. See the Emergency services page for more numbers.'],
  ['Electricity', '120 V, 60 Hz. Plug types A and B (same as the US).'],
  ['Time zone', 'UTC-6, no daylight saving time.'],
  ['Weather', 'Dry season roughly November to April, rainy season May to October. Mornings are best for hikes.'],
  ['Tipping', 'Many restaurants suggest a 10% tip on the bill. Check whether it is already included.'],
  ['Water', 'Drink bottled or purified water.'],
];

const hasPassport = computed(() => passport.hasPassport);
const stampCount = computed(() => passport.stamps.filter((s) => s.visited_at).length);

function pushCard(card, text = '') { messages.value.push({ role: 'assistant', card, content: text }); scrollDown(); }
async function openTool(id) {
  if (busy.value) return;
  if (id === 'passport') {
    if (auth.isAuthenticated && !passport.loaded) { try { await passport.load(); } catch { /* se muestra vacío */ } }
    pushCard('passport');
  } else pushCard(id);
}
function setMode(m) {
  mode.value = m;
  if (m === 'translator') messages.value.push({ role: 'assistant', content: "**Translator mode is on.** Type something in English or Spanish and I'll translate it, with a quick pronunciation tip. Switch back to Guide mode any time." });
  scrollDown();
}
function newChat() { messages.value = [WELCOME]; mode.value = 'guide'; }
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); } catch { toast('Could not copy', 'error'); }
}
function sendPhrase(es) { copy(es); }

/* ---------- Render (markdown básico y seguro) ---------- */
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(t) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '<a href="$2" data-go="$2">$1</a>')
    .replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
}
function render(text) {
  const lines = String(text || '').split('\n');
  let html = ''; let list = null;
  const close = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const raw of lines) {
    const l = raw.trimEnd();
    const ul = /^\s*[-*•]\s+(.*)/.exec(l);
    const ol = /^\s*\d+[.)]\s+(.*)/.exec(l);
    if (ul) { if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(ul[1])}</li>`; }
    else if (ol) { if (list !== 'ol') { close(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(ol[1])}</li>`; }
    else { close(); html += l ? `<p>${inline(l)}</p>` : ''; }
  }
  close();
  return html;
}
function onMsgClick(e) {
  const a = e.target.closest('a[data-go]');
  if (!a) return;
  e.preventDefault(); router.push(a.dataset.go); open.value = false;
}

/* Botones de acceso rápido según lo que se habló */
const LINKS = [
  { re: /\b(tour|itinerary|route builder|plan(ning)? (a|your) (trip|route)|day trip)\b/i, to: '/tours', label: 'Build a route' },
  { re: /\b(bus|buses|transport|ruta \d+)\b/i, to: '/buses', label: 'Bus routes' },
  { re: /\b(recipe|pupusa|cook|tamale|gastronomy|eat|restaurant)\b/i, to: '/typicalrecipes', label: 'Typical recipes' },
  { re: /\b(contest|challenge|prize)\b/i, to: '/contests', label: 'Contests' },
  { re: /\b(passport|stamp|streak)\b/i, to: '/passport', label: 'My passport' },
  { re: /\b(emergency|police|hospital|911)\b/i, to: '/emergency', label: 'Emergency services' },
  { re: /\b(translate|translator|spanish phrase)\b/i, to: '/traductor', label: 'Translator page' },
];
const linksFor = (text) => LINKS.filter((l) => l.re.test(text)).slice(0, 3);
function go(to) { router.push(to); open.value = false; }

async function scrollDown() { await nextTick(); box.value?.scrollTo({ top: box.value.scrollHeight, behavior: 'smooth' }); }

/* ---------- IA ---------- */
const pageContext = computed(() => `El usuario está en la página "${route.meta.title || route.name}" (${route.path}).`);

// Mismo "cerebro" que la edge function, para el respaldo directo
const SYSTEM = 'Actúa como "Talapo", el guía experto en turismo de El Salvador de talapo.sv. Alegre y cercano; usa modismos salvadoreños muy de vez en cuando. Responde en el idioma del usuario (inglés si no está claro). Sé breve (máximo ~120 palabras) salvo que pidan un plan o una traducción. Usa emojis solo de vez en cuando. Cuando sirva, recomienda secciones del sitio con enlaces tipo [Tours](/tours), [Buses](/buses), [Recetas](/typicalrecipes), [Concursos](/contests), [Pasaporte](/passport). No inventes precios ni horarios exactos; sugiere confirmarlos.';

const MODE_HINT = {
  planner: '[Modo: planificador de viaje. Responde con un plan día por día (Day 1, Day 2...), con 3 paradas por día (mañana, tarde, noche), una frase de transporte y un costo aproximado diario en USD marcado como estimado. Máximo 300 palabras, sin emojis, ignora el límite de 120 palabras.]',
  translator: '[Modo: traductor. Traduce el texto entre inglés y español (detecta el idioma). Responde con la traducción en negrita y debajo una breve guía de pronunciación si el destino es español. Nada más, sin emojis.]',
};

function diagnose(fnError, fallbackError) {
  const t = `${fnError?.message || ''} ${fallbackError?.message || ''}`;
  if (!isConfigured) return 'Falta conectar InsForge: crea el archivo .env.local (o ejecuta npm run setup:insforge) y reinicia npm run dev.';
  if (/OPENROUTER_API_KEY/i.test(t)) return 'Falta el secreto OPENROUTER_API_KEY en InsForge. Cópialo de Dashboard → Model Gateway y guárdalo con: npx @insforge/cli secrets add OPENROUTER_API_KEY <clave>. Luego vuelve a desplegar talapo-chat.';
  if (fnError?.statusCode === 404 || /not found/i.test(t)) return 'La función talapo-chat no está desplegada. Ejecuta: npx @insforge/cli functions deploy talapo-chat --file insforge/functions/talapo-chat/index.ts';
  if (fnError?.statusCode === 401 || fnError?.statusCode === 403) return 'InsForge rechazó la llamada (401/403). Revisa que VITE_INSFORGE_ANON_KEY en .env.local sea la anon key correcta.';
  if (/Failed to fetch|NetworkError|CORS/i.test(t)) return 'No se pudo conectar con InsForge. Revisa VITE_INSFORGE_URL en .env.local y tu conexión a internet.';
  return t.trim() || 'Error desconocido';
}

async function askTalapo(history, context, m) {
  if (!isConfigured) throw new Error(diagnose());
  const { data, error } = await insforge.functions.invoke('talapo-chat', { body: { messages: history, context, mode: m } });
  if (!error && data?.reply) return data.reply;
  console.warn('[TalapoAI] talapo-chat falló, probando respaldo:', error || data);
  try {
    const c = await insforge.ai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      max_tokens: m === 'guide' ? 400 : 800,
      messages: [{ role: 'system', content: `${SYSTEM}\nContexto: ${context}` }, ...history],
    });
    const text = c?.choices?.[0]?.message?.content;
    if (text) return text;
    throw new Error('Respuesta vacía del modelo');
  } catch (e2) {
    throw new Error(diagnose(error, e2));
  }
}

// Solo mensajes de texto van al modelo (las tarjetas de herramientas no)
function historyForModel(extraHint) {
  const h = messages.value.filter((x) => !x.card && !x.error).slice(-10).map(({ role, content }) => ({ role, content }));
  if (extraHint && h.length) h[h.length - 1] = { ...h[h.length - 1], content: `${extraHint}\n${h[h.length - 1].content}` };
  return h;
}

async function run(hint) {
  busy.value = true; scrollDown();
  try {
    const reply = await askTalapo(
      historyForModel(hint),
      `${pageContext.value} ${auth.isAuthenticated ? `Se llama ${auth.displayName}.` : 'No ha iniciado sesión.'}`,
      mode.value === 'translator' ? 'translator' : (hint ? 'planner' : 'guide'),
    );
    messages.value.push({ role: 'assistant', content: reply });
  } catch (e) {
    console.error('[TalapoAI]', e.message);
    messages.value.push({
      role: 'assistant', error: true,
      content: import.meta.env.DEV ? `⚠️ **The AI isn’t connected yet.** ${e.message}` : '⚠️ Oops! I lost my signal for a moment. Please try again in a little while.',
    });
  } finally { busy.value = false; scrollDown(); }
}

async function send(text = input.value) {
  const q = text.trim();
  if (!q || busy.value) return;
  messages.value.push({ role: 'user', content: q });
  input.value = '';
  await run(mode.value === 'translator' ? MODE_HINT.translator : '');
}

async function createPlan() {
  if (busy.value) return;
  const interests = planner.interests.length ? planner.interests.join(', ') : 'a bit of everything';
  const budget = { low: 'budget (backpacker)', mid: 'mid-range', high: 'comfortable' }[planner.budget];
  const q = `Plan a ${planner.days}-day trip in El Salvador${planner.from.trim() ? ` starting from ${planner.from.trim()}` : ''}. Interests: ${interests}. Budget: ${budget}.`;
  messages.value.push({ role: 'user', content: q });
  await run(MODE_HINT.planner);
}

async function regenerate() {
  if (busy.value) return;
  const idx = [...messages.value].map((m) => !m.card && !m.error && m.role === 'assistant').lastIndexOf(true);
  if (idx < 1) return;
  const wasPlan = /^Plan a \d+-day trip/.test(messages.value[idx - 1]?.content || '');
  messages.value.splice(idx, 1);
  await run(wasPlan ? MODE_HINT.planner : (mode.value === 'translator' ? MODE_HINT.translator : ''));
}
const lastBotIndex = computed(() => [...messages.value].map((m) => m.role === 'assistant' && !m.card && !m.error && !m.welcome).lastIndexOf(true));
</script>

<template>
  <button class="talapo-chat-bubble" :aria-expanded="open" aria-label="Open Talapo chat" @click="open = !open">
    <div class="talapo-avatar-circle">✈️</div>
  </button>

  <Transition name="chat">
    <div v-if="open" class="talapo-chat-window" role="dialog" aria-label="Talapo Bot">
      <div class="talapo-chat-header">
        <div class="talapo-avatar-small">✈️</div>
        <div class="ttl">
          <h4>Talapo Bot</h4>
          <small>{{ mode === 'translator' ? 'Translator mode' : 'El Salvador travel expert 🇸🇻' }}</small>
        </div>
        <button class="hbtn" aria-label="New chat" title="New chat" @click="newChat"><i class="fas fa-rotate-left"></i></button>
        <button class="hbtn" aria-label="Close" @click="open = false"><i class="fas fa-xmark"></i></button>
      </div>

      <div class="toolbar" role="toolbar" aria-label="Talapo tools">
        <button v-for="t in tools" :key="t.id" :disabled="busy" @click="openTool(t.id)"><i class="fas" :class="t.icon"></i> {{ t.label }}</button>
        <button :class="{ on: mode === 'translator' }" @click="setMode(mode === 'translator' ? 'guide' : 'translator')"><i class="fas fa-repeat"></i> Translator</button>
      </div>

      <div ref="box" class="talapo-chat-messages">
        <template v-for="(m, i) in messages" :key="i">
          <!-- Tarjetas de herramientas -->
          <div v-if="m.card === 'planner'" class="msg bot-msg card">
            <p class="ct"><i class="fas fa-map-location-dot"></i> Plan my trip</p>
            <label>Days
              <select v-model.number="planner.days"><option v-for="d in 7" :key="d" :value="d">{{ d }} {{ d === 1 ? 'day' : 'days' }}</option></select>
            </label>
            <label>Budget
              <select v-model="planner.budget"><option value="low">Budget</option><option value="mid">Mid-range</option><option value="high">Comfortable</option></select>
            </label>
            <label>Starting from (optional)
              <input v-model="planner.from" type="text" maxlength="40" placeholder="e.g. San Salvador" />
            </label>
            <p class="lbl">Interests (up to 4)</p>
            <div class="pills">
              <button v-for="x in INTERESTS" :key="x" type="button" :class="{ on: planner.interests.includes(x) }" @click="toggleInterest(x)">{{ x }}</button>
            </div>
            <button class="primary" :disabled="busy" @click="createPlan">Create my plan</button>
          </div>

          <div v-else-if="m.card === 'phrases'" class="msg bot-msg card">
            <p class="ct"><i class="fas fa-language"></i> Useful Spanish phrases</p>
            <div v-for="g in PHRASES" :key="g.group" class="grp">
              <p class="lbl">{{ g.group }}</p>
              <button v-for="[en, es] in g.items" :key="es" class="phrase" :title="'Copy: ' + es" @click="sendPhrase(es)">
                <span class="es">{{ es }}</span><span class="en">{{ en }}</span>
              </button>
            </div>
            <p class="lbl">Local slang</p>
            <p v-for="[es, en] in SLANG" :key="es" class="slang"><b>{{ es }}</b> — {{ en }}</p>
            <small class="hint">Tap a phrase to copy it. Want more? Turn on Translator mode.</small>
          </div>

          <div v-else-if="m.card === 'facts'" class="msg bot-msg card">
            <p class="ct"><i class="fas fa-circle-info"></i> El Salvador quick facts</p>
            <dl><template v-for="[k, v] in FACTS" :key="k"><dt>{{ k }}</dt><dd>{{ v }}</dd></template></dl>
            <button class="link" @click="go('/emergency')">Emergency services</button>
          </div>

          <div v-else-if="m.card === 'passport'" class="msg bot-msg card">
            <p class="ct"><i class="fas fa-passport"></i> My passport</p>
            <template v-if="!auth.isAuthenticated">
              <p>Sign in to collect stamps at Talapo Stands and keep your daily streak.</p>
              <button class="primary" @click="go('/login')">Sign in</button>
            </template>
            <template v-else-if="!hasPassport">
              <p>You don't have a passport yet. Create it in a minute and start collecting stamps.</p>
              <button class="primary" @click="go('/passport')">Create my passport</button>
            </template>
            <template v-else>
              <div class="stats">
                <div><strong>{{ stampCount }}</strong><span>Stamps</span></div>
                <div><strong>{{ passport.streak }}</strong><span>Day streak</span></div>
                <div><strong>{{ passport.longestStreak }}</strong><span>Best streak</span></div>
              </div>
              <p class="small">Visit a Talapo Stand and fill in the zone form to earn your next stamp.</p>
              <button class="primary" @click="go('/passport')">Open my passport</button>
            </template>
          </div>

          <div v-else-if="m.card === 'contests'" class="msg bot-msg card">
            <p class="ct"><i class="fas fa-trophy"></i> Talapo Contests</p>
            <ul class="clist"><li v-for="c in challenges" :key="c.slug"><b>{{ c.title }}</b></li></ul>
            <p class="small">Sign in, choose a challenge and send your entry. The team grades it and the best scores reach the ranking.</p>
            <button class="primary" @click="go('/contests')">See the contests</button>
          </div>

          <!-- Mensajes normales -->
          <div v-else class="msg" :class="[m.role === 'user' ? 'user-msg' : 'bot-msg', { err: m.error }]">
            <div class="md" @click="onMsgClick" v-html="render(m.content)"></div>
            <div v-if="m.role === 'assistant' && !m.error && !m.welcome" class="acts">
              <button title="Copy" aria-label="Copy answer" @click="copy(m.content)"><i class="fas fa-copy"></i></button>
              <button v-if="i === lastBotIndex" title="Try again" aria-label="Regenerate answer" :disabled="busy" @click="regenerate"><i class="fas fa-rotate"></i></button>
              <button v-for="l in linksFor(m.content)" :key="l.to" class="go" @click="go(l.to)">{{ l.label }}</button>
            </div>
          </div>
        </template>

        <div v-if="busy" class="msg bot-msg-thinking"><b>✈️ Talapo is thinking...</b></div>
        <div v-if="messages.length === 1 && !busy" class="chips">
          <button v-for="s in suggestions" :key="s" @click="send(s)">{{ s }}</button>
        </div>
      </div>

      <form class="talapo-chat-footer" @submit.prevent="send()">
        <input v-model="input" type="text" :placeholder="mode === 'translator' ? 'Text to translate...' : 'Type your question...'" aria-label="Your question" maxlength="1000">
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

/* ===== Talapo Bot v2: herramientas, tarjetas y tablet ===== */
.talapo-avatar-small { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,.15); display: grid; place-items: center; font-size: 1.2rem; flex: none; }
.talapo-chat-header { padding: 14px 16px; gap: 12px; }
.talapo-chat-header .ttl { flex: 1; min-width: 0; }
.hbtn { background: none; border: 0; color: #fff; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; font-size: 1rem; }
.hbtn:hover { background: rgba(255,255,255,.15); }
.close-chat-btn { position: static; }

.toolbar { display: flex; gap: 6px; overflow-x: auto; padding: 10px 12px; background: #fff; border-bottom: 1px solid #E2EAF0; scrollbar-width: none; flex: none; }
.toolbar::-webkit-scrollbar { display: none; }
.toolbar button { flex: none; display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid #cbdbe2; background: #fff; color: #0A2F44; border-radius: 30px; padding: 7px 12px; font: inherit; font-size: .82rem; font-weight: 600; cursor: pointer; white-space: nowrap; min-height: 36px; }
.toolbar button:hover:not(:disabled) { border-color: #1C6E6B; color: #1C6E6B; }
.toolbar button.on { background: #1C6E6B; border-color: #1C6E6B; color: #fff; }
.toolbar button:disabled { opacity: .5; cursor: default; }

.md :deep(p) { margin: 0 0 .5em; } .md :deep(p:last-child) { margin-bottom: 0; }
.md :deep(ul), .md :deep(ol) { margin: .3em 0 .5em; padding-left: 1.3em; }
.md :deep(li) { margin: .15em 0; }
.md :deep(a) { color: #1C6E6B; font-weight: 700; }
.user-msg .md :deep(a) { color: #fff; }
.msg.err { border-color: #f0c9c2; background: #fff7f5; }
.acts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.acts button { background: #EEF6F6; color: #1C6E6B; border: 0; border-radius: 20px; padding: 5px 10px; font: inherit; font-size: .78rem; font-weight: 700; cursor: pointer; min-height: 30px; }
.acts button.go { background: #fff; border: 1.5px solid #1C6E6B; }
.acts button:hover:not(:disabled) { background: #1C6E6B; color: #fff; }

.card { max-width: 100%; width: 100%; display: grid; gap: 8px; }
.card .ct { margin: 0; font-weight: 800; color: #0A2F44; }
.card .ct i { color: #1C6E6B; margin-right: 4px; }
.card label { display: grid; gap: 3px; font-size: .78rem; font-weight: 700; color: #58717f; }
.card select, .card input { font: inherit; font-size: .9rem; padding: 8px 10px; border: 1.5px solid #dce7ea; border-radius: 10px; background: #fff; color: #0A2F44; min-height: 40px; }
.card .lbl { margin: 4px 0 0; font-size: .78rem; font-weight: 700; color: #58717f; }
.card .pills { display: flex; flex-wrap: wrap; gap: 6px; }
.card .pills button { border: 1.5px solid #cbdbe2; background: #fff; border-radius: 20px; padding: 6px 12px; font: inherit; font-size: .82rem; font-weight: 600; color: #0A2F44; cursor: pointer; min-height: 34px; }
.card .pills button.on { background: #1C6E6B; border-color: #1C6E6B; color: #fff; }
.card .primary { background: #E46D5C; color: #fff; border: 0; border-radius: 30px; padding: 10px 16px; font: inherit; font-weight: 800; cursor: pointer; min-height: 42px; }
.card .primary:disabled { opacity: .5; }
.card .link { background: none; border: 0; color: #1C6E6B; font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; justify-self: start; padding: 0; }
.card .small, .card .hint { color: #58717f; font-size: .82rem; margin: 0; }
.card .phrase { display: flex; flex-direction: column; align-items: flex-start; width: 100%; background: #F4F9FC; border: 0; border-radius: 10px; padding: 7px 10px; margin-top: 5px; cursor: pointer; font: inherit; text-align: left; }
.card .phrase:hover { background: #E3F0F0; }
.card .phrase .es { font-weight: 700; color: #0A2F44; } .card .phrase .en { font-size: .78rem; color: #58717f; }
.card .slang { margin: 2px 0; font-size: .88rem; }
.card dl { margin: 0; display: grid; gap: 6px; }
.card dt { font-weight: 800; color: #1C6E6B; font-size: .8rem; text-transform: uppercase; letter-spacing: .4px; }
.card dd { margin: 0 0 2px; font-size: .9rem; }
.card .clist { margin: 0; padding-left: 1.1em; }
.card .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.card .stats div { background: #F4F9FC; border-radius: 12px; padding: 8px; text-align: center; }
.card .stats strong { display: block; font-size: 1.4rem; color: #0A2F44; } .card .stats span { font-size: .72rem; color: #58717f; }

/* Tablet: ventana más grande y cómoda para tocar */
@media (min-width: 521px) and (max-width: 1100px) {
  .talapo-chat-bubble { bottom: 24px; right: 24px; }
  .talapo-chat-window { width: min(440px, 88vw); height: min(680px, 78vh); right: 24px; bottom: 100px; }
  .msg { font-size: 1rem; }
}
</style>
