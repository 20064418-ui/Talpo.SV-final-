<script setup>
// Formulario del stand: SIEMPRE se puede llenar (sin cuenta). Al final la persona escribe su
// @usuario y recibe el sello; el reporte queda ligado a su N° de pasaporte para saber quién es.
// Se guarda en InsForge con la función segura stand_submit (tabla stand_reports).
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import QrCode from '@/components/kiosk/QrCode.vue';
import { insforge, isConfigured } from '@/lib/insforge';
import { trashTypes } from '@/data/stands';
import { normalizeUsername } from '@/stores/passport';
import { enqueue, isNetworkError, notifyUrgent } from '@/lib/kioskQueue';
import { useKioskI18n } from '@/i18n/kiosk';
const { t, locale } = useKioskI18n();

const props = defineProps({ stand: { type: Object, required: true } });
const router = useRouter();

const step = ref(0);           // 0 zona · 1 basura · 2 urgencia · 3 comentario · 4 usuario y envío · 5 resultado
const TOTAL = 5;
const form = reactive({ passport: '', zone: '', hasTrash: null, trash: [], urgency: '', comment: '' });
const sending = ref(false);
const error = ref('');
const result = ref(null);
let homeTimer;

const zones = computed(() => [
  { id: 'clean', emoji: '😊', label: t('zClean'), text: t('zCleanT') },
  { id: 'dirty', emoji: '😐', label: t('zDirty'), text: t('zDirtyT') },
  { id: 'very_dirty', emoji: '😟', label: t('zVery'), text: t('zVeryT') },
]);
const urgencies = computed(() => [
  { id: 'low', emoji: '🟢', label: t('uLow'), text: t('uLowT') },
  { id: 'medium', emoji: '🟡', label: t('uMed'), text: t('uMedT') },
  { id: 'high', emoji: '🔴', label: t('uHigh'), text: t('uHighT') },
]);

const canNext = computed(() => [!!form.zone, form.hasTrash === false || (form.hasTrash && form.trash.length), !!form.urgency, true, true][step.value]);
function next() { if (canNext.value) step.value = Math.min(step.value + 1, TOTAL - 1); }
function back() { step.value = Math.max(step.value - 1, 0); }
function pickZone(z) { form.zone = z; if (z === 'clean' && form.hasTrash === null) form.hasTrash = false; setTimeout(next, 180); }
function pickTrash(v) { form.hasTrash = v; if (!v) { form.trash = []; setTimeout(next, 180); } }
function toggleType(id) { form.trash = form.trash.includes(id) ? form.trash.filter((t) => t !== id) : [...form.trash, id]; }
function pickUrgency(u) { form.urgency = u; setTimeout(next, 180); }

/* Confirma quién es mientras escribe el usuario (nombre + pasaporte parcialmente oculto) */
const lookup = ref(null);
let lookupTimer; let lookupSeq = 0;
watch(() => form.passport, (v) => {
  clearTimeout(lookupTimer); lookup.value = null;
  if (v.length < 3 || !isConfigured || !navigator.onLine) return;
  lookupTimer = setTimeout(async () => {
    const seq = ++lookupSeq;
    try {
      const { data, error: e } = await insforge.database.rpc('stand_lookup_user', { p_user: v });
      if (seq === lookupSeq && !e) lookup.value = Array.isArray(data) ? data[0] : data;
    } catch { /* sin conexión: se envía igual */ }
  }, 450);
});

async function submit(withUser = true) {
  if (!withUser) form.passport = '';
  error.value = ''; sending.value = true;
  const payload = {
    p_stand: props.stand.id,
    p_passport: form.passport.trim(),
    p_zone: form.zone,
    p_has_trash: !!form.hasTrash,
    p_trash: form.trash,
    p_urgency: form.urgency,
    p_comment: form.comment.trim(),
  };
  const saveOffline = () => {
    enqueue(payload);
    result.value = { offline: true };
    step.value = TOTAL;
  };
  try {
    if (!isConfigured) throw new Error(t('notConnected'));
    if (!navigator.onLine) { saveOffline(); return; }
    const { data, error: e } = await insforge.database.rpc('stand_submit', payload);
    if (e) {
      if (isNetworkError(e)) { saveOffline(); return; }
      throw new Error(e.message);
    }
    result.value = Array.isArray(data) ? data[0] : data;
    step.value = TOTAL;
    if (form.urgency === 'high') notifyUrgent(); // 🔴 avisa al equipo por correo
  } catch (e) {
    if (isNetworkError(e)) saveOffline();
    else error.value = e.message || t('genericError');
  } finally {
    sending.value = false;
    if (step.value === TOTAL) {
      homeTimer = setTimeout(() => router.replace({ name: 'kiosk-home', params: { stand: props.stand.id } }), 15000);
    }
  }
}
/* Si se equivocó al escribir el usuario, lo corrige y recibe el sello igual */
const retry = reactive({ user: '', busy: false, error: '' });
async function claim() {
  retry.error = ''; retry.busy = true;
  try {
    const { data, error: e } = await insforge.database.rpc('stand_claim_stamp', { p_report: result.value.report_id, p_user: retry.user.trim() });
    if (e) throw new Error(e.message);
    const r = Array.isArray(data) ? data[0] : data;
    if (r?.passport_found) { form.passport = retry.user.trim(); result.value = { ...result.value, ...r }; }
    else retry.error = t('lookupNone', { user: retry.user.trim() });
  } catch (e) { retry.error = e.message || t('genericError'); }
  finally { retry.busy = false; }
}
function holdHome() { clearTimeout(homeTimer); } // mientras corrige su usuario no regresa al inicio
function restart() {
  clearTimeout(homeTimer);
  Object.assign(retry, { user: '', busy: false, error: '' }); lookup.value = null;
  Object.assign(form, { passport: '', zone: '', hasTrash: null, trash: [], urgency: '', comment: '' });
  result.value = null; step.value = 0;
}
onBeforeUnmount(() => { clearTimeout(homeTimer); clearTimeout(lookupTimer); });
const registerUrl = computed(() => `${location.origin}/register`);
</script>

<template>
  <section class="page">
    <div v-if="step < TOTAL" class="progress" aria-hidden="true">
      <span v-for="i in TOTAL" :key="i" :class="{ on: i - 1 <= step }"></span>
    </div>

    <Transition name="slide" mode="out-in">
      <!-- 0 · ESTADO DE LA ZONA -->
      <div v-if="step === 0" key="s0" class="q">
        <span class="big">🌳</span>
        <h1>{{ t('zoneQ') }}</h1>
        <div class="options three">
          <button v-for="z in zones" :key="z.id" class="opt" :class="{ on: form.zone === z.id }" @click="pickZone(z.id)">
            <span class="oe">{{ z.emoji }}</span><b>{{ z.label }}</b><small>{{ z.text }}</small>
          </button>
        </div>
      </div>

      <!-- 1 · BASURA -->
      <div v-else-if="step === 1" key="s1" class="q">
        <span class="big">🗑️</span>
        <h1>{{ t('trashQ') }}</h1>
        <div class="options two">
          <button class="opt" :class="{ on: form.hasTrash === true }" @click="pickTrash(true)"><span class="oe">👍</span><b>{{ t('yes') }}</b></button>
          <button class="opt" :class="{ on: form.hasTrash === false }" @click="pickTrash(false)"><span class="oe">✋</span><b>{{ t('no') }}</b></button>
        </div>
        <Transition name="slide">
          <div v-if="form.hasTrash" class="types">
            <h2>{{ t('trashTypeQ') }} <small>{{ t('chooseAll') }}</small></h2>
            <div class="chips">
              <button v-for="tt in trashTypes" :key="tt.id" class="chip" :class="{ on: form.trash.includes(tt.id) }" @click="toggleType(tt.id)">
                <span>{{ tt.emoji }}</span> {{ t(tt.key) }} <i v-if="form.trash.includes(tt.id)" class="fas fa-check"></i>
              </button>
            </div>
          </div>
        </Transition>
        <div class="nav">
          <button class="btn ghost" @click="back"><i class="fas fa-arrow-left"></i> {{ t('backBtn') }}</button>
          <button v-if="form.hasTrash !== null" class="btn main" :disabled="!canNext" @click="next">{{ t('continue') }} <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>

      <!-- 2 · URGENCIA -->
      <div v-else-if="step === 2" key="s2" class="q">
        <span class="big">🚨</span>
        <h1>{{ t('urgQ') }}</h1>
        <div class="options three">
          <button v-for="u in urgencies" :key="u.id" class="opt" :class="{ on: form.urgency === u.id }" @click="pickUrgency(u.id)">
            <span class="oe">{{ u.emoji }}</span><b>{{ u.label }}</b><small>{{ u.text }}</small>
          </button>
        </div>
        <div class="nav"><button class="btn ghost" @click="back"><i class="fas fa-arrow-left"></i> {{ t('backBtn') }}</button></div>
      </div>

      <!-- 3 · COMENTARIO -->
      <div v-else-if="step === 3" key="s3" class="q">
        <span class="big">💬</span>
        <h1>{{ t('commentQ') }} <small>{{ t('optional') }}</small></h1>
        <textarea v-model="form.comment" maxlength="500" rows="4" :placeholder="t('commentPh')"></textarea>
        <div class="nav">
          <button class="btn ghost" @click="back"><i class="fas fa-arrow-left"></i> {{ t('backBtn') }}</button>
          <button class="btn main" @click="next">{{ t('continue') }} <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>

      <!-- 4 · USUARIO (sello) Y ENVÍO -->
      <div v-else-if="step === 4" key="s4" class="q">
        <span class="big">🛂</span>
        <h1>{{ t('formStamp') }}</h1>
        <p v-html="t('formStampText', { name: stand.name })"></p>
        <div class="user-box">
          <span>@</span>
          <input v-model="form.passport" class="pass-input" autocomplete="off" autocapitalize="none" spellcheck="false"
                 placeholder="your.username" maxlength="24" @input="form.passport = normalizeUsername(form.passport)" @keyup.enter="form.passport.length >= 3 && submit(true)" />
        </div>
        <p v-if="lookup?.found" class="found"><i class="fas fa-circle-check"></i> {{ t('lookupFound', { name: lookup.first_name || t('traveler'), num: lookup.passport_masked || '—' }) }}</p>
        <p v-else-if="lookup && !lookup.found" class="notfound"><i class="fas fa-circle-exclamation"></i> {{ t('lookupNone', { user: form.passport }) }}</p>
        <p v-else class="hint">{{ t('formUserHint') }} {{ t('stampStepHint') }}</p>
        <div class="summary">
          <span>{{ zones.find((z) => z.id === form.zone)?.emoji }} {{ zones.find((z) => z.id === form.zone)?.label }}</span>
          <span>🗑️ {{ form.hasTrash ? form.trash.map((id) => t(trashTypes.find((x) => x.id === id)?.key)).join(', ') : t('noTrash') }}</span>
          <span>{{ urgencies.find((u) => u.id === form.urgency)?.emoji }} {{ urgencies.find((u) => u.id === form.urgency)?.label }}</span>
        </div>
        <p v-if="error" class="err"><i class="fas fa-triangle-exclamation"></i> {{ error }}</p>
        <div class="nav">
          <button class="btn ghost" :disabled="sending" @click="back"><i class="fas fa-arrow-left"></i> {{ t('backBtn') }}</button>
          <button class="btn ghost" :disabled="sending" @click="submit(false)">{{ t('sendNoStamp') }}</button>
          <button class="btn main" :disabled="sending || form.passport.length < 3" @click="submit(true)">
            <i class="fas" :class="sending ? 'fa-spinner fa-spin' : 'fa-stamp'"></i> {{ sending ? t('sending') : t('sendStamp') }}
          </button>
        </div>
      </div>

      <!-- 5 · RESULTADO -->
      <div v-else key="s5" class="q done">
        <template v-if="result?.offline">
          <span class="big">📶</span>
          <h1>{{ t('savedOffline') }}</h1>
          <p>{{ t('savedOfflineText') }}</p>
        </template>
        <template v-else-if="result?.passport_found">
          <div class="stamp" :class="{ again: result.already_stamped }">
            <span>TALAPO.SV</span><b>{{ stand.name.toUpperCase() }}</b><small>{{ new Date().toLocaleDateString(locale) }}</small>
          </div>
          <h1>{{ t(result.already_stamped ? 'welcomeBack' : 'stamped', { name: result.first_name || t('traveler') }) }}</h1>
          <p v-if="result.passport_masked" class="pno"><i class="fas fa-passport"></i> {{ t('passportNo') }} <b>{{ result.passport_masked }}</b></p>
          <p v-html="t('stampedText', { stamp: result.stamp_name })"></p>
        </template>
        <template v-else>
          <span class="big">💚</span>
          <h1>{{ t('thanks') }}</h1>
          <p v-if="form.passport" v-html="t('userNotFound', { user: form.passport })"></p>
          <p v-else>{{ t('reportSaved') }}</p>
          <div v-if="form.passport && result?.report_id" class="retry">
            <div class="user-box"><span>@</span>
              <input v-model="retry.user" class="pass-input" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="your.username" maxlength="24"
                     @focus="holdHome" @input="retry.user = normalizeUsername(retry.user)" @keyup.enter="retry.user.length >= 3 && claim()" />
            </div>
            <p v-if="retry.error" class="err">{{ retry.error }}</p>
            <button class="btn main" :disabled="retry.busy || retry.user.length < 3" @click="claim">
              <i class="fas" :class="retry.busy ? 'fa-spinner fa-spin' : 'fa-stamp'"></i> {{ t('getStamp') }}
            </button>
          </div>
          <div class="qr-join">
            <QrCode :value="registerUrl" :size="130" :label="t('createPassport')" />
            <span><b>{{ t('createPassport') }}</b><br>{{ t('createPassportText') }}</span>
          </div>
        </template>
        <div class="nav">
          <button class="btn ghost" @click="restart">{{ t('newReport') }}</button>
          <RouterLink class="btn main" :to="{ name: 'kiosk-home', params: { stand: stand.id } }">{{ t('backHome') }}</RouterLink>
        </div>
        <p class="hint">{{ t('autoHome') }}</p>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.page { flex: 1; display: flex; flex-direction: column; align-items: center; padding: clamp(18px, 3vh, 36px) clamp(16px, 4vw, 44px); }
.progress { display: flex; gap: 8px; width: min(100%, 560px); margin-bottom: 22px; }
.progress span { flex: 1; height: 8px; border-radius: 8px; background: #dce7ea; transition: background .3s; }
.progress span.on { background: #C98A1B; }
.q { width: min(100%, 900px); background: #fff; border-radius: 28px; padding: clamp(22px, 4vw, 40px); text-align: center; box-shadow: 0 24px 40px -24px rgba(0,32,64,.4); }
.big { font-size: 3.4rem; display: block; }
.q h1 { margin: 8px 0 10px; font-size: clamp(1.6rem, 3.6vw, 2.4rem); color: #0A2F44; }
.q h1 small, .types h2 small { font-size: .55em; color: #8aa0ab; font-weight: 600; }
.q > p { font-size: 1.15rem; color: #4a6472; max-width: 46ch; margin: 0 auto 16px; line-height: 1.5; }
.user-box { display: flex; align-items: center; width: min(100%, 460px); margin: 0 auto; border: 3px solid #dce7ea; border-radius: 20px; background: #fff; transition: border-color .2s; }
.user-box:focus-within { border-color: #C98A1B; }
.user-box span { padding-left: 18px; font-size: 2rem; font-weight: 800; color: #C98A1B; }
.pass-input { flex: 1; min-width: 0; font: inherit; font-size: 2rem; font-weight: 800; letter-spacing: 1px; padding: 16px 16px 16px 6px; border: 0; background: none; outline: none; }
.found, .notfound { margin: 10px auto 0 !important; font-weight: 700; font-size: 1.05rem !important; }
.found { color: #1C6E6B !important; } .notfound { color: #b4432f !important; }
.pno { background: #EEF6F6; color: #1C6E6B !important; display: inline-block; border-radius: 30px; padding: 8px 16px; margin: 0 auto 10px !important; }
.pno b { letter-spacing: 2px; color: #0A2F44; }
.retry { display: grid; gap: 12px; justify-items: center; margin: 6px auto 12px; }
.hint { color: #8aa0ab !important; font-size: .95rem !important; margin-top: 10px !important; }
.options { display: grid; gap: 14px; margin: 18px 0; }
.options.three { grid-template-columns: repeat(3, 1fr); }
.options.two { grid-template-columns: repeat(2, 1fr); max-width: 520px; margin-inline: auto; }
.opt { display: grid; justify-items: center; gap: 6px; padding: 22px 12px; min-height: 150px; border-radius: 24px; border: 3px solid #e2ecef; background: #fff; font: inherit; color: #0A2F44; cursor: pointer; transition: border-color .2s, transform .15s, background .2s; }
.opt:active { transform: scale(.97); }
.opt.on { border-color: #C98A1B; background: #FFF8EA; }
.oe { font-size: 3rem; line-height: 1; }
.opt b { font-size: 1.3rem; }
.opt small { color: #58717f; font-size: .95rem; }
.types h2 { font-size: 1.3rem; color: #0A2F44; }
.chips { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.chip { display: inline-flex; align-items: center; gap: 8px; min-height: 58px; padding: 0 20px; border-radius: 40px; border: 2.5px solid #e2ecef; background: #fff; font: inherit; font-size: 1.1rem; font-weight: 700; color: #0A2F44; cursor: pointer; transition: all .15s; }
.chip span { font-size: 1.4rem; }
.chip.on { background: #0A2F44; border-color: #0A2F44; color: #fff; }
textarea { width: 100%; font: inherit; font-size: 1.15rem; padding: 16px; border-radius: 18px; border: 3px solid #dce7ea; resize: none; outline: none; }
textarea:focus { border-color: #C98A1B; }
.summary { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 16px 0 4px; }
.summary span { background: #EEF6F6; color: #1C6E6B; border-radius: 30px; padding: 8px 14px; font-weight: 700; }
.err { color: #c62828 !important; font-weight: 700; }
.nav { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 22px; }
.btn { min-height: 60px; padding: 0 28px; border-radius: 40px; font: inherit; font-size: 1.15rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; text-decoration: none; border: 0; transition: transform .15s, opacity .2s; }
.btn:active { transform: scale(.97); }
.btn:disabled { opacity: .45; cursor: default; }
.btn.main { background: #C98A1B; color: #fff; }
.btn.ghost { background: #EEF6F6; color: #1C6E6B; }
/* Sello animado */
.stamp { width: 210px; height: 210px; margin: 0 auto 10px; border-radius: 50%; border: 6px double #C0392B; color: #C0392B; display: grid; place-content: center; text-align: center; transform: rotate(-12deg); animation: stamp .55s cubic-bezier(.2,1.6,.4,1) both; background: rgba(192,57,43,.04); }
.stamp span { font-weight: 800; letter-spacing: 2px; }
.stamp b { font-size: 1.25rem; margin: 6px 0; letter-spacing: 1px; }
.stamp small { font-weight: 700; }
.stamp.again { border-color: #1C6E6B; color: #1C6E6B; }
@keyframes stamp { from { opacity: 0; transform: rotate(-12deg) scale(2.2); } to { opacity: 1; transform: rotate(-12deg) scale(1); } }
.qr-join { display: inline-flex; gap: 16px; align-items: center; text-align: left; background: #0A2F44; color: #fff; border-radius: 20px; padding: 14px 18px; margin-top: 10px; max-width: 520px; }
.slide-enter-active, .slide-leave-active { transition: opacity .25s ease, transform .3s ease; }
.slide-enter-from { opacity: 0; transform: translateX(30px); }
.slide-leave-to { opacity: 0; transform: translateX(-30px); }
@media (max-width: 700px) { .options.three { grid-template-columns: 1fr; } .opt { min-height: 110px; } .pass-input, .user-box span { font-size: 1.5rem; } }
</style>
