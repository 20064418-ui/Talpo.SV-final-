#!/usr/bin/env node
// =====================================================================
// Conecta Talapo.SV con tu proyecto de InsForge en un solo comando:
//   npm run setup:insforge
//
// Qué hace (se puede ejecutar varias veces sin romper nada):
//   1. Inicia sesión y vincula esta carpeta a tu proyecto (si hace falta)
//   2. Aplica las migraciones de /migrations (tablas, RLS, racha, foro…)
//   3. Crea los buckets de Storage: passport-photos y forum-images
//   4. Guarda la clave del modelo de IA como secreto y despliega talapo-chat
//   5. Escribe .env.local con la URL del proyecto y la anon key
//   6. Verifica que las tablas existan
// =====================================================================
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';

const CLI = ['--yes', '@insforge/cli@latest'];
const isWin = process.platform === 'win32';
const root = process.cwd();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const TABLES = ['profiles', 'activity_log', 'passport_stamps', 'itineraries', 'contest_entries',
  'forum_posts', 'forum_comments', 'forum_reactions', 'forum_saves'];
const BUCKETS = ['passport-photos', 'forum-images'];

function cli(args, { interactive = false, allowFail = false } = {}) {
  const res = spawnSync('npx', [...CLI, ...args], {
    cwd: root, shell: isWin, encoding: 'utf8', stdio: interactive ? 'inherit' : 'pipe',
  });
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  if (res.status !== 0 && !allowFail) {
    console.error(`\n✖ Falló: insforge ${args.join(' ')}\n${out}`);
    process.exit(1);
  }
  return { ok: res.status === 0, out };
}

const step = (n, msg) => console.log(`\n\x1b[36m[${n}/6]\x1b[0m ${msg}`);
const ok = (msg) => console.log(`  \x1b[32m✔\x1b[0m ${msg}`);
const warn = (msg) => console.log(`  \x1b[33m!\x1b[0m ${msg}`);

// ---------------------------------------------------------------- 1
step(1, 'Sesión y proyecto');
if (!cli(['whoami'], { allowFail: true }).ok) {
  console.log('  Se abrirá el navegador para iniciar sesión en InsForge…');
  cli(['login'], { interactive: true });
}
const projectFile = path.join(root, '.insforge', 'project.json');
if (!fs.existsSync(projectFile)) {
  // Las versiones nuevas del CLI necesitan el ID del proyecto: "link --project-id <id>"
  console.log('  Tus proyectos de InsForge:');
  cli(['projects', 'list'], { interactive: true, allowFail: true });
  let id = (await rl.question('  Pega el ID del proyecto de Talapo (Enter para crear uno nuevo): ')).trim();
  if (!id) {
    cli(['create', '--name', 'talapo', '--template', 'empty', '--region', 'us-east'], { interactive: true });
    cli(['projects', 'list'], { interactive: true, allowFail: true });
    id = (await rl.question('  Pega el ID del proyecto que se acaba de crear: ')).trim();
  }
  cli(['link', '--project-id', id], { interactive: true });
}
if (!fs.existsSync(projectFile)) {
  console.error('✖ No se vinculó ningún proyecto. Ejecuta: npx @insforge/cli link --project-id <id>');
  process.exit(1);
}
const project = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
const baseUrl = project.oss_host?.startsWith('http')
  ? project.oss_host
  : `https://${project.appkey}.${project.region}.insforge.app`;
ok(`Proyecto vinculado: ${baseUrl}`);

// ---------------------------------------------------------------- 2
step(2, 'Base de datos (migraciones)');
const files = fs.readdirSync(path.join(root, 'migrations')).filter((f) => /^\d+_[a-z0-9-]+\.sql$/.test(f));
files.forEach((f) => console.log(`  · ${f}`));
const mig = cli(['db', 'migrations', 'up', '--all'], { allowFail: true });
if (mig.ok) ok('Migraciones aplicadas');
else if (/already|up to date|no pending/i.test(mig.out)) ok('No había migraciones pendientes');
else { console.error(mig.out); process.exit(1); }

// ---------------------------------------------------------------- 3
step(3, 'Storage (fotos del pasaporte e imágenes del foro)');
const existing = cli(['storage', 'buckets'], { allowFail: true }).out;
for (const b of BUCKETS) {
  if (existing.includes(b)) { ok(`Bucket ${b} ya existe`); continue; }
  const r = cli(['storage', 'create-bucket', b, '--public'], { allowFail: true });
  if (r.ok || /exist/i.test(r.out)) ok(`Bucket ${b} listo`);
  else warn(`No se pudo crear ${b}: ${r.out.trim()} — créalo en Dashboard → Storage (público).`);
}

// ---------------------------------------------------------------- 4
step(4, 'Asistente de IA (edge function talapo-chat)');
const secrets = cli(['secrets', 'list'], { allowFail: true }).out;
if (secrets.includes('OPENROUTER_API_KEY')) {
  ok('El secreto OPENROUTER_API_KEY ya existe');
} else {
  const key = (await rl.question('  Pega tu OPENROUTER_API_KEY (Dashboard → Model Gateway). Enter para omitir: ')).trim();
  if (key) { cli(['secrets', 'add', 'OPENROUTER_API_KEY', key]); ok('Secreto guardado (no queda en el código)'); }
  else warn('Omitido: el chat mostrará un aviso hasta que agregues la clave.');
}
cli(['functions', 'deploy', 'talapo-chat', '--file', path.join('insforge', 'functions', 'talapo-chat', 'index.ts'),
  '--name', 'Talapo chat', '--description', 'Asistente de viajes de Talapo.SV']);
ok('Función talapo-chat desplegada');

// ---------------------------------------------------------------- 5
step(5, 'Variables de entorno (.env.local)');
const anonOut = cli(['secrets', 'get', 'ANON_KEY'], { allowFail: true }).out;
const anonKey = (anonOut.match(/ANON_KEY\s*=\s*(\S+)/)?.[1]
  || anonOut.match(/"value"\s*:\s*"([^"]+)"/)?.[1]
  || anonOut.trim().split(/\s+/).pop() || '').trim();
if (!anonKey || anonKey.length < 20) {
  warn('No pude leer la anon key automáticamente. Cópiala de Dashboard → Connect → API Keys.');
}
fs.writeFileSync(path.join(root, '.env.local'),
  `# Generado por npm run setup:insforge\nVITE_INSFORGE_URL=${baseUrl}\nVITE_INSFORGE_ANON_KEY=${anonKey}\n`);
ok('.env.local escrito');

// ---------------------------------------------------------------- 6
step(6, 'Verificación');
const tables = cli(['db', 'tables'], { allowFail: true }).out;
const missing = TABLES.filter((t) => !tables.includes(t));
if (missing.length) warn(`Faltan tablas: ${missing.join(', ')} — revisa la salida de las migraciones.`);
else ok(`Las ${TABLES.length} tablas existen`);

console.log(`
\x1b[32mListo.\x1b[0m Falta un paso manual en el Dashboard de InsForge (Authentication):
  • Activa Google, GitHub y Facebook en "Auth Methods" con sus client ID/secret.
  • En "Allowed redirect URLs" agrega:
      http://localhost:5173/auth/callback
      http://localhost:5173/login
      https://TU-DOMINIO/auth/callback  y  https://TU-DOMINIO/login
Luego: npm run dev`);
rl.close();
