<script setup>
// Pantalla principal del Stand: 4 botones grandes
defineProps({ stand: { type: Object, required: true } });
const buttons = [
  { to: 'kiosk-news', emoji: '📰', title: 'Municipal News', text: 'What is happening in the city', color: '#1C6E6B' },
  { to: 'kiosk-history', emoji: '🏛️', title: 'History', text: 'Scan the QR codes and discover the places around you', color: '#0A2F44' },
  { to: 'kiosk-map', emoji: '🗺️', title: 'Map', text: 'Nearby places and how to get there', color: '#E46D5C' },
  { to: 'kiosk-form', emoji: '📝', title: 'Fill the form', text: 'Stamp your Talapo Passport and report the area', color: '#C98A1B' },
];
</script>

<template>
  <section class="home" :style="{ '--cover': `url('${stand.cover}')` }">
    <div class="welcome">
      <span class="badge">✦ TALAPO STAND ✦</span>
      <h1>Welcome to {{ stand.name }}</h1>
      <p>{{ stand.tagline }} · {{ stand.city }}, El Salvador</p>
    </div>
    <div class="grid">
      <RouterLink v-for="(b, i) in buttons" :key="b.to" :to="{ name: b.to, params: { stand: stand.id } }" class="tile" :style="{ '--c': b.color, animationDelay: `${i * 80}ms` }">
        <span class="emoji">{{ b.emoji }}</span>
        <span class="title">{{ b.title }}</span>
        <span class="text">{{ b.text }}</span>
        <i class="fas fa-arrow-right go"></i>
      </RouterLink>
    </div>
    <p class="touch">👆 Touch a button to start</p>
  </section>
</template>

<style scoped>
.home { flex: 1; display: flex; flex-direction: column; gap: clamp(18px, 3vh, 32px); padding: clamp(20px, 4vh, 44px) clamp(16px, 4vw, 48px); background: linear-gradient(rgba(10,47,68,.72), rgba(10,47,68,.9)), var(--cover) center/cover no-repeat; color: #fff; }
.welcome { text-align: center; animation: rise .6s ease both; }
.badge { display: inline-block; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); padding: 6px 16px; border-radius: 40px; font-size: .8rem; font-weight: 700; letter-spacing: 1px; }
.welcome h1 { font-size: clamp(2rem, 5vw, 3.4rem); margin: 12px 0 6px; font-weight: 800; line-height: 1.05; }
.welcome p { margin: 0; font-size: clamp(1rem, 2vw, 1.25rem); opacity: .85; }
.grid { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(14px, 2.4vw, 24px); max-width: 1100px; width: 100%; margin: 0 auto; }
.tile { position: relative; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; min-height: clamp(170px, 26vh, 260px); padding: clamp(18px, 3vw, 30px); border-radius: 28px; background: #fff; color: #0A2F44; text-decoration: none; box-shadow: 0 24px 40px -22px rgba(0,0,0,.6); border-bottom: 8px solid var(--c); animation: rise .55s cubic-bezier(.2,.7,.2,1) both; transition: transform .2s, box-shadow .2s; }
.tile:active { transform: scale(.97); }
.tile:hover { transform: translateY(-4px); box-shadow: 0 30px 46px -22px rgba(0,0,0,.7); }
.emoji { font-size: clamp(2.6rem, 6vw, 4rem); line-height: 1; margin-bottom: auto; }
.title { font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800; color: var(--c); }
.text { font-size: clamp(.95rem, 1.6vw, 1.1rem); color: #4a6472; line-height: 1.35; max-width: 30ch; }
.go { position: absolute; top: 22px; right: 22px; width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #fff; font-size: 1.1rem; }
.touch { text-align: center; margin: 0; opacity: .75; font-weight: 600; animation: pulse 2.4s ease-in-out infinite; }
@keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes pulse { 50% { opacity: .35; } }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } .tile { min-height: 150px; } }
</style>
