/**
 * Cola de formularios del Stand para cuando NO hay internet.
 * Se guardan en la tablet (localStorage) y se envían solos cuando vuelve la conexión.
 */
import { ref } from 'vue';
import { insforge, isConfigured } from '@/lib/insforge';

const KEY = 'talapo_kiosk_queue';
export const pending = ref(read().length);
export const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);

function read() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function write(list) { localStorage.setItem(KEY, JSON.stringify(list)); pending.value = list.length; }

/** ¿El error es por falta de conexión (y no un error real de datos)? */
export function isNetworkError(e) {
  return !navigator.onLine || e instanceof TypeError || /network|failed to fetch|load failed|timeout|ERR_INTERNET/i.test(String(e?.message || e));
}

export function enqueue(payload) {
  const list = read();
  list.push({ payload, savedAt: new Date().toISOString() });
  write(list.slice(-200)); // tope de seguridad
}

/** Pide al servidor que avise al equipo de reportes urgentes (no recibe datos; es seguro). */
export function notifyUrgent() {
  if (!isConfigured) return;
  insforge.functions.invoke('urgent-alert', { body: {} }).catch(() => {});
}

let flushing = false;
/** Envía todo lo pendiente. Devuelve cuántos se enviaron. */
export async function flushQueue() {
  if (flushing || !isConfigured || !navigator.onLine) return 0;
  flushing = true;
  let sent = 0; let urgent = false;
  try {
    let list = read();
    while (list.length) {
      const item = list[0];
      const { error } = await insforge.database.rpc('stand_submit', item.payload);
      if (error) {
        if (isNetworkError(error)) break;           // se fue la señal otra vez: reintentar luego
        console.warn('[Talapo] reporte descartado', error.message); // dato inválido: no bloquear la cola
      } else {
        sent += 1;
        if (item.payload.p_urgency === 'high') urgent = true;
      }
      list = list.slice(1); write(list);
    }
  } catch (e) {
    if (!isNetworkError(e)) console.warn('[Talapo] cola', e);
  } finally { flushing = false; }
  if (urgent) notifyUrgent();
  return sent;
}

let started = false;
export function startQueue() {
  if (started) return;
  started = true;
  window.addEventListener('online', () => { online.value = true; flushQueue(); });
  window.addEventListener('offline', () => { online.value = false; });
  setInterval(flushQueue, 60_000);
  flushQueue();
}
