import { insforge } from '@/lib/insforge';

/** Deja constancia en el Registro de actividad. Nunca interrumpe la acción si falla. */
export function logAdmin(action, type = null, target = null, details = {}) {
  insforge.database.rpc('admin_log', { p_action: action, p_type: type, p_target: target ? String(target) : null, p_details: details })
    .then(() => {}, () => {});
}
