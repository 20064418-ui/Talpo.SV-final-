<script setup>
// Noticias municipales: se muestran las publicadas; se envían por CORREO (QR → mailto)
import { ref, computed, onMounted } from 'vue';
import QrCode from '@/components/kiosk/QrCode.vue';
import { insforge, isConfigured } from '@/lib/insforge';

const props = defineProps({ stand: { type: Object, required: true } });
const news = ref([]);
const loading = ref(true);
const openId = ref(null);

const mailto = computed(() => {
  const body = 'Title of the news:\n\nWhat happened / what will happen:\n\nDate and place:\n\nYour name and phone (optional):\n';
  return `mailto:${props.stand.newsEmail}?subject=${encodeURIComponent(props.stand.newsSubject)}&body=${encodeURIComponent(body)}`;
});

onMounted(async () => {
  if (isConfigured) {
    const { data } = await insforge.database.from('municipal_news').select('*')
      .eq('stand_id', props.stand.id).order('published_at', { ascending: false }).limit(30);
    news.value = data || [];
  }
  loading.value = false;
});
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) : '');
</script>

<template>
  <section class="page">
    <div class="head">
      <span class="emoji">📰</span>
      <div><h1>Municipal News</h1><p>News and events of {{ stand.city }}, reviewed by the Talapo team.</p></div>
    </div>

    <div class="layout">
      <div class="list">
        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> Loading news…</p>
        <div v-else-if="!news.length" class="empty">
          <span>🗞️</span>
          <h2>No news yet</h2>
          <p>Be the first! Send your municipal news by email using the QR code.</p>
        </div>
        <TransitionGroup v-else name="card" tag="div" class="cards">
          <article v-for="n in news" :key="n.id" class="news" :class="{ open: openId === n.id }" @click="openId = openId === n.id ? null : n.id">
            <img v-if="n.image_url" :src="n.image_url" alt="" />
            <div class="news-body">
              <small>{{ fmt(n.published_at || n.created_at) }}<template v-if="n.author"> · {{ n.author }}</template></small>
              <h2>{{ n.title }}</h2>
              <p>{{ n.body }}</p>
              <span class="more">{{ openId === n.id ? 'Show less' : 'Read more' }} <i class="fas" :class="openId === n.id ? 'fa-chevron-up' : 'fa-chevron-down'"></i></span>
            </div>
          </article>
        </TransitionGroup>
      </div>

      <aside class="send">
        <h2>📩 Share your news</h2>
        <p>Do you have news or an event from your community? <b>Scan this code</b> with your phone camera: it opens an email ready to send.</p>
        <QrCode :value="mailto" :size="200" label="Send your news by email" />
        <p class="mail"><i class="fas fa-envelope"></i> {{ stand.newsEmail }}</p>
        <ol>
          <li>Scan the QR code.</li>
          <li>Write your news in the email.</li>
          <li>Send it — our team reviews it and publishes it here.</li>
        </ol>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.page { flex: 1; padding: clamp(18px, 3vh, 36px) clamp(16px, 4vw, 48px); max-width: 1200px; width: 100%; margin: 0 auto; }
.head { display: flex; gap: 16px; align-items: center; margin-bottom: 22px; animation: rise .5s ease both; }
.head .emoji { font-size: 3rem; }
.head h1 { margin: 0; font-size: clamp(1.8rem, 4vw, 2.6rem); color: #1C6E6B; }
.head p { margin: 4px 0 0; color: #58717f; font-size: 1.05rem; }
.layout { display: grid; grid-template-columns: 1fr 340px; gap: 22px; align-items: start; }
.note { color: #58717f; font-size: 1.1rem; }
.empty { background: #fff; border-radius: 24px; padding: 40px 24px; text-align: center; box-shadow: 0 20px 35px -22px rgba(0,32,64,.3); }
.empty span { font-size: 3rem; }
.empty h2 { margin: 8px 0; }
.empty p { color: #58717f; font-size: 1.05rem; }
.cards { display: grid; gap: 14px; }
.news { display: grid; grid-template-columns: auto 1fr; gap: 16px; background: #fff; border-radius: 22px; padding: 16px; box-shadow: 0 18px 30px -22px rgba(0,32,64,.35); cursor: pointer; transition: transform .2s; }
.news:active { transform: scale(.99); }
.news img { width: 130px; height: 110px; object-fit: cover; border-radius: 14px; }
.news:not(:has(img)) { grid-template-columns: 1fr; }
.news small { color: #1C6E6B; font-weight: 700; }
.news h2 { margin: 4px 0 6px; font-size: 1.3rem; }
.news p { margin: 0; color: #4a6472; font-size: 1.05rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-line; }
.news.open p { -webkit-line-clamp: unset; }
.more { display: inline-block; margin-top: 8px; color: #E46D5C; font-weight: 700; }
.send { position: sticky; top: 96px; background: #0A2F44; color: #fff; border-radius: 26px; padding: 22px; display: grid; justify-items: center; text-align: center; gap: 10px; box-shadow: 0 24px 40px -22px rgba(0,0,0,.6); animation: rise .6s .1s ease both; }
.send h2 { margin: 0; }
.send p { margin: 0; opacity: .9; line-height: 1.45; }
.mail { font-weight: 700; color: #7fd6cd; }
.send ol { text-align: left; margin: 4px 0 0; padding-left: 20px; opacity: .9; line-height: 1.6; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.card-enter-active { transition: opacity .35s ease, transform .35s ease; }
.card-enter-from { opacity: 0; transform: translateY(12px); }
@media (max-width: 860px) { .layout { grid-template-columns: 1fr; } .send { position: static; } .news img { width: 96px; height: 84px; } }
</style>
