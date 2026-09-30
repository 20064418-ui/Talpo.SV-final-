// Edge function de InsForge: AVISO AUTOMÁTICO DE URGENCIAS del Stand.
// Busca reportes 🔴 urgentes que todavía no se avisaron y manda un correo al equipo.
//
// Secretos necesarios (una sola vez):
//   npx @insforge/cli secrets add TALAPO_ADMIN_KEY <API Key del proyecto (ik_...)>
//   npx @insforge/cli secrets add TALAPO_ALERT_EMAILS "avisos.talapo@gmail.com,otro@correo.com"
// Deploy:
//   npx @insforge/cli functions deploy urgent-alert --file insforge/functions/urgent-alert/index.ts
//
// Es seguro llamarla muchas veces: nunca avisa dos veces el mismo reporte
// y no recibe datos del navegador (solo revisa la base de datos).
import { createClient } from 'npm:@insforge/sdk';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const ZONA: Record<string, string> = { clean: 'Limpia', dirty: 'Un poco sucia', very_dirty: 'Muy sucia' };
const BASURA: Record<string, string> = { plastic: 'Plástico', paper: 'Papel/cartón', glass: 'Vidrio', metal: 'Latas/metal', organic: 'Orgánica', bulky: 'Objetos grandes', other: 'Otro' };

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const key = Deno.env.get('TALAPO_ADMIN_KEY');
  if (!key) return json({ error: 'TALAPO_ADMIN_KEY is not set' }, 500);
  const to = (Deno.env.get('TALAPO_ALERT_EMAILS') ?? 'avisos.talapo@gmail.com').split(',').map((s) => s.trim()).filter(Boolean);
  const site = Deno.env.get('TALAPO_SITE_URL') ?? 'https://talpo-sv-final.vercel.app';

  // Cliente con permisos de administrador (la API Key nunca sale del servidor)
  const admin = createClient({ baseUrl: Deno.env.get('INSFORGE_BASE_URL')!, accessToken: key });

  const since = new Date(Date.now() - 2 * 864e5).toISOString(); // últimos 2 días
  const { data: pending, error } = await admin.database.from('stand_reports')
    .select('id, stand_id, zone_status, has_trash, trash_types, comment, created_at, profile_id')
    .eq('urgency', 'high').is('notified_at', null).gte('created_at', since)
    .order('created_at', { ascending: true }).limit(20);
  if (error) return json({ error: error.message }, 500);
  if (!pending?.length) return json({ sent: 0 });

  let sent = 0;
  for (const r of pending) {
    // Se marca PRIMERO (solo si sigue pendiente) para no mandar dos correos si llegan dos llamadas juntas
    const { data: claimed } = await admin.database.from('stand_reports')
      .update({ notified_at: new Date().toISOString() }).eq('id', r.id).is('notified_at', null).select('id');
    if (!claimed?.length) continue;

    const { data: st } = await admin.database.from('stands').select('name, city, lat, lng').eq('id', r.stand_id).limit(1);
    const stand = st?.[0];
    const when = new Date(r.created_at).toLocaleString('es-SV', { timeZone: 'America/El_Salvador', dateStyle: 'full', timeStyle: 'short' });
    const tipos = (r.trash_types ?? []).map((t: string) => BASURA[t] ?? t).join(', ') || '—';
    const place = stand ? `${stand.name}, ${stand.city}` : r.stand_id;
    const maps = stand ? `https://www.google.com/maps/search/?api=1&query=${stand.lat},${stand.lng}` : '';

    const { error: mailError } = await admin.emails.send({
      to,
      subject: `🔴 URGENTE — Reporte de zona en ${place}`,
      from: 'Talapo.SV · Alertas',
      html: `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #f3c1bb;border-radius:18px;overflow:hidden">
  <div style="background:#b42318;color:#fff;padding:18px 22px">
    <div style="font-size:12px;font-weight:bold;letter-spacing:1px">🔴 REPORTE URGENTE · STAND TALAPO</div>
    <h1 style="margin:6px 0 0;font-size:22px">${esc(place)}</h1>
  </div>
  <div style="padding:20px 22px;color:#13294B;font-size:15px;line-height:1.6">
    <p style="margin:0 0 10px">Alguien pidió que el equipo <b>llegue rápido</b> a la zona.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 0;color:#58717f">Fecha</td><td><b>${esc(when)}</b></td></tr>
      <tr><td style="padding:6px 0;color:#58717f">Estado de la zona</td><td><b>${esc(ZONA[r.zone_status] ?? r.zone_status)}</b></td></tr>
      <tr><td style="padding:6px 0;color:#58717f">Basura</td><td><b>${r.has_trash ? esc(tipos) : 'No reportó basura'}</b></td></tr>
      <tr><td style="padding:6px 0;color:#58717f;vertical-align:top">Comentario</td><td><b>${esc(r.comment || '—')}</b></td></tr>
    </table>
    ${maps ? `<p style="margin:18px 0 0"><a href="${maps}" style="background:#0A2F44;color:#fff;text-decoration:none;padding:10px 18px;border-radius:30px;font-weight:bold">📍 Ver ubicación</a></p>` : ''}
  </div>
  <div style="background:#f8fafc;color:#8aa0ab;font-size:12px;padding:12px 22px">Aviso automático de ${esc(site)} · Reporte ${esc(r.id)}</div>
</div>`,
    });
    if (mailError) {
      // Si el correo falló, se desmarca para intentarlo en la próxima llamada
      await admin.database.from('stand_reports').update({ notified_at: null }).eq('id', r.id);
      return json({ error: mailError.message, sent }, 502);
    }
    sent += 1;
  }
  return json({ sent });
}

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
