import { insforge, isConfigured } from '@/lib/insforge';
import { useAuthStore } from '@/stores/auth';
import { usePassportStore } from '@/stores/passport';
import { toast } from '@/composables/useToast';

/**
 * Puente entre las páginas heredadas (JS original) e InsForge.
 * Disponible dentro de sus scripts como `__talapo`.
 */
export function createLegacyBridge(router) {
  const auth = useAuthStore();
  const passport = usePassportStore();
  return {
    online: isConfigured,
    db: insforge.database,
    storage: insforge.storage,
    toast,
    /** Usuario actual con el nombre/foto del pasaporte, o null. */
    user() {
      if (!auth.user) return null;
      return {
        id: auth.user.id,
        name: passport.profile?.display_name || auth.displayName,
        avatar: passport.profile?.photo_url || auth.avatar || null,
        isAdmin: !!passport.profile?.is_admin,
      };
    },
    /** Si no hay sesión, avisa y manda al login volviendo a la página actual. */
    requireLogin(message = 'Sign in to take part in the community') {
      if (auth.user) return true;
      toast(message, 'info');
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
      return false;
    },
  };
}
