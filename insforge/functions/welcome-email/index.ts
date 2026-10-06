// @ts-nocheck  (corre en Deno, el servidor de InsForge; VS Code lo revisaba como Node y mostraba falsos errores)
// Edge function de InsForge: correo de BIENVENIDA a Talapo.SV (una sola vez por usuario).
// Se envía con emails.send(), que usa tu Custom SMTP (avisos.talapo@gmail.com).
//   npx @insforge/cli functions deploy welcome-email --file insforge/functions/welcome-email/index.ts
import { createClient } from 'npm:@insforge/sdk';

const SITE_URL = Deno.env.get('TALAPO_SITE_URL') ?? 'https://talpo-sv-final.vercel.app';

let cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function (req: Request): Promise<Response> {
  const asked = req.headers.get('access-control-request-headers');
  if (asked) cors = { ...cors, 'Access-Control-Allow-Headers': asked };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  // Solo el usuario que inició sesión puede pedir SU bienvenida (a su propio correo)
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const client = createClient({ baseUrl: Deno.env.get('INSFORGE_BASE_URL')!, edgeFunctionToken: token });
  const { data: me, error: meError } = await client.auth.getCurrentUser();
  const user = me?.user;
  if (meError || !user?.email) return json({ error: 'Unauthorized' }, 401);
  if (!user.emailVerified) return json({ skipped: 'email not verified yet' });

  const { data: rows } = await client.database.from('profiles').select('welcome_sent_at, display_name').eq('id', user.id).limit(1);
  const profile = rows?.[0];
  if (profile?.welcome_sent_at) return json({ skipped: 'already sent' });

  // Se marca ANTES de enviar para no mandar dos correos si llegan dos peticiones seguidas
  await client.database.from('profiles').update({ welcome_sent_at: new Date().toISOString() }).eq('id', user.id);

  const name = escapeHtml(profile?.display_name || user.profile?.name || user.email.split('@')[0]);
  const { error: mailError } = await client.emails.send({
    to: user.email,
    subject: `¡Bienvenido/a a Talapo.SV, ${name}! 🇸🇻`,
    from: 'Talapo.SV',
    html: welcomeHtml(name),
  });
  if (mailError) {
    // Si falló, se desmarca para intentarlo la próxima vez
    await client.database.from('profiles').update({ welcome_sent_at: null }).eq('id', user.id);
    return json({ error: mailError.message }, 502);
  }
  return json({ sent: true });
}

function welcomeHtml(name: string) {
  const btn = (href: string, label: string, bg: string) =>
    `<a href="${SITE_URL}${href}" style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:40px;margin:4px 6px 4px 0;">${label}</a>`;
  return `
<div style="margin:0;padding:24px 12px;background:#F8FBFE;font-family:Arial,Helvetica,sans-serif;color:#13294B;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 35px -18px rgba(0,32,64,.25);">
    <div style="background:linear-gradient(105deg,#0A2F44,#1C6E6B);padding:32px 28px;color:#ffffff;">
      <div style="display:inline-block;background:#0A2F44;border:1px solid rgba(255,255,255,.25);border-radius:40px;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:1px;">✦ WELCOME TO THE TALAPO FAMILY ✦</div>
      <h1 style="margin:16px 0 6px;font-size:28px;line-height:1.15;">¡Hola, ${name}! 👋</h1>
      <p style="margin:0;font-size:15px;opacity:.9;">Your adventure through El Salvador starts today.</p>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Thank you for joining <b>Talapo.SV</b> 💙. This is what you can do now:</p>
      <ul style="margin:0 0 20px;padding-left:18px;font-size:15px;line-height:1.8;">
        <li>🛂 <b>Create your Talapo Passport</b> and collect stamps from every place you visit.</li>
        <li>🗺️ <b>Build Tours routes</b> on the map and save them.</li>
        <li>🗓️ <b>Generate a day-by-day itinerary</b> with schedule and budget.</li>
        <li>🔥 <b>Keep your Talapo Streak</b> by visiting every day.</li>
        <li>🤝 <b>Follow other travelers</b> and discover their favorite places.</li>
      </ul>
      <div style="margin:0 0 22px;">
        ${btn('/passport', 'Open my passport', '#E46D5C')}
        ${btn('/tours', 'Explore Tours', '#0A2F44')}
      </div>
      <p style="margin:0;font-size:13px;color:#58717f;">💡 Tip: ask <b>Talapo Bot ✈️</b> for recommendations — it knows every volcano, beach and pupusería in El Salvador.</p>
    </div>
    <div style="background:#0f172a;color:#94a3b8;padding:18px 28px;font-size:12px;text-align:center;">
      © Talapo.SV · Made with ❤️ for El Salvador
    </div>
  </div>
</div>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
