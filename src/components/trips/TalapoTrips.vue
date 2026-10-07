<script setup>
// Itinerarios que el equipo Talapo armó para el usuario (My trips → From Talapo)
import { ref } from 'vue';
import { kindOf, dayDate, niceTime } from '@/data/tripKinds';

defineProps({ trips: { type: Array, default: () => [] } });
const open = ref(null);
const openDay = ref(0);
const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const maps = (place) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, El Salvador`)}`;
function toggle(t) { open.value = open.value === t.id ? null : t.id; openDay.value = 0; }
function print() { window.print(); }
</script>

<template>
  <ul class="tt-list">
    <li v-for="t in trips" :key="t.id" class="tt" :class="{ on: open === t.id }">
      <button class="tt-head" :aria-expanded="open === t.id" @click="toggle(t)">
        <span class="badge"><i class="fas fa-feather-pointed"></i> Made for you by Talapo</span>
        <h3>{{ t.title }}</h3>
        <span class="meta">
          <span><i class="fas fa-calendar-days"></i> {{ t.days.length }} day{{ t.days.length > 1 ? 's' : '' }}</span>
          <span v-if="t.start_date"><i class="fas fa-plane-departure"></i> {{ dayDate(t.start_date, 0) }}</span>
          <span><i class="fas fa-user-group"></i> {{ t.travelers }}</span>
          <span class="upd">Updated {{ fmt(t.updated_at) }}</span>
        </span>
        <i class="fas fa-chevron-down chev"></i>
      </button>

      <div v-if="open === t.id" class="tt-body">
        <p v-if="t.summary" class="summary">{{ t.summary }}</p>

        <div v-if="t.included?.length" class="incl">
          <b>Included</b>
          <ul><li v-for="x in t.included" :key="x"><i class="fas fa-check"></i> {{ x }}</li></ul>
        </div>

        <!-- Días como pestañas -->
        <div class="days" role="tablist">
          <button v-for="(d, i) in t.days" :key="i" role="tab" :aria-selected="openDay === i" :class="{ on: openDay === i }" @click="openDay = i">
            <b>Day {{ i + 1 }}</b><small v-if="t.start_date">{{ dayDate(t.start_date, i) }}</small>
          </button>
        </div>

        <template v-for="(d, i) in t.days" :key="'d' + i">
          <section v-show="openDay === i" class="day">
            <h4 v-if="d.title">{{ d.title }}</h4>
            <ol class="timeline">
              <li v-for="(it, j) in d.items" :key="j" :style="{ '--k': kindOf(it.kind).color }">
                <span class="dot">{{ kindOf(it.kind).emoji }}</span>
                <div class="what">
                  <span class="time" v-if="it.time">{{ niceTime(it.time) }}</span>
                  <b>{{ it.title }}</b>
                  <a v-if="it.place" :href="maps(it.place)" target="_blank" rel="noopener" class="place"><i class="fas fa-location-dot"></i> {{ it.place }}</a>
                  <p v-if="it.notes">{{ it.notes }}</p>
                </div>
              </li>
            </ol>
          </section>
        </template>

        <div class="tt-acts">
          <RouterLink class="act primary" :to="{ path: '/messages', query: { request: t.plan_request_id, plan: t.title } }"><i class="fas fa-comments"></i> Ask for a change</RouterLink>
          <button class="act" @click="print"><i class="fas fa-print"></i> Print</button>
        </div>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.tt-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.1rem; }
.tt { background: #fff; border-radius: 24px; box-shadow: 0 20px 35px -20px rgba(0,32,64,.25); border: 1px solid rgba(28,110,107,.12); overflow: hidden; }
.tt-head { width: 100%; text-align: left; border: 0; background: linear-gradient(105deg, #1C6E6B, #0A2F44); color: #fff; padding: 1.2rem 3.2rem 1.2rem 1.3rem; cursor: pointer; font: inherit; position: relative; display: grid; gap: .35rem; }
.badge { justify-self: start; background: rgba(255,255,255,.16); border-radius: 20px; padding: .2rem .7rem; font-size: .75rem; font-weight: 700; }
.tt-head h3 { margin: 0; font-size: 1.35rem; }
.meta { display: flex; flex-wrap: wrap; gap: .4rem 1rem; font-size: .85rem; opacity: .92; }
.meta i { margin-right: .3rem; } .upd { opacity: .75; }
.chev { position: absolute; right: 1.2rem; top: 50%; transform: translateY(-50%); transition: transform .25s; }
.tt.on .chev { transform: translateY(-50%) rotate(180deg); }
.tt-body { padding: 1.2rem 1.3rem 1.3rem; }
.summary { margin: 0 0 1rem; color: #1A3A4A; line-height: 1.6; white-space: pre-wrap; }
.incl { background: #EEF6F6; border-radius: 16px; padding: .8rem 1rem; margin-bottom: 1rem; }
.incl b { color: #0A2F44; } .incl ul { list-style: none; margin: .4rem 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .3rem .8rem; }
.incl li { color: #1A3A4A; font-size: .9rem; } .incl i { color: #1C6E6B; margin-right: .3rem; }
.days { display: flex; gap: .4rem; overflow-x: auto; padding-bottom: .3rem; margin-bottom: .8rem; scrollbar-width: thin; }
.days button { flex: 0 0 auto; border: 1.5px solid #dce7ea; background: #fff; border-radius: 14px; padding: .45rem .9rem; font: inherit; cursor: pointer; display: grid; text-align: left; color: #1A3A4A; }
.days button small { color: #8aa0ab; font-size: .75rem; }
.days button.on { background: #0A2F44; border-color: #0A2F44; color: #fff; } .days button.on small { color: #cfe0e6; }
.day h4 { margin: 0 0 .8rem; color: #0A2F44; font-size: 1.1rem; }
.timeline { list-style: none; margin: 0; padding: 0; position: relative; }
.timeline::before { content: ''; position: absolute; left: 19px; top: 8px; bottom: 8px; width: 2px; background: #e3ecef; }
.timeline li { display: flex; gap: .9rem; padding-bottom: 1rem; position: relative; }
.dot { width: 40px; height: 40px; border-radius: 50%; background: #fff; border: 2.5px solid var(--k); display: grid; place-items: center; font-size: 1.05rem; flex: 0 0 auto; z-index: 1; }
.what { display: grid; gap: .15rem; padding-top: .15rem; min-width: 0; }
.time { font-size: .78rem; font-weight: 800; color: var(--k); }
.what b { color: #0A2F44; }
.place { color: #1C6E6B; font-size: .85rem; text-decoration: none; font-weight: 600; } .place:hover { text-decoration: underline; }
.what p { margin: .15rem 0 0; color: #4a6472; font-size: .9rem; }
.tt-acts { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .4rem; }
.act { display: inline-flex; align-items: center; gap: .4rem; border: 1.5px solid #dce7ea; background: #fff; color: #1A3A4A; border-radius: 40px; padding: .5rem .95rem; font: inherit; font-size: .88rem; font-weight: 600; text-decoration: none; cursor: pointer; }
.act.primary { background: #E46D5C; border-color: #E46D5C; color: #fff; }
@media print {
  .tt-acts, .chev, .days { display: none !important; }
  .day { display: block !important; break-inside: avoid; margin-bottom: 1rem; }
}
</style>
