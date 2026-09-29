<script setup>
// Comunidad: buscar viajeros, ver a quién sigo y quién me sigue.
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FollowButton from '@/components/social/FollowButton.vue';
import { useAuthStore } from '@/stores/auth';
import { useSocialStore } from '@/stores/social';

const auth = useAuthStore();
const social = useSocialStore();
const route = useRoute();
const router = useRouter();

const tab = ref(['following', 'followers'].includes(route.query.tab) ? route.query.tab : 'discover');
const q = ref('');
const people = ref([]);
const loading = ref(false);
const error = ref('');
let timer;

const tabs = computed(() => [
  { id: 'discover', label: 'Discover', icon: 'fa-compass' },
  ...(auth.isAuthenticated ? [
    { id: 'following', label: 'Following', icon: 'fa-user-check', count: social.followingCount },
    { id: 'followers', label: 'Followers', icon: 'fa-users', count: social.followersCount },
  ] : []),
]);

async function load() {
  loading.value = true; error.value = '';
  try {
    if (tab.value === 'discover') people.value = await social.search(q.value);
    else people.value = await social.people(auth.user.id, tab.value);
  } catch (e) { error.value = e.message; people.value = []; }
  finally { loading.value = false; }
}
function setTab(t) { tab.value = t; router.replace({ query: t === 'discover' ? {} : { tab: t } }); load(); }
watch(q, () => { clearTimeout(timer); timer = setTimeout(() => { if (tab.value === 'discover') load(); }, 300); });
onMounted(async () => { await social.load(); load(); });

const initial = (p) => (p.display_name || '?').trim().charAt(0).toUpperCase();
const since = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
</script>

<template>
  <div class="tp travelers">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ THE TALAPO FAMILY ✦</div>
        <h1>Travelers</h1>
        <p>Find other explorers, see the places they have stamped in their passport and follow them.</p>
        <div class="search">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model="q" type="search" placeholder="Search travelers by name…" aria-label="Search travelers" @focus="tab !== 'discover' && setTab('discover')" />
        </div>
      </div>
    </section>

    <div class="content">
      <div class="tabs" role="tablist">
        <button v-for="t in tabs" :key="t.id" role="tab" :aria-selected="tab === t.id" :class="{ on: tab === t.id }" @click="setTab(t.id)">
          <i class="fas" :class="t.icon"></i> {{ t.label }} <span v-if="t.count !== undefined" class="count">{{ t.count }}</span>
        </button>
      </div>

      <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading travelers…</p>
      <p v-else-if="error" class="note err">{{ error }}</p>

      <Transition name="fade" mode="out-in">
        <div v-if="!loading && !people.length" :key="`empty-${tab}`" class="empty">
          <div class="empty-icon">🧳</div>
          <h2 v-if="tab === 'following'">You are not following anyone yet</h2>
          <h2 v-else-if="tab === 'followers'">No followers yet</h2>
          <h2 v-else>No travelers found</h2>
          <p v-if="tab === 'followers'">Share your passport and keep your streak alive — travelers will find you.</p>
          <p v-else>Try another name, or explore the whole community.</p>
          <button v-if="tab !== 'discover' || q" class="cta" @click="q = ''; setTab('discover')">Discover travelers</button>
        </div>

        <TransitionGroup v-else :key="`list-${tab}`" name="card" tag="div" class="grid">
          <RouterLink v-for="p in people" :key="p.id" :to="`/travelers/${p.id}`" class="person">
            <div class="avatar">
              <img v-if="p.photo_url" :src="p.photo_url" :alt="p.display_name" loading="lazy" />
              <span v-else>{{ initial(p) }}</span>
            </div>
            <h3>{{ p.display_name }}</h3>
            <p class="meta">
              <span v-if="p.nationality">{{ p.nationality }}</span>
              <span v-if="p.joined_at">· since {{ since(p.joined_at) }}</span>
            </p>
            <div class="stats">
              <div><b>🔥 {{ p.current_streak || 0 }}</b><small>streak</small></div>
              <div><b>📍 {{ p.stamps_visited || 0 }}</b><small>places</small></div>
              <div><b>{{ p.followers_count || 0 }}</b><small>followers</small></div>
            </div>
            <FollowButton :user-id="p.id" :name="p.display_name" small @change="(d) => (p.followers_count = (p.followers_count || 0) + d)" />
          </RouterLink>
        </TransitionGroup>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.travelers { font-family: 'Outfit', 'Inter', sans-serif; background: #F8FBFE; min-height: 100vh; }
.hero { background: linear-gradient(rgba(1, 5, 37, 0.5), rgba(4, 12, 73, 0.6)), url('/assets/img/tours/la palma.jpg') no-repeat center 55%/cover; color: #fff; padding: clamp(3rem, 6vw, 4.5rem) 5%; }
.hero-inner { max-width: 1200px; margin: 0 auto; animation: rise .6s cubic-bezier(.2,.7,.2,1) both; }
.hero-badge { display: inline-block; background: #0A2F44; color: #fff; font-size: .75rem; font-weight: 700; letter-spacing: 1px; padding: .4rem 1rem; border-radius: 40px; margin-bottom: 1rem; }
.hero h1 { font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800; text-transform: uppercase; margin: 0 0 .5rem; line-height: 1; }
.hero p { font-weight: 600; max-width: 56ch; margin: 0 0 1.4rem; color: #eef4f8; }
.search { position: relative; max-width: 520px; }
.search i { position: absolute; left: 1.1rem; top: 50%; transform: translateY(-50%); color: #58717f; }
.search input { width: 100%; padding: .95rem 1rem .95rem 2.8rem; border-radius: 40px; border: 0; font: inherit; font-size: 1rem; box-shadow: 0 14px 30px -14px rgba(0,0,0,.5); }
.search input:focus { outline: 3px solid rgba(127,214,205,.8); }

.content { max-width: 1200px; margin: 0 auto; padding: 2rem 5% 4rem; }
.tabs { display: inline-flex; flex-wrap: wrap; background: #fff; border: 1px solid rgba(28,110,107,.18); border-radius: 40px; padding: 5px; gap: 4px; box-shadow: 0 10px 25px -15px rgba(0,32,64,.25); margin-bottom: 1.6rem; }
.tabs button { border: 0; background: none; border-radius: 40px; padding: .6rem 1.1rem; font: inherit; font-weight: 700; color: #1A3A4A; cursor: pointer; display: flex; align-items: center; gap: .45rem; transition: background .25s, color .25s; }
.tabs button.on { background: linear-gradient(105deg, #1C6E6B, #0A2F44); color: #fff; }
.count { background: rgba(0,0,0,.08); border-radius: 20px; padding: 0 .5rem; font-size: .8rem; }
.tabs button.on .count { background: rgba(255,255,255,.22); }
.note { color: #58717f; }
.note.err { color: #c62828; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.1rem; }
.person { background: #fff; border-radius: 24px; padding: 1.5rem 1.2rem 1.3rem; text-align: center; text-decoration: none; color: inherit; box-shadow: 0 20px 35px -22px rgba(0,32,64,.3); border: 1px solid rgba(28,110,107,.08); display: flex; flex-direction: column; align-items: center; gap: .35rem; transition: transform .25s, box-shadow .25s; }
.person:hover { transform: translateY(-4px); box-shadow: 0 26px 40px -20px rgba(0,32,64,.35); }
.avatar { width: 88px; height: 88px; border-radius: 50%; overflow: hidden; border: 3px solid #E2B13C; background: linear-gradient(135deg, #1C6E6B, #0A2F44); display: grid; place-items: center; color: #fff; font-size: 2rem; font-weight: 800; margin-bottom: .3rem; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.person h3 { margin: 0; color: #0A2F44; font-size: 1.15rem; }
.meta { margin: 0; color: #58717f; font-size: .85rem; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; width: 100%; margin: .6rem 0 .8rem; }
.stats div { background: #EEF6F6; border-radius: 12px; padding: .45rem .2rem; }
.stats b { display: block; color: #0A2F44; font-size: .95rem; }
.stats small { color: #58717f; font-size: .72rem; }

.empty { background: #fff; border-radius: 24px; padding: 3rem 1.5rem; text-align: center; box-shadow: 0 20px 35px -18px rgba(0,32,64,.2); }
.empty-icon { font-size: 3rem; }
.empty h2 { color: #0A2F44; margin: .4rem 0; }
.empty p { color: #58717f; margin: 0 0 1.2rem; }
.cta { background: #E46D5C; color: #fff; border: 0; border-radius: 40px; padding: .8rem 1.4rem; font: inherit; font-weight: 700; cursor: pointer; }

@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.fade-enter-active, .fade-leave-active { transition: opacity .25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.card-enter-active { transition: opacity .35s ease, transform .35s ease; }
.card-enter-from { opacity: 0; transform: translateY(14px); }
@media (max-width: 520px) { .tabs { display: flex; width: 100%; } .tabs button { flex: 1; justify-content: center; padding: .55rem .4rem; font-size: .88rem; } }
</style>
