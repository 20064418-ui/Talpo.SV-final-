<script setup>
// Moderación del foro: publicaciones y comentarios reportados u ocultos.
import { ref, computed, onMounted } from 'vue';
import { insforge, unwrap } from '@/lib/insforge';
import { usePassportStore } from '@/stores/passport';
import { toast } from '@/composables/useToast';
import { logAdmin } from '@/composables/useAdminLog';
import AdminTabs from '@/components/admin/AdminTabs.vue';

const passport = usePassportStore();
const isAdmin = computed(() => !!passport.profile?.is_admin);
const loading = ref(true);
const items = ref([]);       // [{ kind, id, title, body, author, hidden, reports: [...] }]
const filter = ref('pending');

const REASON = { spam: '🚫 Spam', offensive: '🤬 Offensive', false: '❌ False info', inappropriate: '🔞 Inappropriate', other: '💬 Other' };

async function load() {
  loading.value = true;
  try {
    const [reports, hiddenPosts, hiddenComments] = await Promise.all([
      unwrap(insforge.database.from('forum_reports').select('*').order('created_at', { ascending: false }).limit(500)),
      unwrap(insforge.database.from('forum_posts').select('id, title, body, author_name, hidden, created_at, image_url').eq('hidden', true)),
      unwrap(insforge.database.from('forum_comments').select('id, body, author_name, hidden, created_at, post_id').eq('hidden', true)),
    ]);
    const postIds = [...new Set(reports.filter((r) => r.post_id).map((r) => r.post_id))];
    const commentIds = [...new Set(reports.filter((r) => r.comment_id).map((r) => r.comment_id))];
    const [posts, comments] = await Promise.all([
      postIds.length ? unwrap(insforge.database.from('forum_posts').select('id, title, body, author_name, hidden, created_at, image_url').in('id', postIds)) : [],
      commentIds.length ? unwrap(insforge.database.from('forum_comments').select('id, body, author_name, hidden, created_at, post_id').in('id', commentIds)) : [],
    ]);
    const map = new Map();
    const add = (kind, row) => {
      const key = `${kind}:${row.id}`;
      if (!map.has(key)) map.set(key, { kind, id: row.id, title: row.title, body: row.body, author: row.author_name, hidden: row.hidden, image: row.image_url, created_at: row.created_at, reports: [] });
      return map.get(key);
    };
    posts.forEach((p) => add('post', p)); comments.forEach((c) => add('comment', c));
    hiddenPosts.forEach((p) => add('post', p)); hiddenComments.forEach((c) => add('comment', c));
    reports.forEach((r) => {
      const key = r.post_id ? `post:${r.post_id}` : `comment:${r.comment_id}`;
      map.get(key)?.reports.push(r);
    });
    items.value = [...map.values()].sort((a, b) => b.reports.filter((r) => !r.resolved).length - a.reports.filter((r) => !r.resolved).length);
  } catch (e) { toast(e.message, 'error'); }
  finally { loading.value = false; }
}

const pendingCount = computed(() => items.value.filter((i) => i.reports.some((r) => !r.resolved)).length);
const shown = computed(() => items.value.filter((i) => {
  if (filter.value === 'pending') return i.reports.some((r) => !r.resolved);
  if (filter.value === 'hidden') return i.hidden;
  return true;
}));

const table = (i) => (i.kind === 'post' ? 'forum_posts' : 'forum_comments');
const col = (i) => (i.kind === 'post' ? 'post_id' : 'comment_id');

async function resolveReports(i) {
  await unwrap(insforge.database.from('forum_reports').update({ resolved: true }).eq(col(i), i.id));
  i.reports.forEach((r) => { r.resolved = true; });
}
async function keep(i) {
  try {
    if (i.hidden) await unwrap(insforge.database.from(table(i)).update({ hidden: false }).eq('id', i.id));
    i.hidden = false;
    await resolveReports(i);
    logAdmin('forum.keep', 'forum_' + i.kind, i.id, { title: (i.title || i.body || '').slice(0, 80) });
    toast('Kept visible — reports dismissed');
  } catch (e) { toast(e.message, 'error'); }
}
async function hide(i) {
  try {
    await unwrap(insforge.database.from(table(i)).update({ hidden: true }).eq('id', i.id));
    i.hidden = true;
    await resolveReports(i);
    logAdmin('forum.hide', 'forum_' + i.kind, i.id, { title: (i.title || i.body || '').slice(0, 80) });
    toast('Hidden from the forum');
  } catch (e) { toast(e.message, 'error'); }
}
async function remove(i) {
  if (!confirm(`Delete this ${i.kind}? This cannot be undone.`)) return;
  try {
    await unwrap(insforge.database.from(table(i)).delete().eq('id', i.id));
    items.value = items.value.filter((x) => x !== i);
    logAdmin('forum.delete', 'forum_' + i.kind, i.id, { title: (i.title || i.body || '').slice(0, 80) });
    toast('Deleted');
  } catch (e) { toast(e.message, 'error'); }
}
const fmt = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
onMounted(async () => { await passport.load(true); if (isAdmin.value) load(); else loading.value = false; });
</script>

<template>
  <div class="tp admin" data-admin="forum">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">✦ TALAPO ADMIN ✦</div>
        <h1>Talapo Admin</h1>
        <p>Review what the community reported. Posts with 3 reports are hidden automatically until you decide.</p>
      </div>
    </section>
    <div class="content">
      <p v-if="!passport.loaded" class="note">Loading…</p>
      <div v-else-if="!isAdmin" class="box"><h2>🔒 Admins only</h2></div>
      <template v-else>
        <AdminTabs :counts="{ forum: pendingCount }" />
        <div class="filters">
          <button :class="{ on: filter === 'pending' }" @click="filter = 'pending'">To review ({{ pendingCount }})</button>
          <button :class="{ on: filter === 'hidden' }" @click="filter = 'hidden'">Hidden</button>
          <button :class="{ on: filter === 'all' }" @click="filter = 'all'">All</button>
        </div>
        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading reports…</p>
        <div v-else-if="!shown.length" class="box empty">✅ Nothing to review. The forum is clean!</div>
        <TransitionGroup v-else name="ph" tag="ul" class="list">
          <li v-for="i in shown" :key="i.kind + i.id" class="item" :class="{ hidden: i.hidden }">
            <img v-if="i.image" :src="i.image" alt="" class="thumb" />
            <div class="body">
              <div class="chips">
                <span class="chip">{{ i.kind === 'post' ? '📝 Post' : '💬 Comment' }}</span>
                <span v-if="i.hidden" class="chip warn">🙈 Hidden</span>
                <span class="chip red">⚑ {{ i.reports.filter((r) => !r.resolved).length }} open report(s)</span>
              </div>
              <h3 v-if="i.title">{{ i.title }}</h3>
              <p class="text">{{ i.body }}</p>
              <small>by {{ i.author }} · {{ fmt(i.created_at) }}</small>
              <ul v-if="i.reports.length" class="reasons">
                <li v-for="r in i.reports" :key="r.id" :class="{ done: r.resolved }">
                  {{ REASON[r.reason] || r.reason }}<template v-if="r.details"> — “{{ r.details }}”</template>
                </li>
              </ul>
            </div>
            <div class="actions">
              <button class="btn ok" @click="keep(i)"><i class="fas fa-check"></i> Keep</button>
              <button v-if="!i.hidden" class="btn warn" @click="hide(i)"><i class="fas fa-eye-slash"></i> Hide</button>
              <button class="btn danger" @click="remove(i)"><i class="fas fa-trash"></i> Delete</button>
            </div>
          </li>
        </TransitionGroup>
      </template>
    </div>
  </div>
</template>

<style scoped>
.admin { font-family: 'Outfit', 'Inter', sans-serif; background: #F8FBFE; min-height: 100vh; }
.hero { background: linear-gradient(rgba(10,47,68,.72), rgba(10,47,68,.85)), url('/assets/img/stand/parksantaana.jpg') center/cover; color: #fff; padding: clamp(2.5rem, 5vw, 4rem) 5%; }
.hero-inner { max-width: 1000px; margin: 0 auto; }
.hero-badge { display: inline-block; background: #0A2F44; font-size: .75rem; font-weight: 700; letter-spacing: 1px; padding: .4rem 1rem; border-radius: 40px; margin-bottom: 1rem; }
.hero h1 { font-size: clamp(2.2rem, 5vw, 3.2rem); font-weight: 800; text-transform: uppercase; margin: 0 0 .4rem; }
.hero p { margin: 0; opacity: .9; max-width: 62ch; }
.content { max-width: 1000px; margin: 0 auto; padding: 2rem 5% 4rem; }
.note { color: #58717f; }
.box { background: #fff; border-radius: 20px; padding: 1.4rem; box-shadow: 0 16px 28px -22px rgba(0,32,64,.35); }
.empty { text-align: center; font-weight: 700; color: #166534; }
.filters { display: flex; gap: .4rem; flex-wrap: wrap; margin-bottom: 1rem; }
.filters button { border: 1.5px solid #dce7ea; background: #fff; border-radius: 30px; padding: .45rem 1rem; font: inherit; font-weight: 700; color: #1A3A4A; cursor: pointer; }
.filters button.on { background: #0A2F44; border-color: #0A2F44; color: #fff; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: .9rem; }
.item { display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; background: #fff; border-radius: 20px; padding: 1rem; box-shadow: 0 16px 28px -22px rgba(0,32,64,.35); border-left: 5px solid #E46D5C; }
.item.hidden { border-left-color: #f2a93b; }
.thumb { width: 110px; height: 90px; object-fit: cover; border-radius: 12px; }
.item:not(:has(.thumb)) { grid-template-columns: 1fr auto; }
.chips { display: flex; flex-wrap: wrap; gap: .3rem; }
.chip { font-size: .72rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #EEF6F6; color: #1C6E6B; }
.chip.warn { background: #fff1c2; color: #8a5a00; }
.chip.red { background: #fdecea; color: #b42318; }
.body h3 { margin: .35rem 0 .2rem; color: #0A2F44; }
.text { margin: .3rem 0; color: #34505e; white-space: pre-line; }
.body small { color: #8aa0ab; }
.reasons { margin: .5rem 0 0; padding-left: 1.1rem; color: #4a6472; font-size: .9rem; }
.reasons li.done { text-decoration: line-through; opacity: .6; }
.actions { display: grid; gap: .4rem; align-content: start; }
.btn { border: 0; border-radius: 30px; padding: .5rem 1rem; font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap; }
.btn.ok { background: #d9f2e3; color: #166534; }
.btn.warn { background: #fff1c2; color: #8a5a00; }
.btn.danger { background: #fdecea; color: #b42318; }
.ph-enter-active, .ph-leave-active { transition: all .25s ease; }
.ph-enter-from, .ph-leave-to { opacity: 0; transform: translateY(8px); }
@media (max-width: 700px) { .item, .item:not(:has(.thumb)) { grid-template-columns: 1fr; } .actions { grid-auto-flow: column; } }
</style>
