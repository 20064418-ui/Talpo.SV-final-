import { ref } from 'vue';
import { insforge, isConfigured } from '@/lib/insforge';

/** Ajustes por defecto si la migración 20261006010000 aún no se ejecutó */
export const DEFAULT_SETTINGS = {
  plan_requests_open: true,
  messages_open: true,
  auto_reply: 'Thanks for writing to Talapo! We usually answer within a few hours.',
};

const cache = new Map();
/** Lee una fila de site_content (settings, home…). Devuelve null si no existe. */
export async function getSiteContent(key, { fresh = false } = {}) {
  if (!isConfigured) return null;
  if (!fresh && cache.has(key)) return cache.get(key);
  const p = insforge.database.from('site_content').select('value').eq('key', key).limit(1)
    .then(({ data, error }) => (error ? null : data?.[0]?.value ?? null), () => null);
  cache.set(key, p);
  return p;
}
export async function getSettings(opts) {
  return { ...DEFAULT_SETTINGS, ...((await getSiteContent('settings', opts)) || {}) };
}
export async function saveSiteContent(key, value, userId) {
  const { error } = await insforge.database.from('site_content')
    .upsert([{ key, value, updated_at: new Date().toISOString(), updated_by: userId || null }], { onConflict: 'key' });
  if (error) throw new Error(error.message);
  cache.delete(key);
}

/* ---------- Mensajes sin leer (para el navbar) ---------- */
export const unreadMessages = ref(0);
let unreadTimer = null;
export async function refreshUnread(userId) {
  if (!userId || !isConfigured) { unreadMessages.value = 0; return; }
  const { data, error } = await insforge.database.from('support_threads').select('user_unread').eq('profile_id', userId).gt('user_unread', 0);
  unreadMessages.value = error ? 0 : (data || []).reduce((t, r) => t + (r.user_unread || 0), 0);
}
export function watchUnread(userId) {
  clearInterval(unreadTimer);
  if (!userId) { unreadMessages.value = 0; return; }
  refreshUnread(userId).catch(() => {});
  unreadTimer = setInterval(() => { if (!document.hidden) refreshUnread(userId).catch(() => {}); }, 60000);
}
