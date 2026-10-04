import { defineStore } from 'pinia';
import { insforge, unwrap, isConfigured } from '@/lib/insforge';

/**
 * Sesión del usuario. Reglas de redirección:
 *  - Registro (primera vez, email u OAuth)  -> /passport
 *  - Inicio de sesión de usuario existente   -> /main
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, ready: false }),
  getters: {
    isAuthenticated: (s) => Boolean(s.user),
    displayName: (s) => s.user?.profile?.name || s.user?.email?.split('@')[0] || 'Explorer',
    avatar: (s) => s.user?.profile?.avatar_url || null,
  },
  actions: {
    /** Se llama una vez al arrancar: recupera la sesión (cookie httpOnly de refresh). */
    async init() {
      if (this.ready) return;
      if (isConfigured) {
        try {
          const { data } = await insforge.auth.getCurrentUser();
          this.user = data?.user ?? null;
        } catch { this.user = null; }
      }
      this.ready = true;
    },

    async signUp({ name, email, password }) {
      const data = await unwrap(insforge.auth.signUp({
        email, password, name,
        redirectTo: `${location.origin}/login?verified=1`,
      }));
      if (data?.accessToken) this.user = data.user;
      return { needsVerification: Boolean(data?.requireEmailVerification) };
    },

    async verifyEmail(email, otp) {
      const data = await unwrap(insforge.auth.verifyEmail({ email, otp }));
      this.user = data.user;
    },

    /** Reenvía el código/enlace de verificación (si el correo no llegó). */
    async resendVerification(email) {
      return unwrap(insforge.auth.resendVerificationEmail({ email, redirectTo: `${location.origin}/login?verified=1` }));
    },

    async signIn({ email, password }) {
      const data = await unwrap(insforge.auth.signInWithPassword({ email, password }));
      this.user = data.user;
    },

    /** OAuth con Google / GitHub / Facebook. El navegador sale hacia el proveedor. */
    async signInWithProvider(provider) {
      const { error } = await insforge.auth.signInWithOAuth(provider, {
        redirectTo: `${location.origin}/auth/callback`,
        additionalParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
      });
      if (error) throw new Error(error.message);
    },

    /** Tras volver del proveedor OAuth el SDK intercambia insforge_code solo. */
    async completeOAuth() {
      const { data, error } = await insforge.auth.getCurrentUser();
      if (error || !data?.user) throw new Error(error?.message || 'Sign-in could not be completed.');
      // Ojo: NO se asigna this.user aquí. AuthCallback primero revisa si el perfil existe
      // (primera vez -> /passport) y luego asigna; si no, App.vue crearía el perfil antes.
      return data.user;
    },

    /** Paso 1: envía el correo de recuperación (enlace o código, según la config de InsForge). */
    async sendPasswordReset(email) {
      return unwrap(insforge.auth.sendResetPasswordEmail({
        email, redirectTo: `${location.origin}/reset-password`,
      }));
    },

    /** Paso 2 (solo si el correo trae un código de 6 dígitos): lo cambia por un token. */
    async exchangeResetCode(email, code) {
      const data = await unwrap(insforge.auth.exchangeResetPasswordToken({ email, code }));
      return data.token;
    },

    /** Paso 3: guarda la contraseña nueva. `token` viene del enlace o del paso 2. */
    async resetPassword(token, newPassword) {
      return unwrap(insforge.auth.resetPassword({ newPassword, otp: token }));
    },

    async signOut() {
      await insforge.auth.signOut();
      this.user = null;
    },
  },
});
