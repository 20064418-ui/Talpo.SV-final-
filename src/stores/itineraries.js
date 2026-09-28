import { defineStore } from 'pinia';
import { insforge, unwrap } from '@/lib/insforge';
import { useAuthStore } from './auth';

/** Itinerarios guardados por usuario (tabla public.itineraries). */
export const useItinerariesStore = defineStore('itineraries', {
  state: () => ({ items: [], loaded: false, loading: false }),
  actions: {
    reset() { this.$reset(); },
    async load(force = false) {
      const auth = useAuthStore();
      if (!auth.user || (this.loaded && !force)) return;
      this.loading = true;
      try {
        this.items = await unwrap(insforge.database.from('itineraries').select('*')
          .eq('user_id', auth.user.id).order('created_at', { ascending: false }));
        this.loaded = true;
      } finally { this.loading = false; }
    },
    async save(itinerary) {
      const auth = useAuthStore();
      const rows = await unwrap(insforge.database.from('itineraries')
        .insert([{ ...itinerary, user_id: auth.user.id }]).select());
      this.items.unshift(rows[0]);
      return rows[0];
    },
    async rename(item, title) {
      const rows = await unwrap(insforge.database.from('itineraries')
        .update({ title }).eq('id', item.id).select());
      Object.assign(item, rows[0]);
    },
    async remove(item) {
      await unwrap(insforge.database.from('itineraries').delete().eq('id', item.id));
      this.items = this.items.filter((i) => i.id !== item.id);
    },
  },
});
