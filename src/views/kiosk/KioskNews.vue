<script setup>
// Noticias municipales: se muestran las publicadas; se envían por CORREO (QR → mailto)
import { ref, computed, onMounted } from 'vue';
import QrCode from '@/components/kiosk/QrCode.vue';
import { insforge, isConfigured } from '@/lib/insforge';
import { useKioskI18n } from '@/i18n/kiosk';
const { t, locale } = useKioskI18n();

const props = defineProps({ stand: { type: Object, required: true } });
const news = ref([]);
const loading = ref(true);
const openId = ref(null);
const big = ref(null); // foto ampliada

const mailto = computed(() => {
  return `mailto:${props.stand.newsEmail}?subject=${encodeURIComponent(t('mailSubject'))}&body=${encodeURIComponent(t('mailBody'))}`;
});

onMounted(async () => {
  if (isConfigured) {
    const { data } = await insforge.database.from('municipal_news').select('*')
      .eq('stand_id', props.stand.id).order('published_at', { ascending: false }).limit(30);
    news.value = data || [];
  }
  loading.value = false;
});
const fmt = (d) => (d ? new Date(d).toLocaleDateString(locale.value, { weekday: 'short', month: 'long', day: 'numeric' }) : '');
</script>

<template>
  <section class="page">
    <div class="head">
      <span class="emoji">📰</span>
      <div><h1>{{ t('newsTitle') }}</h1><p>{{ t('newsSub', { city: stand.city }) }}</p></div>
    </div>

    <div class="layout">
      <div class="list">
        <p v-if="loading" class="note"><i class="fas fa-spinner fa-spin"></i> {{ t('loadingNews') }}</p>
        <div v-else-if="!news.length" class="empty">
          <span>🗞️</span>
          <h2>{{ t('noNews') }}</h2>
          <p>{{ t('noNewsText') }}</p>
        </div>
        <TransitionGroup v-else name="card" tag="div" class="cards">
          <article v-for="n in news" :key="n.id" class="news" :class="{ open: openId === n.id }" @click="openId = openId === n.id ? null : n.id">
            <div v-if="n.image_url" class="cover-box" :style="{ '--bg': `url('${n.image_url}')` }" @click.stop="big = n.image_url">
              <img :src="n.image_url" :alt="n.title" class="cover" loading="lazy" />
              <span class="zoom"><i class="fas fa-magnifying-glass-plus"></i></span>
            </div>
            <div class="news-body">
              <small>{{ fmt(n.published_at || n.created_at) }}<template v-if="n.author"> · {{ n.author }}</template></small>
              <h2>{{ n.title }}</h2>
              <p>{{ n.body }}</p>
              <!-- Galería: todas las fotos de la noticia -->
              <div v-if="openId === n.id && n.images?.length > 1" class="gallery" @click.stop>
                <img v-for="(url, i) in n.images" :key="i" :src="url" alt="" loading="lazy" @click="big = url" />
              </div>
              <span v-if="n.images?.length > 1 && openId !== n.id" class="photos-count">📷 {{ n.images.length }}</span>
              <span class="more">{{ openId === n.id ? t('showLess') : t('readMore') }} <i class="fas" :class="openId === n.id ? 'fa-chevron-up' : 'fa-chevron-down'"></i></span>
            </div>
          </article>
        </TransitionGroup>
      </div>

      <aside class="send">
        <h2>{{ t('shareTitle') }}</h2>
        <p v-html="t('shareText')"></p>
        <QrCode :value="mailto" :size="200" :label="t('shareTitle')" />
        <p class="mail"><i class="fas fa-envelope"></i> {{ stand.newsEmail }}</p>
        <ol>
          <li>{{ t('step1') }}</li>
          <li>{{ t('step2') }}</li>
          <li>{{ t('step3') }}</li>
        </ol>
      </aside>
    </div>
    <!-- Foto ampliada -->
    <Transition name="fadebig">
      <div v-if="big" class="lightbox" @click="big = null"><img :src="big" alt="" /><span>✕</span></div>
    </Transition>
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
.news { display: grid; grid-template-columns: 220px 1fr; gap: 20px; align-items: start; background: #fff; border-radius: 24px; padding: 18px; box-shadow: 0 18px 30px -22px rgba(0,32,64,.35); cursor: pointer; transition: transform .2s, box-shadow .2s; }
.news:active { transform: scale(.99); }
.cover-box { position: relative; width: 100%; aspect-ratio: 4 / 5; border-radius: 16px; overflow: hidden; background: #0A2F44; cursor: zoom-in; transition: aspect-ratio .3s ease; }
.cover-box::before { content: ''; position: absolute; inset: -20px; background: var(--bg) center/cover; filter: blur(18px) brightness(.7); transform: scale(1.1); }
.cover-box img.cover { position: relative; width: 100%; height: 100%; object-fit: contain; display: block; }
.zoom { position: absolute; right: 8px; bottom: 8px; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.92); color: #0A2F44; display: grid; place-items: center; box-shadow: 0 4px 10px rgba(0,0,0,.3); }
/* Al abrir: el afiche se ve grande y completo */
.news.open { grid-template-columns: minmax(0, 1.1fr) 1fr; }
.news.open .cover-box { aspect-ratio: auto; height: min(70vh, 620px); }
.gallery { display: flex; gap: 8px; overflow-x: auto; margin-top: 12px; padding-bottom: 4px; }
.gallery img { width: 120px; height: 90px; object-fit: cover; border-radius: 10px; flex-shrink: 0; cursor: zoom-in; }
.photos-count { display: inline-block; margin: 6px 10px 0 0; font-weight: 700; color: #58717f; }
.lightbox { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,.88); display: grid; place-items: center; padding: 20px; }
.lightbox img { max-width: 100%; max-height: 90vh; border-radius: 12px; }
.lightbox span { position: absolute; top: 18px; right: 22px; color: #fff; font-size: 1.8rem; }
.fadebig-enter-active, .fadebig-leave-active { transition: opacity .2s; }
.fadebig-enter-from, .fadebig-leave-to { opacity: 0; }
.news:not(:has(.cover-box)) { grid-template-columns: 1fr; }
.news:hover { box-shadow: 0 24px 38px -22px rgba(0,32,64,.45); }
.news small { color: #1C6E6B; font-weight: 700; }
.news h2 { margin: 6px 0 8px; font-size: 1.6rem; line-height: 1.15; }
.news p { margin: 0; color: #4a6472; font-size: 1.05rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 4; line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-line; }
.news.open p { -webkit-line-clamp: unset; line-clamp: unset; }
.more { display: inline-block; margin-top: 8px; color: #E46D5C; font-weight: 700; }
.send { position: sticky; top: 96px; background: #0A2F44; color: #fff; border-radius: 26px; padding: 22px; display: grid; justify-items: center; text-align: center; gap: 10px; box-shadow: 0 24px 40px -22px rgba(0,0,0,.6); animation: rise .6s .1s ease both; }
.send h2 { margin: 0; }
.send p { margin: 0; opacity: .9; line-height: 1.45; }
.mail { font-weight: 700; color: #7fd6cd; }
.send ol { text-align: left; margin: 4px 0 0; padding-left: 20px; opacity: .9; line-height: 1.6; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.card-enter-active { transition: opacity .35s ease, transform .35s ease; }
.card-enter-from { opacity: 0; transform: translateY(12px); }
@media (max-width: 860px) { .layout { grid-template-columns: 1fr; } .send { position: static; } .news, .news.open { grid-template-columns: 1fr; } .cover-box { aspect-ratio: 4 / 3; } .news.open .cover-box { height: min(65vh, 520px); } }
</style>