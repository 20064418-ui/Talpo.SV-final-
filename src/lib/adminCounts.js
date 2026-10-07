import { reactive } from 'vue';
import { insforge } from '@/lib/insforge';

/** Pendientes del admin (para los numeritos del menú y las pestañas). Se refresca cada minuto como mucho. */
export const adminCounts = reactive({ messages: 0, plans: 0, reports: 0, forum: 0, contests: 0, loaded: false });
let last = 0;
let running = null;

export function refreshAdminCounts(force = false) {
  if (running) return running;
  if (!force && Date.now() - last < 60000) return Promise.resolve();
  running = (async () => {
    const [ov, msgs, plans] = await Promise.allSettled([
      insforge.database.rpc('admin_overview'),
      insforge.database.from('support_threads').select('id').gt('admin_unread', 0).limit(999),
      insforge.database.from('plan_requests').select('id').eq('status', 'new').limit(999),
    ]);
    const o = ov.status === 'fulfilled' ? (Array.isArray(ov.value.data) ? ov.value.data[0] : ov.value.data) : null;
    if (o) Object.assign(adminCounts, { reports: o.reports_pending || 0, forum: o.forum_reports || 0, contests: o.contest_to_review || 0 });
    if (msgs.status === 'fulfilled' && !msgs.value.error) adminCounts.messages = msgs.value.data?.length || 0;
    if (plans.status === 'fulfilled' && !plans.value.error) adminCounts.plans = plans.value.data?.length || 0;
    adminCounts.loaded = true;
    last = Date.now();
  })().finally(() => { running = null; });
  return running;
}
export const adminTotal = () => adminCounts.messages + adminCounts.plans + adminCounts.reports + adminCounts.forum + adminCounts.contests;
