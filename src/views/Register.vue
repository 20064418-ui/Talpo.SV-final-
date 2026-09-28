<script setup>
// registre.html ORIGINAL (mismo marcado y registre.css) + InsForge + botones sociales
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import SocialButtons from '@/components/auth/SocialButtons.vue';
import { useAuthStore } from '@/stores/auth';
import { usePassportStore } from '@/stores/passport';
import { insforge } from '@/lib/insforge';
import '@/styles/pages/register.css';
import '@/styles/pages/auth-extras.css';

const auth = useAuthStore();
const passport = usePassportStore();
const router = useRouter();
const form = reactive({ name: '', email: '', username: '', password: '', confirm: '' });
const msg = ref(null);
const busy = ref(false);
const step = ref('form');   // 'form' | 'verify' (código de 6 dígitos si InsForge lo pide)
const otp = ref('');
const icon = { error: 'fa-exclamation-circle', success: 'fa-check-circle', warning: 'fa-exclamation-triangle' };

async function goToPassport() {
  await passport.ensureProfile();
  if (form.username) await insforge.auth.setProfile({ username: form.username }).catch(() => {});
  router.replace('/passport');   // Registro por primera vez -> Pasaporte
}

async function submit() {
  msg.value = null;
  if (!form.name || !form.email || !form.username || !form.password || !form.confirm) {
    msg.value = { type: 'warning', text: 'Please fill in all the fields' }; return;
  }
  if (form.password.length < 8) { msg.value = { type: 'warning', text: 'Your password must have at least 8 characters' }; return; }
  if (form.password !== form.confirm) { msg.value = { type: 'error', text: 'The passwords do not match' }; return; }
  busy.value = true;
  try {
    const { needsVerification } = await auth.signUp(form);
    if (needsVerification) {
      step.value = 'verify';
      msg.value = { type: 'success', text: `We sent a 6-digit code to ${form.email}. Check your inbox and spam folder.` };
    } else {
      msg.value = { type: 'success', text: 'Account created! Let’s create your passport…' };
      await goToPassport();
    }
  } catch (e) {
    msg.value = { type: 'error', text: /exist|already/i.test(e.message) ? 'That email already has an account. Please sign in.' : e.message };
  } finally { busy.value = false; }
}

// Reenviar código con espera de 60 s entre intentos
const cooldown = ref(0);
let cdTimer;
async function resend() {
  if (cooldown.value) return;
  try {
    await auth.resendVerification(form.email);
    msg.value = { type: 'success', text: `We sent a new code to ${form.email}. It can take a minute — check your spam folder too.` };
    cooldown.value = 60;
    clearInterval(cdTimer);
    cdTimer = setInterval(() => { cooldown.value -= 1; if (cooldown.value <= 0) clearInterval(cdTimer); }, 1000);
  } catch (e) { msg.value = { type: 'error', text: e.message }; }
}

async function verify() {
  busy.value = true;
  try { await auth.verifyEmail(form.email, otp.value.trim()); await goToPassport(); }
  catch { msg.value = { type: 'error', text: 'The code is invalid or expired. Check your email or request a new one.' }; }
  finally { busy.value = false; }
}
</script>

<template>
  <div class="pg-register pg-auth">
    <div class="main-container">
      <!-- Left Side: Information & Branding -->
      <section class="info-section">
        <div class="info-content">
          <h1>Join <span class="gradient-text">Talapo.sv</span></h1>
          <p class="tagline">START YOUR JOURNEY TODAY</p>
          <p class="description">
            Become part of our community and unlock authentic experiences that connect you with local culture, breathtaking landscapes, and unforgettable adventures. Your story begins here.
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

      <!-- Right Side: Registration Form -->
      <section class="login-section">
        <div class="login-box">
          <h2>{{ step === 'form' ? 'Create Account' : 'Verify your email' }}</h2>
          <p>{{ step === 'form' ? 'Start your adventure with us' : 'Enter the 6-digit code we sent you' }}</p>

          <Transition name="page">
            <div v-if="msg" :key="msg.text" class="form-message" :class="msg.type" role="alert">
              <i class="fas" :class="icon[msg.type]"></i><span>{{ msg.text }}</span>
            </div>
          </Transition>

          <Transition name="page" mode="out-in">
            <form v-if="step === 'form'" id="registerForm" key="form" novalidate @submit.prevent="submit">
              <SocialButtons title="Sign up with" @error="(t) => (msg = { type: 'error', text: t })" />
              <div class="form-group">
                <label for="fullname">Full Name</label>
                <input id="fullname" v-model.trim="form.name" type="text" name="fullname" required autocomplete="name" placeholder="Enter your full name">
              </div>
              <div class="form-group">
                <label for="email">Email Address</label>
                <input id="email" v-model.trim="form.email" type="email" name="email" required autocomplete="email" placeholder="Enter your email">
              </div>
              <div class="form-group">
                <label for="username">Username</label>
                <input id="username" v-model.trim="form.username" type="text" name="username" required autocomplete="username" placeholder="Choose a username">
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <input id="password" v-model="form.password" type="password" name="password" required autocomplete="new-password" placeholder="Create a password">
              </div>
              <div class="form-group">
                <label for="confirm_password">Confirm Password</label>
                <input id="confirm_password" v-model="form.confirm" type="password" name="confirm_password" required autocomplete="new-password" placeholder="Confirm your password">
              </div>
              <button id="registerButton" type="submit" class="btn-login" :disabled="busy">
                {{ busy ? 'Creating…' : 'Sign Up' }} <i class="fas fa-user-plus"></i>
              </button>
            </form>

            <form v-else key="verify" novalidate @submit.prevent="verify">
              <div class="form-group">
                <label for="otp">Verification code</label>
                <input id="otp" v-model="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="123456" required>
              </div>
              <button type="submit" class="btn-login" :disabled="busy || otp.trim().length < 6">
                {{ busy ? 'Verifying…' : 'Verify and continue' }} <i class="fas fa-passport"></i>
              </button>
              <p class="verify-help">
                Didn't get the code? Check your spam folder or
                <button type="button" class="link-inline" :disabled="cooldown > 0" @click="resend">
                  {{ cooldown ? `resend in ${cooldown}s` : 'resend the code' }}
                </button>.
                <br><button type="button" class="link-inline" @click="step = 'form'; msg = null">Use a different email</button>
              </p>
            </form>
          </Transition>

          <div class="login-footer">
            <span>Already have an account?</span>
            <span class="divider">•</span>
            <RouterLink to="/login">Sign In</RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
