<script setup>
// Perfil público de un viajero: datos seguros, sellos visitados, seguidores y botón Follow.
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import FollowButton from '@/components/social/FollowButton.vue';
import { useSocialStore } from '@/stores/social';

const route = useRoute();
const social = useSocialStore();

const p = ref(null);
const stamps = ref([]);
const loading = ref(true);
const list = ref(null);        // 'followers' | 'following' | null
const people = ref([]);
const listLoading = ref(false);

async function load(id) {
  loading.value = true; list.value = null;
  try {
    const [prof, st] = await Promise.all([social.profile(id), social.stamps(id)]);
    p.value = prof; stamps.value = st;
    document.title = prof ? `${prof.display_name} · Talapo.SV` : 'Traveler · Talapo.SV';
  } catch { p.value = null; }
  finally { loading.value = false; }
}
async function openList(kind) {
  if (list.value === kind) { list.value = null; return; }
  list.value = kind; listLoading.value = true;
  try { people.value = await social.people(p.value.id, kind); } finally { listLoading.value = false; }
}
watch(() => route.params.id, (id) => id && load(id), { immediate: true });

const initial = (x) => (x?.display_name || '?').trim().charAt(0).toUpperCase();
const since = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '');
</script>

<template>
  <div class="tp profile-page">
    <p v-if="loading" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading traveler…</p>

    <div v-else-if="!p" class="missing">
      <div class="missing-icon">🧭</div>
      <h1>Traveler not found</h1>
      <p>This profile is private or doesn't exist.</p>
      <RouterLink to="/travelers" class="back">← Back to travelers</RouterLink>
    </div>

    <template v-else>
      <section class="cover">
        <div class="card">
          <RouterLink to="/travelers" class="back-link"><i class="fas fa-arrow-left"></i> Travelers</RouterLink>
          <div class="top">
            <div class="avatar">
              <img v-if="p.photo_url" :src="p.photo_url" :alt="p.display_name" />
              <span v-else>{{ initial(p) }}</span>
            </div>
            <div class="who">
              <span class="badge">✦ TALAPO PASSPORT ✦</span>
              <h1>{{ p.display_name }}</h1>
              <p class="sub">
                <span v-if="p.nationality"><i class="fas fa-flag"></i> {{ p.nationality }}</span>
                <span v-if="p.joined_at"><i class="fas fa-calendar"></i> Traveler since {{ since(p.joined_at) }}</span>
              </p>
            </div>
            <FollowButton :user-id="p.id" :name="p.display_name" @change="(d) => (p.followers_count += d)" />
          </div>

          <div class="stats">
            <button class="stat" :class="{ on: list === 'followers' }" @click="openList('followers')"><b>{{ p.followers_count }}</b><span>Followers</span></button>
            <button class="stat" :class="{ on: list === 'following' }" @click="openList('following')"><b>{{ p.following_count }}</b><span>Following</span></button>
            <div class="stat"><b>🔥 {{ p.current_streak }}</b><span>Day streak</span></div>
            <div class="stat"><b>📍 {{ p.stamps_visited }}</b><span>Places visited</span></div>
          </div>

          <Transition name="fade">
            <div v-if="list" class="people">
              <p v-if="listLoading" class="muted-note">Loading…</p>
              <p v-else-if="!people.length" class="muted-note">{{ list === 'followers' ? 'No followers yet.' : 'Not following anyone yet.' }}</p>
              <RouterLink v-for="x in people" v-else :key="x.id" :to="`/travelers/${x.id}`" class="mini">
                <span class="mini-avatar"><img v-if="x.photo_url" :src="x.photo_url" alt="" /><template v-else>{{ initial(x) }}</template></span>
                <span>{{ x.display_name }}</span>
              </RouterLink>
            </div>
          </Transition>
        </div>
      </section>

      <section class="stamps-wrap">
        <h2><i class="fas fa-stamp"></i> Travel log</h2>
        <p v-if="!stamps.length" class="muted-note">{{ p.display_name }} hasn't stamped any place yet.</p>
        <TransitionGroup v-else name="stamp" tag="div" class="stamps">
          <div v-for="s in stamps" :key="s.id" class="stamp">
            <div class="stamp-img">
              <img v-if="s.photo_url" :src="s.photo_url" :alt="s.place_name" loading="lazy" />
              <i v-else class="fas fa-mountain-sun"></i>
            </div>
            <b>{{ s.place_name }}</b>
            <small><i class="fas fa-check-circle"></i> Visited {{ new Date(s.visited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</small>
          </div>
        </TransitionGroup>
      </section>
    </template>
  </div>
</template>

<style scoped>
.profile-page { font-family: 'Outfit', 'Inter', sans-serif; min-height: 100vh; background: #F8FBFE; }
.loading { padding: 3rem 5%; color: #58717f; }
.missing { text-align: center; padding: 4rem 5%; }
.missing-icon { font-size: 3rem; }
.missing h1 { color: #0A2F44; }
.missing p { color: #58717f; }
.back { color: #1C6E6B; font-weight: 700; }

/* Portada con el mural del pasaporte */
.cover { background: linear-gradient(rgba(10,47,68,.55), rgba(10,47,68,.75)), url('/assets/img/index/ataco.jpg') no-repeat center/cover; padding: clamp(2rem, 5vw, 3.5rem) 5% 4rem; }
.card { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 24px; padding: 1.6rem; box-shadow: 0 30px 50px -25px rgba(0,0,0,.5); animation: rise .6s cubic-bezier(.2,.7,.2,1) both; }
.back-link { color: #1C6E6B; font-weight: 700; text-decoration: none; font-size: .9rem; }
.top { display: grid; grid-template-columns: auto 1fr auto; gap: 1.3rem; align-items: center; margin-top: 1rem; }
.avatar { width: 116px; height: 116px; border-radius: 20px; overflow: hidden; border: 4px solid #1e3a8a; background: linear-gradient(135deg, #1C6E6B, #0A2F44); display: grid; place-items: center; color: #fff; font-size: 2.6rem; font-weight: 800; box-shadow: 0 12px 24px -12px rgba(0,0,0,.4); }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.badge { display: inline-block; font-size: .7rem; font-weight: 700; letter-spacing: 1px; color: #1e3a8a; background: #e8eefc; padding: .25rem .7rem; border-radius: 30px; }
.who h1 { margin: .35rem 0 .3rem; color: #0A2F44; font-size: clamp(1.6rem, 3.5vw, 2.3rem); line-height: 1.1; }
.sub { margin: 0; display: flex; flex-wrap: wrap; gap: .4rem 1rem; color: #58717f; font-size: .9rem; }
.sub i { color: #1C6E6B; margin-right: .2rem; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: .7rem; margin-top: 1.4rem; }
.stat { background: #f1f5f9; border: 1.5px solid transparent; border-radius: 16px; padding: .85rem .4rem; text-align: center; font: inherit; color: inherit; }
button.stat { cursor: pointer; transition: border-color .2s, transform .2s; }
button.stat:hover { transform: translateY(-2px); border-color: #1C6E6B; }
.stat.on { border-color: #1C6E6B; background: #EEF6F6; }
.stat b { display: block; font-size: 1.4rem; color: #1e3a8a; }
.stat span { font-size: .78rem; color: #64748b; }
.people { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1rem; }
.mini { display: inline-flex; align-items: center; gap: .5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 40px; padding: .3rem .8rem .3rem .3rem; text-decoration: none; color: #0A2F44; font-weight: 600; font-size: .9rem; transition: border-color .2s; }
.mini:hover { border-color: #1C6E6B; }
.mini-avatar { width: 30px; height: 30px; border-radius: 50%; overflow: hidden; background: #1C6E6B; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: .85rem; }
.mini-avatar img { width: 100%; height: 100%; object-fit: cover; }
.muted-note { color: #64748b; font-size: .9rem; margin: 0; }

.stamps-wrap { max-width: 900px; margin: -2rem auto 0; padding: 0 5% 4rem; position: relative; }
.stamps-wrap h2 { color: #0A2F44; font-size: 1.3rem; margin: 3rem 0 1rem; }
.stamps-wrap h2 i { color: #1C6E6B; }
.stamps { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: .9rem; }
.stamp { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: .6rem .6rem .8rem; display: grid; gap: .3rem; box-shadow: 0 12px 24px -18px rgba(0,32,64,.35); transition: transform .2s; }
.stamp:hover { transform: translateY(-3px) rotate(-.5deg); }
.stamp-img { aspect-ratio: 4/3; border-radius: 12px; overflow: hidden; background: #EEF6F6; display: grid; place-items: center; color: #1C6E6B; font-size: 1.6rem; }
.stamp-img img { width: 100%; height: 100%; object-fit: cover; }
.stamp b { color: #1e3a8a; font-size: .95rem; }
.stamp small { color: #059669; font-size: .75rem; }

@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.fade-enter-active, .fade-leave-active { transition: opacity .25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.stamp-enter-active { transition: opacity .35s ease, transform .35s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.stamp-enter-from { opacity: 0; transform: scale(.85) rotate(-3deg); }
@media (max-width: 640px) {
  .top { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .sub { justify-content: center; }
  .stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
