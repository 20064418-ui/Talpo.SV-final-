<script setup>
// Ficha de un lugar (se abre en la tablet o en el celular al escanear el QR)
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import QrCode from '@/components/kiosk/QrCode.vue';
import { distanceMeters, walkLabel, directionsUrl } from '@/data/stands';
import { useKioskI18n } from '@/i18n/kiosk';
const { t, loc } = useKioskI18n();

const props = defineProps({ stand: { type: Object, required: true } });
const route = useRoute();
const place = computed(() => props.stand.places.find((p) => p.slug === route.params.slug));
const meters = computed(() => (place.value ? distanceMeters(props.stand, place.value) : 0));
const dir = computed(() => place.value && directionsUrl(props.stand, place.value));
</script>

<template>
  <section v-if="place" class="place">
    <div class="hero" :style="{ backgroundImage: place.image ? `linear-gradient(rgba(10,47,68,.15), rgba(10,47,68,.85)), url('${place.image}')` : 'linear-gradient(135deg, #1C6E6B, #0A2F44)' }">
      <span v-if="!place.image" class="hero-emoji">{{ place.emoji }}</span>
      <span class="cat">{{ loc(place.category) }}</span>
      <h1>{{ loc(place.name) }}</h1>
      <p><i class="fas fa-person-walking"></i> {{ meters < 30 ? t('youAreHere') : t('fromStand', { walk: walkLabel(meters) }) }}</p>
    </div>
    <div class="content">
      <article>
        <p class="lead">{{ loc(place.short) }}</p>
        <p>{{ loc(place.story) }}</p>
        <div class="tip">💡 <b>{{ t('tipLabel') }}</b> {{ loc(place.tip) }}</div>
        <a :href="dir" target="_blank" rel="noopener" class="go"><i class="fas fa-diamond-turn-right"></i> {{ t('howToGet') }}</a>
      </article>
      <aside class="qr-box">
        <h2>{{ t('takeIt') }}</h2>
        <p>{{ t('takeItText') }}</p>
        <QrCode :value="dir" :size="170" :label="t('howToGet')" />
      </aside>
    </div>
    <p class="more">{{ t('discoverMore') }} <RouterLink to="/">Talapo.SV</RouterLink> ✈️</p>
  </section>
  <section v-else class="place missing"><h1>{{ t('placeNotFound') }}</h1></section>
</template>

<style scoped>
.place { flex: 1; max-width: 1100px; width: 100%; margin: 0 auto; padding: clamp(14px, 3vh, 30px) clamp(14px, 4vw, 40px); }
.hero { border-radius: 28px; min-height: 280px; background-size: cover; background-position: center; color: #fff; display: flex; flex-direction: column; justify-content: flex-end; padding: 26px; animation: rise .55s ease both; }
.hero { position: relative; }
.hero-emoji { position: absolute; right: 28px; top: 20px; font-size: 5rem; opacity: .9; }
.cat { align-self: flex-start; background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.35); padding: 4px 14px; border-radius: 30px; font-weight: 700; font-size: .85rem; margin-bottom: auto; }
.hero h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.2rem); line-height: 1.05; }
.hero p { margin: 8px 0 0; font-weight: 600; opacity: .9; }
.content { display: grid; grid-template-columns: 1fr 280px; gap: 20px; margin-top: 20px; }
article { background: #fff; border-radius: 24px; padding: 24px; box-shadow: 0 20px 34px -22px rgba(0,32,64,.35); animation: rise .55s .08s ease both; }
.lead { font-size: 1.2rem; font-weight: 700; color: #0A2F44; margin-top: 0; }
article p { font-size: 1.08rem; line-height: 1.65; color: #34505e; }
.tip { background: #FFF6E5; border-left: 5px solid #F2A93B; border-radius: 12px; padding: 12px 14px; margin: 16px 0; color: #5c4210; }
.go { display: inline-flex; align-items: center; gap: 10px; background: #E46D5C; color: #fff; text-decoration: none; font-weight: 800; padding: 14px 24px; border-radius: 40px; font-size: 1.05rem; }
.qr-box { background: #0A2F44; color: #fff; border-radius: 24px; padding: 20px; display: grid; justify-items: center; text-align: center; gap: 8px; align-self: start; animation: rise .55s .15s ease both; }
.qr-box h2 { margin: 0; font-size: 1.2rem; }
.qr-box p { margin: 0 0 6px; opacity: .85; }
.more { text-align: center; color: #58717f; margin-top: 22px; }
.more a { color: #1C6E6B; font-weight: 700; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (max-width: 760px) { .content { grid-template-columns: 1fr; } .qr-box { display: none; } }
</style>
