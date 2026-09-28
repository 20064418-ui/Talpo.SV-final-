import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_URL;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY;

/** true cuando el proyecto aún no tiene .env.local configurado (modo demo). */
export const isConfigured = Boolean(baseUrl && !baseUrl.includes('tu-proyecto'));

if (!isConfigured) {
  console.warn('[Talapo] Falta VITE_INSFORGE_URL en .env.local — la app corre sin backend.');
}

/** Cliente único de InsForge para toda la SPA. */
export const insforge = createClient({
  baseUrl: isConfigured ? baseUrl : 'http://localhost:7130',
  anonKey,
});

/** Convierte { data, error } del SDK en data o lanza un Error legible. */
export async function unwrap(promise) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message || error.error || 'Unexpected server error');
  return data;
}
