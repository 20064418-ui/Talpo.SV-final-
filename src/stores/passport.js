import { defineStore } from 'pinia';
import { insforge, unwrap, isConfigured } from '@/lib/insforge';
import { useAuthStore } from './auth';

/**
 * Perfil del Pasaporte Talapo + racha + concursos + sellos.
 * Todo se carga desde InsForge después de iniciar sesión (RLS: cada quien ve lo suyo).
 */
export const usePassportStore = defineStore('passport', {
  state: () => ({
    profile: null,       // fila de public.profiles
    activity: [],        // fechas activas (últimas 12 semanas) para el calendario de racha
    stamps: [],          // lugares visitados
    loaded: false,
    loading: false,
  }),
  getters: {
    hasPassport: (s) => Boolean(s.profile?.passport_number),
    streak: (s) => s.profile?.current_streak ?? 0,
    longestStreak: (s) => s.profile?.longest_streak ?? 0,
    daysInFamily: (s) => {
      if (!s.profile?.joined_at) return 0;
      return Math.max(1, Math.ceil((Date.now() - new Date(s.profile.joined_at)) / 864e5));
    },
    weeksActive: (s) => new Set(s.activity.map((d) => isoWeek(d))).size,
  },
  actions: {
    reset() { this.$reset(); },

    /** ¿Existe fila de perfil? Sirve para saber si es la primera vez (OAuth). */
    async exists(userId) {
      const rows = await unwrap(insforge.database.from('profiles').select('id').eq('id', userId).limit(1));
      return rows.length > 0;
    },

    /** Crea la fila de perfil vacía (el pasaporte se completa luego en /passport). */
    async ensureProfile() {
      const auth = useAuthStore();
      if (!auth.user) return;
      await unwrap(insforge.database.from('profiles').upsert(
        [{ id: auth.user.id, display_name: auth.displayName, avatar_url: auth.avatar }],
        { onConflict: 'id', ignoreDuplicates: true },
      ));
    },

    /** Guarda el @usuario (único). Lanza 'USERNAME_TAKEN' o 'USERNAME_FORMAT'. */
    async setUsername(raw) {
      const auth = useAuthStore();
      const username = normalizeUsername(raw);
      if (!USERNAME_RE.test(username)) throw new Error('USERNAME_FORMAT');
      const { data, error } = await insforge.database.from('profiles').update({ username }).eq('id', auth.user.id).select();
      if (error) throw new Error(/duplicate|unique/i.test(error.message) ? 'USERNAME_TAKEN' : error.message);
      if (this.profile) this.profile.username = data?.[0]?.username ?? username;
      return username;
    },

    async usernameAvailable(raw) {
      const { data, error } = await insforge.database.rpc('username_available', { p_username: normalizeUsername(raw) });
      if (error) return true; // si no se puede comprobar, la base de datos lo validará al guardar
      return Array.isArray(data) ? !!data[0] : !!data;
    },

    /** Carga persistente al iniciar sesión: perfil, racha (se actualiza hoy) y sellos. */
    async load(force = false) {
      const auth = useAuthStore();
      if (!auth.user || !isConfigured || (this.loaded && !force)) return;
      this.loading = true;
      try {
        await this.ensureProfile();
        // touch_streak() registra el día de hoy y recalcula la racha en el servidor
        const profile = await unwrap(insforge.database.rpc('touch_streak'));
        this.profile = Array.isArray(profile) ? profile[0] : profile;

        const since = new Date(Date.now() - 84 * 864e5).toISOString().slice(0, 10);
        const [activity, stamps] = await Promise.all([
          unwrap(insforge.database.from('activity_log').select('active_date')
            .eq('user_id', auth.user.id).gte('active_date', since)),
          unwrap(insforge.database.from('passport_stamps').select('*')
            .eq('user_id', auth.user.id).order('created_at')),
        ]);
        this.activity = activity.map((r) => r.active_date);
        this.stamps = stamps;
        this.loaded = true;
        this.sendWelcomeOnce();
        // Usuarios que se registraron antes: copiar el @usuario que eligieron al registrarse
        const pending = auth.user.profile?.username;
        if (!this.profile?.username && pending) this.setUsername(pending).catch(() => {});
      } finally {
        this.loading = false;
      }
    },

    /** Correo de bienvenida (una sola vez y solo con el correo ya verificado). */
    sendWelcomeOnce() {
      const auth = useAuthStore();
      if (!auth.user?.emailVerified || this.profile?.welcome_sent_at) return;
      insforge.functions.invoke('welcome-email', { body: {} })
        .then(({ data }) => { if (data?.sent && this.profile) this.profile.welcome_sent_at = new Date().toISOString(); })
        .catch((e) => console.warn('[Talapo] welcome email', e));
    },

    /** Mostrar u ocultar mi perfil en la comunidad de viajeros. */
    async setPublic(is_public) {
      const auth = useAuthStore();
      const rows = await unwrap(insforge.database.from('profiles').update({ is_public }).eq('id', auth.user.id).select());
      this.profile = rows[0];
    },

    async uploadPhoto(file) {
      const auth = useAuthStore();
      const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
      const data = await unwrap(insforge.storage.from('passport-photos')
        .upload(`${auth.user.id}/photo-${Date.now()}.${ext}`, file));
      return data.url;
    },

    async savePassport(fields) {
      const auth = useAuthStore();
      const rows = await unwrap(insforge.database.from('profiles')
        .update({ ...fields, passport_created_at: this.profile?.passport_created_at || new Date().toISOString() })
        .eq('id', auth.user.id).select());
      this.profile = rows[0];
      if (fields.display_name) await insforge.auth.setProfile({ name: fields.display_name });
    },

    async addStamp(place_name) {
      const auth = useAuthStore();
      const rows = await unwrap(insforge.database.from('passport_stamps')
        .insert([{ user_id: auth.user.id, place_name }]).select());
      this.stamps.push(rows[0]);
    },

    async toggleStamp(stamp) {
      const visited_at = stamp.visited_at ? null : new Date().toISOString();
      const rows = await unwrap(insforge.database.from('passport_stamps')
        .update({ visited_at }).eq('id', stamp.id).select());
      Object.assign(stamp, rows[0]);
    },

    /** Foto de visita de un lugar (como en el pasaporte original): lo marca como visitado. */
    async stampPhoto(stamp, file) {
      const auth = useAuthStore();
      const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const up = await unwrap(insforge.storage.from('passport-photos')
        .upload(`${auth.user.id}/stamps/${stamp.id}-${Date.now()}.${ext}`, file));
      const rows = await unwrap(insforge.database.from('passport_stamps')
        .update({ photo_url: up.url, visited_at: new Date().toISOString() }).eq('id', stamp.id).select());
      Object.assign(stamp, rows[0]);
    },

    /** Los 5 destinos que el pasaporte original traía por defecto. */
    async seedDefaultStamps() {
      const auth = useAuthStore();
      if (this.stamps.length) return;
      const names = ['El Tunco Beach', 'Suchitoto', 'San Salvador Volcano', 'Lake Coatepeque', 'Flower Route'];
      this.stamps = await unwrap(insforge.database.from('passport_stamps')
        .insert(names.map((place_name) => ({ user_id: auth.user.id, place_name }))).select());
    },

    async removeStamp(stamp) {
      await unwrap(insforge.database.from('passport_stamps').delete().eq('id', stamp.id));
      this.stamps = this.stamps.filter((s) => s.id !== stamp.id);
    },
  },
});

export function isoWeek(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  return `${d.getFullYear()}-${Math.round(((d - firstThursday) / 864e5 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7) + 1}`;
}

/** Usuario válido: 3–24 caracteres, minúsculas, números, punto y guion bajo. */
export const USERNAME_RE = /^[a-z0-9._]{3,24}$/;
export function normalizeUsername(raw = '') {
  return String(raw).trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._]/g, '');
}
