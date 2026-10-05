// Edge function de InsForge (Deno): chat del asistente "Talapo".
// La clave OPENROUTER_API_KEY se guarda como secreto del proyecto; el navegador nunca la ve.
//   npx @insforge/cli secrets add OPENROUTER_API_KEY <clave>
//   npx @insforge/cli functions deploy talapo-chat

const SYSTEM = `Actúa como "Talapo", el guía experto en turismo de El Salvador de talapo.sv.
Personalidad alegre y servicial; usa modismos salvadoreños con moderación (qué chivo, púchica, vaya pues).
Responde en el idioma del usuario (inglés si no está claro), conciso (máximo ~120 palabras) salvo que pidan un plan o una traducción.
Usa emojis puntuales. Usa listas con guiones cuando ayuden.
Cuando sea útil, recomienda secciones del sitio con enlaces como [Tours](/tours), [Buses](/buses), [Recetas](/typicalrecipes),
[Concursos](/contests), [Pasaporte](/passport), [Emergencias](/emergency).
No inventes precios ni horarios exactos; sugiere confirmarlos. En respuestas cortas termina con "💡 Mi sugerencia:" y una idea concreta.`;

const MODES: Record<string, string> = {
  planner: `Modo planificador: responde con un plan día por día (Day 1, Day 2...), con 3 paradas por día (mañana, tarde, noche),
una frase de transporte y un costo aproximado diario en USD marcado como estimado. Máximo 300 palabras. Ignora el límite de 120 palabras.`,
  translator: `Modo traductor: traduce el texto del usuario entre inglés y español (detecta el idioma). Responde con la traducción en negrita
y, si el destino es español, una breve guía de pronunciación. Nada más.`,
};

let cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function (req: Request): Promise<Response> {
  // Acepta cualquier cabecera que el navegador pida en el preflight
  const asked = req.headers.get('access-control-request-headers');
  if (asked) cors = { ...cors, 'Access-Control-Allow-Headers': asked };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const body = await req.json().catch(() => ({}));
  const history = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  const messages = history
    .filter((m: any) => ['user', 'assistant'].includes(m?.role) && typeof m?.content === 'string')
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  if (!messages.length) return json({ error: 'Empty conversation' }, 400);

  const key = Deno.env.get('OPENROUTER_API_KEY');
  if (!key) return json({ error: 'OPENROUTER_API_KEY is not set' }, 500);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'Talapo.SV' },
    body: JSON.stringify({
      model: Deno.env.get('TALAPO_MODEL') ?? 'openai/gpt-4o-mini',
      max_tokens: body.mode === 'planner' ? 900 : body.mode === 'translator' ? 300 : 400,
      messages: [
        { role: 'system', content: `${SYSTEM}${MODES[String(body.mode)] ? `\n${MODES[String(body.mode)]}` : ''}\nContexto: ${String(body.context ?? '').slice(0, 300)}` },
        ...messages,
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return json({ error: `Model error ${res.status}: ${detail.slice(0, 300)}` }, 502);
  }
  const data = await res.json();
  return json({ reply: data.choices?.[0]?.message?.content ?? '' });
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
