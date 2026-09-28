import { defineStore } from 'pinia';
import { insforge, unwrap, isConfigured } from '@/lib/insforge';
import { useAuthStore } from './auth';

/** Participaciones en Concursos Talapo + Ranking Talapo (vista pública). */
export const useContestsStore = defineStore('contests', {
  state: () => ({ entries: [], ranking: [], loaded: false }),
  getters: {
    count: (s) => s.entries.length,
    joined: (s) => (slug) => s.entries.some((e) => e.challenge === slug),
  },
  actions: {
    reset() { this.entries = []; this.loaded = false; },
    async load(force = false) {
      const auth = useAuthStore();
      if (!auth.user || (this.loaded && !force)) return;
      this.entries = await unwrap(insforge.database.from('contest_entries').select('*')
        .eq('user_id', auth.user.id).order('created_at', { ascending: false }));
      this.loaded = true;
    },
    async loadRanking() {
      if (!isConfigured) return;
      this.ranking = await unwrap(insforge.database.from('ranking_talapo').select('*').limit(10));
    },
    /** Una fila por reto elegido. El usuario puede inscribirse en varios retos. */
    async join({ participant_name, institution, grade, challenges }) {
      const auth = useAuthStore();
      const rows = challenges.map((challenge) => ({
        user_id: auth.user.id, participant_name, institution, grade, challenge,
      }));
      const saved = await unwrap(insforge.database.from('contest_entries')
        .upsert(rows, { onConflict: 'user_id,challenge' }).select());
      const others = this.entries.filter((e) => !challenges.includes(e.challenge));
      this.entries = [...saved, ...others];
      await this.loadRanking();
    },
  },
});
