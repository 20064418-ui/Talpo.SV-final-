import { reactive } from 'vue';

export const toasts = reactive([]);
let id = 0;

/** toast('Itinerary saved', 'ok' | 'error' | 'info') */
export function toast(message, type = 'ok', ms = 3200) {
  const t = { id: ++id, message, type };
  toasts.push(t);
  setTimeout(() => { const i = toasts.indexOf(t); if (i >= 0) toasts.splice(i, 1); }, ms);
}
