<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { challenges, SUBMIT_EMAIL, SUBJECT_TEMPLATE } from '@/data/contests';
import { useAuthStore } from '@/stores/auth';
import { useContestsStore } from '@/stores/contests';
import { toast } from '@/composables/useToast';

const router = useRouter();
const auth = useAuthStore();
const contests = useContestsStore();
const open = ref(null);   // 'start' | 'learn'
const busy = ref(false);
const form = reactive({ participant_name: auth.isAuthenticated ? auth.displayName : '', institution: '', grade: '', challenges: [] });

const subject = computed(() => `Talapo Challenge - ${form.participant_name || '[Team/Student Name]'} + ${form.institution || '[Institution]'} + ${form.grade || '[Grade]'}`);
const mailto = computed(() => `mailto:${SUBMIT_EMAIL}?subject=${encodeURIComponent(subject.value)}`);

function toggle(section) {
  open.value = open.value === section ? null : section;
  if (open.value) requestAnimationFrame(() => document.getElementById(`panel-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}
function pick(slug) {
  open.value = 'start';
  if (!form.challenges.includes(slug)) form.challenges.push(slug);
  requestAnimationFrame(() => document.getElementById('panel-start')?.scrollIntoView({ behavior: 'smooth' }));
}

async function join() {
  if (!auth.isAuthenticated) return router.push({ name: 'login', query: { redirect: '/contests' } });
  busy.value = true;
  try {
    await contests.join({ ...form });
    toast(`You’re in the Ranking Talapo with ${form.challenges.length} challenge(s)!`);
  } catch (e) { toast(e.message, 'error'); }
  finally { busy.value = false; }
}

async function copySubject() {
  await navigator.clipboard.writeText(subject.value);
  toast('Subject copied');
}

onMounted(() => contests.loadRanking().catch(() => {}));

const guide = [
  { icon: 'fa-user-plus', title: 'Create your account', text: 'Sign up with email, Google, GitHub or Facebook. You get a Talapo Passport right away.', to: '/register' },
  { icon: 'fa-passport', title: 'Fill your passport', text: 'Add your photo and data. Your streak, stamps and contests live there.', to: '/passport' },
  { icon: 'fa-route', title: 'Build and save routes', text: 'Pick destinations in Tours, choose a starting point and save the itinerary.', to: '/tours' },
  { icon: 'fa-feather-pointed', title: 'Ask Talapo AI', text: 'Tap “Ask Talapo” on any page for food, places and route ideas.', to: null },
  { icon: 'fa-fire', title: 'Keep your streak', text: 'Open Talapo each day while signed in to grow your Talapo Streak.', to: '/passport' },
  { icon: 'fa-trophy', title: 'Join a contest', text: 'Pick challenges below, register, and email your work to join the ranking.', to: null },
];
</script>

<template>
  <div class="tp contests">
    <header class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="hero-badge">TALAPO CONTESTS</div>
          <h1>Join Talapo Contests!</h1>
          <p>Five creative challenges about El Salvador for students and teams. Make something funny, useful or beautiful — and climb the Ranking Talapo.</p>
          <div class="ctas">
            <button class="btn btn-primary" :aria-expanded="open === 'start'" aria-controls="panel-start" @click="toggle('start')"><i class="fas fa-flag-checkered"></i> Start Contest</button>
            <button class="btn btn-light" :aria-expanded="open === 'learn'" aria-controls="panel-learn" @click="toggle('learn')"><i class="fas fa-compass"></i> Learn How to Use Talapo</button>
          </div>
        </div>
        <aside class="ranking card" aria-label="Ranking Talapo top 10">
          <h2><i class="fas fa-ranking-star"></i> Ranking Talapo</h2>
          <ol v-if="contests.ranking.length">
            <li v-for="(r, i) in contests.ranking" :key="r.participant_name + i">
              <span class="pos">{{ i + 1 }}</span><span class="who">{{ r.participant_name }}<small>{{ r.institution }}</small></span><b>{{ r.total_score }} pts</b>
            </li>
          </ol>
          <p v-else class="muted">The ranking opens with the first entries. Be the first name on it.</p>
        </aside>
      </div>
    </header>

    <!-- Accordion: Start Contest -->
    <section id="panel-start" class="wrap accordion" :class="{ open: open === 'start' }">
      <button class="acc-head" :aria-expanded="open === 'start'" @click="toggle('start')">
        <span><i class="fas fa-flag-checkered"></i> Start Contest</span><i class="fas fa-chevron-down"></i>
      </button>
      <div v-show="open === 'start'" class="acc-body">
        <div class="start-grid">
          <form class="card join" @submit.prevent="join">
            <h3>Join the Ranking Talapo</h3>
            <div class="field"><label for="cn">Team or student name</label><input id="cn" v-model.trim="form.participant_name" class="input" required maxlength="80" /></div>
            <div class="two">
              <div class="field"><label for="ci">Institution</label><input id="ci" v-model.trim="form.institution" class="input" required maxlength="100" /></div>
              <div class="field"><label for="cg">Grade</label><input id="cg" v-model.trim="form.grade" class="input" required maxlength="30" placeholder="9th grade" /></div>
            </div>
            <fieldset>
              <legend>Challenges you’ll take on</legend>
              <label v-for="c in challenges" :key="c.slug" class="check">
                <input v-model="form.challenges" type="checkbox" :value="c.slug" />
                <span><i class="fas" :class="c.icon"></i> {{ c.title }}</span>
                <em v-if="contests.joined(c.slug)">joined</em>
              </label>
            </fieldset>
            <button class="btn btn-primary" :disabled="busy || !form.challenges.length || !form.participant_name || !form.institution || !form.grade">
              <i class="fas" :class="busy ? 'fa-spinner fa-spin' : 'fa-trophy'"></i>
              {{ auth.isAuthenticated ? 'Join the ranking' : 'Sign in to join' }}
            </button>
          </form>
          <div class="rules">
            <h3>Rules</h3>
            <ol>
              <li>Individual students or school teams can take part.</li>
              <li>Join as many challenges as you like; each counts separately in the ranking.</li>
              <li>Work must be original and respectful. No content that makes fun of people or communities.</li>
              <li>Register here first, then email your submission with the exact subject below.</li>
              <li>The Talapo team reviews each entry and publishes points in the ranking.</li>
            </ol>
          </div>
        </div>
      </div>
    </section>

    <!-- Accordion: Learn how to use Talapo -->
    <section id="panel-learn" class="wrap accordion" :class="{ open: open === 'learn' }">
      <button class="acc-head" :aria-expanded="open === 'learn'" @click="toggle('learn')">
        <span><i class="fas fa-compass"></i> Learn How to Use Talapo</span><i class="fas fa-chevron-down"></i>
      </button>
      <div v-show="open === 'learn'" class="acc-body">
        <ol class="guide">
          <li v-for="(g, i) in guide" :key="g.title">
            <span class="n">{{ i + 1 }}</span>
            <i class="fas" :class="g.icon"></i>
            <h4>{{ g.title }}</h4>
            <p>{{ g.text }}</p>
            <RouterLink v-if="g.to" :to="g.to">Go there</RouterLink>
          </li>
        </ol>
      </div>
    </section>

    <!-- How to submit -->
    <section class="wrap submit card">
      <div>
        <h2>How to submit your answers?</h2>
        <p>Send your files or links to <a :href="mailto">{{ SUBMIT_EMAIL }}</a>. The subject line is required:</p>
        <p class="subject-template">{{ SUBJECT_TEMPLATE }}</p>
        <p class="muted">Your subject with the form data:</p>
        <div class="subject-row"><code>{{ subject }}</code><button class="btn btn-ghost btn-sm" @click="copySubject"><i class="fas fa-copy"></i> Copy</button></div>
      </div>
      <a :href="mailto" class="btn btn-dark"><i class="fas fa-envelope"></i> Open email</a>
    </section>

    <!-- The 5 challenges -->
    <section class="wrap section">
      <div class="section-head"><h2>The five challenges</h2><p class="muted">Pick one, several, or all five.</p></div>
      <div class="challenges">
        <article v-for="(c, i) in challenges" :key="c.slug" class="ch" :style="{ '--c': c.color }">
          <header><span class="emoji" aria-hidden="true"><i class="fas" :class="c.icon"></i></span><span class="idx">Challenge {{ i + 1 }}</span></header>
          <h3>{{ c.title }}</h3>
          <p><strong>Creative challenge:</strong> {{ c.challenge }}</p>
          <p><strong>Submit:</strong> {{ c.submit }}</p>
          <button class="btn btn-sm" :class="contests.joined(c.slug) ? 'btn-ghost' : 'btn-dark'" @click="pick(c.slug)">
            {{ contests.joined(c.slug) ? 'Joined ✓' : 'Take this challenge' }}
          </button>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero { background: linear-gradient(rgba(1, 5, 37, 0.55), rgba(4, 12, 73, 0.55)), url('/assets/img/main/playahero.jpg') no-repeat center center/cover; color: #fff; padding: clamp(3rem, 7vw, 5.5rem) 0; font-family: 'Outfit', 'Inter', sans-serif; }
.hero-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 3rem; align-items: center; }
/* Mismo lenguaje visual que el hero de main.html */
.hero-badge { display: inline-block; background: #0A2F44; color: #fff; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; padding: 0.4rem 1rem; border-radius: 40px; margin-bottom: 1.2rem; }
.hero h1 { font-size: clamp(2.4rem, 5vw, 3.8rem); font-weight: 800; text-transform: uppercase; line-height: 1.05; max-width: 14ch; letter-spacing: -0.01em; }
.hero p { font-size: 1rem; font-weight: 600; color: #fff; max-width: 48ch; line-height: 1.5; }
.hero .ctas .btn { border-radius: 40px; font-family: 'Outfit', 'Inter', sans-serif; transition: transform .25s, box-shadow .25s, background .25s; }
.hero .ctas .btn:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -10px rgba(0,0,0,.4); }
.hero .ctas .btn-primary { background: #0A2F44; }
.hero .ctas .btn-primary:hover { background: #1C6E6B; }
.hero .ranking { border-radius: 24px; box-shadow: 0 20px 35px -12px rgba(0, 32, 64, 0.25); }
.ctas { display: flex; flex-wrap: wrap; gap: .7rem; margin-top: 1.5rem; }
.ranking { color: var(--ink-900); padding: 1.4rem; }
.ranking h2 { font-size: 1.3rem; }
.ranking p { color: var(--ink-500); font-size: .95rem; }
.ranking h2 i { color: var(--amber-400); }
.ranking ol { list-style: none; padding: 0; margin: 0; display: grid; gap: .5rem; }
.ranking li { display: flex; align-items: center; gap: .7rem; }
.pos { width: 28px; height: 28px; border-radius: 50%; background: var(--paper); display: grid; place-items: center; font-weight: 800; }
.ranking li:first-child .pos { background: var(--amber-400); color: #fff; }
.who { flex: 1; font-weight: 700; }
.who small { display: block; font-weight: 400; color: var(--ink-500); }

.accordion { margin-top: 1.2rem; }
.acc-head { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 1.1rem 1.3rem; background: #fff; border: 1px solid var(--line); border-radius: var(--radius-m); cursor: pointer; font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; }
.acc-head span i { color: var(--teal-500); margin-right: .5rem; }
.acc-head > i { transition: transform .25s; }
.open .acc-head { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.open .acc-head > i { transform: rotate(180deg); }
.acc-body { border: 1px solid var(--line); border-top: 0; border-radius: 0 0 var(--radius-m) var(--radius-m); padding: 1.5rem; background: #fff; animation: slide .25s ease; }
@keyframes slide { from { opacity: 0; transform: translateY(-6px); } }
.start-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; }
.join { padding: 1.4rem; background: var(--paper); border: 0; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; }
fieldset { border: 0; padding: 0; margin: 0 0 1.2rem; display: grid; gap: .45rem; }
legend { font-weight: 600; font-size: var(--step--1); margin-bottom: .5rem; }
.check { display: flex; align-items: center; gap: .6rem; background: #fff; border: 1px solid var(--line); border-radius: var(--radius-s); padding: .6rem .8rem; cursor: pointer; }
.check input { accent-color: var(--teal-700); width: 18px; height: 18px; }
.check em { margin-left: auto; font-style: normal; font-size: .75rem; font-weight: 800; color: var(--teal-700); }
.rules ol { padding-left: 1.2rem; display: grid; gap: .5rem; }
.guide { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1rem; }
.guide li { position: relative; background: var(--paper); border-radius: var(--radius-m); padding: 1.2rem; }
.guide .n { position: absolute; top: 1rem; right: 1rem; font-family: var(--font-display); font-weight: 800; color: var(--ink-300); font-size: 1.4rem; }
.guide li > i { font-size: 1.6rem; color: var(--teal-700); margin-bottom: .6rem; }
.guide h4 { margin: 0 0 .3rem; }
.guide p { font-size: .92rem; margin-bottom: .5rem; }
.guide a { font-weight: 700; }

.submit { margin-top: 2rem; padding: clamp(1.4rem, 3vw, 2.2rem); display: flex; gap: 2rem; align-items: center; justify-content: space-between; flex-wrap: wrap; border-left: 6px solid var(--coral-500); }
.submit h2 { font-size: var(--step-3); }
.subject-template { font-weight: 700; background: #fff4df; padding: .6rem .9rem; border-radius: var(--radius-s); display: inline-block; }
.subject-row { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; }
.subject-row code { background: var(--paper); padding: .5rem .8rem; border-radius: var(--radius-s); font-size: .88rem; word-break: break-word; }

.challenges { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.2rem; }
.ch { background: #fff; border: 1px solid var(--line); border-top: 6px solid var(--c); border-radius: var(--radius-m); padding: 1.4rem; display: flex; flex-direction: column; }
.ch header { display: flex; justify-content: space-between; align-items: center; }
.emoji { font-size: 2.2rem; }
.idx { font-size: .8rem; font-weight: 800; color: var(--ink-500); }
.ch h3 { font-size: 1.4rem; margin: .6rem 0; }
.ch p { font-size: .95rem; }
.ch .btn { margin-top: auto; align-self: flex-start; }
@media (max-width: 860px) { .hero-grid, .start-grid { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .two { grid-template-columns: 1fr; } }
</style>
