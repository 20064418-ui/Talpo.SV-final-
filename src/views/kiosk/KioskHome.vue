<script setup>
// Pantalla principal del Stand: 4 botones grandes
import { useKioskI18n } from '@/i18n/kiosk';
defineProps({ stand: { type: Object, required: true } });
const { t, lang, setLang, languages } = useKioskI18n();
const buttons = [
  // Fotos: las de Wikimedia Commons llevan crédito (licencia CC BY-SA 3.0)
  { to: 'kiosk-news', emoji: '📰', title: 'btnNews', text: 'btnNewsText', color: '#1C6E6B',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/ES_Santa_Ana_06_2011_2482.jpg?width=900', credit: 'Mariordo · CC BY-SA 3.0' },
  { to: 'kiosk-history', emoji: '🏛️', title: 'btnHistory', text: 'btnHistoryText', color: '#0A2F44',
    img: '/assets/img/realidadaumentada/santaana.jpg' },
  { to: 'kiosk-map', emoji: '🗺️', title: 'btnMap', text: 'btnMapText', color: '#E46D5C',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/ES_Santa_Ana_06_2011_2543.jpg?width=900', credit: 'Mariordo · CC BY-SA 3.0' },
  { to: 'kiosk-form', emoji: '📝', title: 'btnForm', text: 'btnFormText', color: '#C98A1B',
    img: '/assets/img/stand/parksantaana.jpg' },
];
</script>

<template>
  <section class="home" :style="{ '--cover': `url('${stand.cover}')` }">
    <div class="welcome">
      <span class="badge">{{ t('badge') }}</span>
      <h1>{{ t('welcome', { name: stand.name }) }}</h1>
      <p>{{ t('tagline') }} · {{ stand.city }}, {{ t('country') }}</p>
      <!-- Idiomas grandes en la portada -->
      <div class="langs">
        <button v-for="l in languages" :key="l.code" :class="{ on: l.code === lang }" @click="setLang(l.code)">
          <span>{{ l.flag }}</span>{{ l.label }}
        </button>
      </div>
    </div>
    <div class="grid">
      <RouterLink v-for="(b, i) in buttons" :key="b.to" :to="{ name: b.to, params: { stand: stand.id } }" class="tile" :style="{ '--c': b.color, animationDelay: `${i * 80}ms` }">
        <span class="photo" :style="{ backgroundImage: `url('${b.img}')` }">
          <span class="emoji">{{ b.emoji }}</span>
          <span v-if="b.credit" class="credit">📷 {{ b.credit }}</span>
        </span>
        <span class="title">{{ t(b.title) }}</span>
        <span class="text">{{ t(b.text) }}</span>
        <i class="fas fa-arrow-right go"></i>
      </RouterLink>
    </div>
    <p class="touch">{{ t('touch') }}</p>
  </section>
</template>

<style scoped>
.home { flex: 1; display: flex; flex-direction: column; gap: clamp(18px, 3vh, 32px); padding: clamp(20px, 4vh, 44px) clamp(16px, 4vw, 48px); background: linear-gradient(rgba(10,47,68,.72), rgba(10,47,68,.9)), var(--cover) center/cover no-repeat; color: #fff; }
.welcome { text-align: center; animation: rise .6s ease both; }
.badge { display: inline-block; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); padding: 6px 16px; border-radius: 40px; font-size: .8rem; font-weight: 700; letter-spacing: 1px; }
.welcome h1 { font-size: clamp(2rem, 5vw, 3.4rem); margin: 12px 0 6px; font-weight: 800; line-height: 1.05; }
.welcome p { margin: 0; font-size: clamp(1rem, 2vw, 1.25rem); opacity: .85; }
.langs { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 16px; }
.langs button { display: inline-flex; align-items: center; gap: 8px; min-height: 50px; padding: 0 18px; border-radius: 40px; border: 2px solid rgba(255,255,255,.35); background: rgba(255,255,255,.1); color: #fff; font: inherit; font-weight: 700; font-size: 1.05rem; cursor: pointer; transition: background .2s, color .2s; }
.langs button span { font-size: 1.4rem; }
.langs button.on { background: #fff; color: #0A2F44; border-color: #fff; }
.grid { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(14px, 2.4vw, 24px); max-width: 1100px; width: 100%; margin: 0 auto; }
.tile { position: relative; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; min-height: clamp(170px, 26vh, 260px); padding: clamp(18px, 3vw, 30px); border-radius: 28px; background: #fff; color: #0A2F44; text-decoration: none; box-shadow: 0 24px 40px -22px rgba(0,0,0,.6); border-bottom: 8px solid var(--c); animation: rise .55s cubic-bezier(.2,.7,.2,1) both; transition: transform .2s, box-shadow .2s; }
.tile:active { transform: scale(.97); }
.tile:hover { transform: translateY(-4px); box-shadow: 0 30px 46px -22px rgba(0,0,0,.7); }
.tile { overflow: hidden; }
.photo { position: relative; display: block; margin: calc(-1 * clamp(18px, 3vw, 30px)) calc(-1 * clamp(18px, 3vw, 30px)) 10px; height: clamp(90px, 13vh, 150px); background-size: cover; background-position: center; margin-bottom: auto; }
.photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,47,68,.05), rgba(10,47,68,.35)); }
.emoji { position: absolute; left: 16px; bottom: -22px; z-index: 1; width: 64px; height: 64px; border-radius: 18px; background: #fff; display: grid; place-items: center; font-size: 2.2rem; box-shadow: 0 10px 20px -10px rgba(0,0,0,.5); }
.credit { position: absolute; right: 8px; top: 6px; z-index: 1; font-size: .62rem; color: #fff; background: rgba(0,0,0,.45); padding: 2px 6px; border-radius: 6px; }
.title { margin-top: 26px; }
.title { font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800; color: var(--c); }
.text { font-size: clamp(.95rem, 1.6vw, 1.1rem); color: #4a6472; line-height: 1.35; max-width: 30ch; }
.go { position: absolute; bottom: 22px; right: 22px; z-index: 2; width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #fff; font-size: 1.1rem; }
.touch { text-align: center; margin: 0; opacity: .75; font-weight: 600; animation: pulse 2.4s ease-in-out infinite; }
@keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes pulse { 50% { opacity: .35; } }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } .tile { min-height: 150px; } }
</style>
