<script setup>
// login.html ORIGINAL (mismo marcado y login.css) + InsForge + botones sociales
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SocialButtons from '@/components/auth/SocialButtons.vue';
import { useAuthStore } from '@/stores/auth';
import '@/styles/pages/login.css';
import '@/styles/pages/auth-extras.css';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const form = reactive({ email: '', password: '' });
const msg = ref(route.query.verified ? { type: 'success', text: 'Email verified. Sign in to continue.' }
  : route.query.reset ? { type: 'success', text: 'Password updated. Sign in with your new password.' } : null);
const resetSent = ref(false);
const busy = ref(false);
const showPass = ref(false);
const unverified = ref(false);
const otp = ref('');

async function verifyNow() {
  busy.value = true;
  try {
    await auth.verifyEmail(form.email, otp.value.trim());
    router.replace('/passport');
  } catch { msg.value = { type: 'error', text: 'The code is invalid or expired. Request a new one.' }; }
  finally { busy.value = false; }
}
async function resendCode() {
  try { await auth.resendVerification(form.email); msg.value = { type: 'success', text: `New code sent to ${form.email}. Check your spam folder too.` }; }
  catch (e) { msg.value = { type: 'error', text: e.message }; }
}

async function submit() {
  if (!form.email || !form.password) { msg.value = { type: 'warning', text: 'Please fill in all the fields' }; return; }
  msg.value = null;
  busy.value = true;
  try {
    await auth.signIn(form);
    msg.value = { type: 'success', text: `Welcome, ${auth.displayName}!` };
    // Usuario ya registrado que inicia sesión -> Principal (main)
    router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/main');
  } catch (e) {
    if (/verif/i.test(e.message)) {
      unverified.value = true;
      msg.value = { type: 'warning', text: 'Your email is not verified yet. Enter the code we sent you, or request a new one.' };
    } else {
      msg.value = { type: 'error', text: /invalid|credential/i.test(e.message) ? 'Incorrect email or password' : e.message };
    }
  } finally { busy.value = false; }
}

async function forgot() {
  if (!form.email) { msg.value = { type: 'warning', text: 'Type your email first, then tap “Forgot password?”' }; return; }
  try {
    await auth.sendPasswordReset(form.email);
    resetSent.value = true;
    msg.value = { type: 'success', text: 'If that email has an account, we sent you a message to reset your password. Check your spam folder too.' };
  } catch (e) { msg.value = { type: 'error', text: e.message }; }
}
const icon = { error: 'fa-exclamation-circle', success: 'fa-check-circle', warning: 'fa-exclamation-triangle' };
</script>

<template>
  <div class="pg-login pg-auth">
    <div class="main-container">
      <!-- Left Side: Information & Branding -->
      <section class="info-section">
        <div class="info-content">
          <h1>Explore <span class="gradient-text">Talapo.sv</span></h1>
          <p class="tagline">Where Nature Meets Culture</p>
          <p class="description">
            Discover authentic journeys that connect you with local communities, pristine landscapes and meaningful adventures. Your next great story starts here.
          </p>
          <div class="image-grid">
            <img src="/assets/img/registreandlogin/p1.jpg" alt="Santa Ana Cathedral">
            <img src="/assets/img/registreandlogin/p2.jpg" alt="Coatepeque Lake">
            <img src="/assets/img/registreandlogin/p3.jpg" alt="Izalco Volcano">
            <img src="/assets/img/registreandlogin/p4.jpg" alt="Ataco Town">
          </div>
          <div class="stats-row">
            <div class="stat-item"><strong>12K+</strong><br><span>Happy Travelers</span></div>
            <div class="stat-item"><strong>38</strong><br><span>Unique Experiences</span></div>
            <div class="stat-item"><strong>4.9★</strong><br><span>Rating</span></div>
          </div>
        </div>
      </section>

      <section class="login-section">
        <div class="login-box">
          <RouterLink to="/"><img src="/assets/img/registreandlogin/image (2).png" class="talapo-logo" alt="Talapo Logo"></RouterLink>
          <h2>Sign In</h2>
          <p>Access your adventure account</p>

          <form id="loginForm" novalidate @submit.prevent="submit">
            <Transition name="page">
              <div v-if="msg" :key="msg.text" class="form-message" :class="msg.type" role="alert">
                <i class="fas" :class="icon[msg.type]"></i><span>{{ msg.text }}</span>
              </div>
            </Transition>

            <SocialButtons title="Sign in with" @error="(t) => (msg = { type: 'error', text: t })" />

            <div class="form-group">
              <label for="loginUser">Email</label>
              <input id="loginUser" v-model.trim="form.email" type="email" name="email" required autocomplete="email" placeholder="Enter your email">
            </div>
            <div class="form-group">
              <label for="loginPass">Password</label>
              <div class="pass-wrap">
                <input id="loginPass" v-model="form.password" :type="showPass ? 'text' : 'password'" name="password" required autocomplete="current-password" placeholder="Enter your password">
                <button type="button" :aria-label="showPass ? 'Hide password' : 'Show password'" @click="showPass = !showPass"><i class="fas" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i></button>
              </div>
            </div>
            <button id="loginButton" type="submit" class="btn-login" :disabled="busy">
              {{ busy ? 'Signing in…' : 'Get into' }} <i class="fas fa-arrow-right"></i>
            </button>
          </form>

          <Transition name="page">
            <form v-if="unverified" class="verify-box" @submit.prevent="verifyNow">
              <div class="form-group">
                <label for="otp">Verification code</label>
                <input id="otp" v-model="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="123456">
              </div>
              <button type="submit" class="btn-login" :disabled="busy || otp.trim().length < 6">Verify and continue <i class="fas fa-check"></i></button>
              <p class="verify-help"><button type="button" class="link-inline" @click="resendCode">Resend the code</button></p>
            </form>
          </Transition>

          <p v-if="resetSent" class="verify-help">
            Did the email include a 6-digit code?
            <RouterLink class="link-inline" :to="{ path: '/reset-password', query: { email: form.email } }">Enter it here</RouterLink>
          </p>

          <div class="login-footer">
            <a href="#" @click.prevent="forgot">Forgot password?</a>
            <span class="divider">•</span>
            <RouterLink to="/register">Create new account</RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
