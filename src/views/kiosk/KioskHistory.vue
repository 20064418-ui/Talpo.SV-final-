<script setup>
// Historia: un QR por cada lugar cercano. Se escanea con el celular o se toca en la tablet.
import { computed } from 'vue';
import QrCode from '@/components/kiosk/QrCode.vue';
import { distanceMeters, walkLabel } from '@/data/stands';

const props = defineProps({ stand: { type: Object, required: true } });
const places = computed(() => props.stand.places.map((p) => ({ ...p, meters: distanceMeters(props.stand, p) })).sort((a, b) => a.meters - b.meters));
const url = (p) => `${location.origin}/kiosk/${props.stand.id}/place/${p.slug}`;
</script>

<template>
  <section class="page">
    <div class="head">
      <span class="emoji">🏛️</span>
      <div><h1>History</h1><p>Scan a code with your phone camera to take the story with you — or touch a card to read it here.</p></div>
    </div>
    <div class="grid">
      <RouterLink v-for="(p, i) in places" :key="p.slug" :to="{ name: 'kiosk-place', params: { stand: stand.id, slug: p.slug } }" class="card" :style="{ animationDelay: `${i * 70}ms` }">
        <div class="photo" :class="{ noimg: !p.image }" :style="p.image ? { backgroundImage: `url('${p.image}')` } : {}">
              <span class="cat">{{ p.category }}</span><span v-if="!p.image" class="ph-emoji">{{ p.emoji }}</span>
            </div>
        <div class="body">
          <QrCode :value="url(p)" :size="118" :label="`QR ${p.name}`" />
          <div>
            <h2>{{ p.name }}</h2>
            <p>{{ p.short }}</p>
            <small><i class="fas fa-person-walking"></i> {{ p.meters < 30 ? 'You are here' : walkLabel(p.meters) }}</small>
          </div>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.page { flex: 1; padding: clamp(18px, 3vh, 36px) clamp(16px, 4vw, 48px); max-width: 1200px; width: 100%; margin: 0 auto; }
.head { display: flex; gap: 16px; align-items: center; margin-bottom: 22px; animation: rise .5s ease both; }
.head .emoji { font-size: 3rem; }
.head h1 { margin: 0; font-size: clamp(1.8rem, 4vw, 2.6rem); color: #0A2F44; }
.head p { margin: 4px 0 0; color: #58717f; font-size: 1.05rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 18px; }
.card { background: #fff; border-radius: 24px; overflow: hidden; text-decoration: none; color: inherit; box-shadow: 0 20px 34px -22px rgba(0,32,64,.35); animation: rise .5s cubic-bezier(.2,.7,.2,1) both; transition: transform .2s; }
.card:active { transform: scale(.98); }
.photo { height: 140px; background-size: cover; background-position: center; position: relative; }
.photo.noimg { background: linear-gradient(135deg, #1C6E6B, #0A2F44); display: grid; place-items: center; }
.ph-emoji { font-size: 3.4rem; filter: drop-shadow(0 6px 10px rgba(0,0,0,.35)); }
.cat { position: absolute; left: 14px; top: 14px; background: rgba(10,47,68,.85); color: #fff; font-weight: 700; font-size: .8rem; padding: 4px 12px; border-radius: 30px; }
.body { display: grid; grid-template-columns: auto 1fr; gap: 14px; padding: 14px; align-items: center; }
.body h2 { margin: 0 0 4px; font-size: 1.2rem; }
.body p { margin: 0 0 6px; color: #4a6472; font-size: .95rem; line-height: 1.4; }
.body small { color: #1C6E6B; font-weight: 700; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
</style>
