<script setup>
// Pantalla para elegir la contraseña nueva.
//  · Si el correo trae un ENLACE: llega con ?token=... y solo se pide la contraseña nueva.
//  · Si el correo trae un CÓDIGO de 6 dígitos: se pide correo + código + contraseña nueva.
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import '@/styles/pages/login.css';
import '@/styles/pages/auth-extras.css';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const linkToken = typeof route.query.token === 'string' ? route.query.token : '';
const linkFailed = route.query.insforge_status === 'error';
const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  code: '',
  password: '',
  confirm: '',
});
const showPass = ref(false);
const busy = ref(false);
const msg = ref(linkFailed
  ? { type: 'error', text: 'This reset link is invalid or has expired. Request a new one from the sign-in page.' }
  : null);
const useCode = computed(() => !linkToken);
const icon = { error: 'fa-exclamation-circle', success: 'fa-check-circle', warning: 'fa-exclamation-triangle' };

async function submit() {
  msg.value = null;
  if (useCode.value && (!form.email || form.code.trim().length < 6)) {
    msg.value = { type: 'warning', text: 'Enter your email and the 6-digit code from the message.' }; return;
  }
  if (form.password.length < 8) { msg.value = { type: 'warning', text: 'Your password must have at least 8 characters' }; return; }
  if (form.password !== form.confirm) { msg.value = { type: 'error', text: 'The passwords do not match' }; return; }

  busy.value = true;
  try {
    const token = linkToken || await auth.exchangeResetCode(form.email.trim(), form.code.trim());
    await auth.resetPassword(token, form.password);
    router.replace({ path: '/login', query: { reset: '1' } });
  } catch (e) {
    msg.value = { type: 'error', text: /expired|invalid|code|token|otp/i.test(e.message) ? 'The code or link is invalid or has expired. Request a new one from the sign-in page.' : e.message };
  } finally { busy.value = false; }
}
</script>

<template>
  <div class="pg-login pg-auth">
    <div class="main-container">
      <section class="info-section">
        <div class="info-content">
          <h1>Explore <span class="gradient-text">Talapo.sv</span></h1>
          <p class="tagline">Where Nature Meets Culture</p>
          <p class="description">Choose a new password and get back to planning your next adventure in El Salvador.</p>
          <div class="image-grid">
            <img src="/assets/img/registreandlogin/p1.jpg" alt="Santa Ana Cathedral">
            <img src="/assets/img/registreandlogin/p2.jpg" alt="Coatepeque Lake">
            <img src="/assets/img/registreandlogin/p3.jpg" alt="Izalco Volcano">
            <img src="/assets/img/registreandlogin/p4.jpg" alt="Ataco Town">
          </div>
        </div>
      </section>

      <section class="login-section">
        <div class="login-box">
          <RouterLink to="/"><img src="/assets/img/registreandlogin/image (2).png" class="talapo-logo" alt="Talapo Logo"></RouterLink>
          <h2>New password</h2>
          <p>{{ useCode ? 'Enter the code we emailed you and choose a new password' : 'Choose a new password for your account' }}</p>

          <form novalidate @submit.prevent="submit">
            <Transition name="page">
              <div v-if="msg" :key="msg.text" class="form-message" :class="msg.type" role="alert">
                <i class="fas" :class="icon[msg.type]"></i><span>{{ msg.text }}</span>
              </div>
            </Transition>

            <template v-if="useCode">
              <div class="form-group">
                <label for="rpEmail">Email</label>
                <input id="rpEmail" v-model.trim="form.email" type="email" autocomplete="email" placeholder="Enter your email">
              </div>
              <div class="form-group">
                <label for="rpCode">6-digit code</label>
                <input id="rpCode" v-model="form.code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="123456">
              </div>
            </template>

            <div class="form-group">
              <label for="rpPass">New password</label>
              <div class="pass-wrap">
                <input id="rpPass" v-model="form.password" :type="showPass ? 'text' : 'password'" autocomplete="new-password" placeholder="At least 8 characters">
                <button type="button" :aria-label="showPass ? 'Hide password' : 'Show password'" @click="showPass = !showPass"><i class="fas" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i></button>
              </div>
            </div>
            <div class="form-group">
              <label for="rpConfirm">Confirm new password</label>
              <input id="rpConfirm" v-model="form.confirm" :type="showPass ? 'text' : 'password'" autocomplete="new-password" placeholder="Repeat your new password">
            </div>

            <button type="submit" class="btn-login" :disabled="busy || linkFailed">
              {{ busy ? 'Saving…' : 'Save new password' }} <i class="fas fa-arrow-right"></i>
            </button>
          </form>

          <div class="login-footer">
            <RouterLink to="/login">Back to sign in</RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
