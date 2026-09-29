import { defineStore } from 'pinia';
import { insforge, unwrap, isConfigured } from '@/lib/insforge';
import { useAuthStore } from './auth';

/**
 * Perfiles públicos y seguidores (tablas/vistas: public_profiles, public_stamps, follows).
 * Los datos privados del pasaporte nunca pasan por aquí.
 */
export const useSocialStore = defineStore('social', {
  state: () => ({
    followingIds: new Set(),   // a quién sigo yo
    followersCount: 0,
    followingCount: 0,
    loaded: false,
  }),
  getters: {
    isFollowing: (s) => (id) => s.followingIds.has(id),
  },
  actions: {
    reset() { this.followingIds = new Set(); this.followersCount = 0; this.followingCount = 0; this.loaded = false; },

    async load(force = false) {
      const auth = useAuthStore();
      if (!auth.user || !isConfigured || (this.loaded && !force)) return;
      const [mine, followers] = await Promise.all([
        unwrap(insforge.database.from('follows').select('following_id').eq('follower_id', auth.user.id)),
        unwrap(insforge.database.from('follows').select('follower_id').eq('following_id', auth.user.id)),
      ]);
      this.followingIds = new Set(mine.map((r) => r.following_id));
      this.followingCount = mine.length;
      this.followersCount = followers.length;
      this.loaded = true;
    },

    /** Busca viajeros por nombre (vacío = los más activos). */
    async search(q = '', limit = 30) {
      let req = insforge.database.from('public_profiles').select('*');
      if (q.trim()) req = req.ilike('display_name', `%${q.trim()}%`);
      return unwrap(req.order('followers_count', { ascending: false }).order('current_streak', { ascending: false }).limit(limit));
    },

    async profile(id) {
      const rows = await unwrap(insforge.database.from('public_profiles').select('*').eq('id', id).limit(1));
      return rows[0] || null;
    },

    async stamps(id) {
      return unwrap(insforge.database.from('public_stamps').select('*').eq('user_id', id).order('visited_at', { ascending: false }));
    },

    /** Lista de seguidores o seguidos de un usuario, con su perfil público. */
    async people(id, kind = 'followers') {
      const col = kind === 'followers' ? 'following_id' : 'follower_id';
      const other = kind === 'followers' ? 'follower_id' : 'following_id';
      const rows = await unwrap(insforge.database.from('follows').select(other).eq(col, id).limit(200));
      const ids = rows.map((r) => r[other]);
      if (!ids.length) return [];
      return unwrap(insforge.database.from('public_profiles').select('*').in('id', ids));
    },

    async follow(id) {
      const auth = useAuthStore();
      await unwrap(insforge.database.from('follows').insert([{ follower_id: auth.user.id, following_id: id }]));
      this.followingIds = new Set([...this.followingIds, id]);
      this.followingCount += 1;
    },

    async unfollow(id) {
      const auth = useAuthStore();
      await unwrap(insforge.database.from('follows').delete().eq('follower_id', auth.user.id).eq('following_id', id));
      const s = new Set(this.followingIds); s.delete(id); this.followingIds = s;
      this.followingCount = Math.max(0, this.followingCount - 1);
    },
  },
});
