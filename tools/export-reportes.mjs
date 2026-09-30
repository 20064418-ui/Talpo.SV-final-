#!/usr/bin/env node
// =====================================================================
// Exporta los formularios de los Stands Talapo a un Excel ordenado.
//   npm run reportes
// Crea: reportes/reportes-stand-AAAA-MM-DD_HHhMMmSSs.xlsx (uno nuevo cada vez)
//   · Hoja "Formularios": todo, con colores por urgencia y filtros
//   · Hoja "Resumen": cuántos reportes por zona, urgencia y tipo de basura
// Usa la conexión de la carpeta (.insforge), igual que los demás comandos.
// =====================================================================
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';

const isWin = process.platform === 'win32';

const SQL = `
select r.created_at,
       r.stand_id,
       coalesce(s.name || ', ' || s.city, r.stand_id) as stand,
       p.username,
       p.display_name,
       r.zone_status,
       r.has_trash,
       array_to_string(r.trash_types, ',') as trash_types,
       r.urgency,
       r.comment
from stand_reports r
left join profiles p on p.id = r.profile_id
left join stands s on s.id = r.stand_id
order by r.created_at desc
limit 5000`.replace(/\s+/g, ' ').trim();

const ZONA = { clean: 'Limpia', dirty: 'Un poco sucia', very_dirty: 'Muy sucia' };
const URG = { low: 'No urgente', medium: 'Pronto', high: 'URGENTE' };
const URG_COLOR = { low: 'FFD9F2E3', medium: 'FFFFF1C2', high: 'FFFFD2CC' };
const BASURA = { plastic: 'Plástico', paper: 'Papel/cartón', glass: 'Vidrio', metal: 'Latas/metal', organic: 'Orgánica', bulky: 'Objetos grandes', other: 'Otro' };

// ---------- 1. Traer los datos ----------
function fetchRows() {
  if (process.env.TALAPO_REPORTES_JSON) {            // (solo para pruebas)
    return extractRows(fs.readFileSync(process.env.TALAPO_REPORTES_JSON, 'utf8'));
  }
  console.log('⏳ Descargando formularios desde InsForge…');
  const res = spawnSync('npx', ['--yes', '@insforge/cli', '--json', 'db', 'query', SQL], {
    shell: isWin, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024,
  });
  const out = `${res.stdout || ''}`;
  if (res.status !== 0) {
    console.error('✖ No se pudo consultar la base de datos.\n', res.stderr || out);
    console.error('  ¿Estás en la carpeta del proyecto y conectada (npx @insforge/cli link)?');
    process.exit(1);
  }
  return extractRows(out);
}

/** El CLI puede devolver [..] o { rows: [..] } / { data: [..] }; tomamos la primera lista de filas. */
function extractRows(text) {
  const start = Math.min(...['[', '{'].map((c) => { const i = text.indexOf(c); return i < 0 ? Infinity : i; }));
  const json = JSON.parse(text.slice(start));
  const find = (v) => {
    if (Array.isArray(v)) return v.length && typeof v[0] === 'object' && !Array.isArray(v[0]) ? v : (v.length ? null : v);
    if (v && typeof v === 'object') for (const k of ['rows', 'data', 'result', 'results', ...Object.keys(v)]) { const r = find(v[k]); if (r) return r; }
    return null;
  };
  return find(json) || [];
}

// ---------- 2. Armar el Excel ----------
async function build(rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Talapo.SV';
  wb.created = new Date();

  const ws = wb.addWorksheet('Formularios', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [
    { header: 'Fecha', key: 'fecha', width: 12, style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'Hora', key: 'hora', width: 9 },
    { header: 'Stand', key: 'stand', width: 26 },
    { header: 'Usuario', key: 'usuario', width: 20 },
    { header: 'Nombre', key: 'nombre', width: 26 },
    { header: 'Estado de la zona', key: 'zona', width: 17 },
    { header: '¿Hay basura?', key: 'basura', width: 12 },
    { header: 'Tipos de basura', key: 'tipos', width: 30 },
    { header: 'Urgencia', key: 'urgencia', width: 13 },
    { header: 'Comentario', key: 'comentario', width: 50 },
  ];

  for (const r of rows) {
    const d = new Date(r.created_at);
    const row = ws.addRow({
      fecha: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      hora: d.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' }),
      stand: r.stand || r.stand_id,
      usuario: r.username ? `@${r.username}` : 'Sin cuenta',
      nombre: r.display_name || '',
      zona: ZONA[r.zone_status] || r.zone_status,
      basura: r.has_trash === true || r.has_trash === 't' ? 'Sí' : 'No',
      tipos: String(r.trash_types || '').split(',').filter(Boolean).map((t) => BASURA[t] || t).join(', '),
      urgencia: URG[r.urgency] || r.urgency,
      comentario: r.comment || '',
    });
    row.alignment = { vertical: 'top', wrapText: true };
    const color = URG_COLOR[r.urgency];
    if (color) row.getCell('urgencia').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    if (r.urgency === 'high') row.getCell('urgencia').font = { bold: true, color: { argb: 'FFB42318' } };
  }

  styleHeader(ws.getRow(1));
  ws.autoFilter = { from: 'A1', to: `J${Math.max(1, rows.length + 1)}` };

  // ---------- Hoja de resumen ----------
  const rs = wb.addWorksheet('Resumen');
  rs.columns = [{ width: 30 }, { width: 14 }];
  const block = (title, entries) => {
    const h = rs.addRow([title, 'Cantidad']); styleHeader(h);
    entries.forEach(([k, v]) => rs.addRow([k, v]));
    rs.addRow([]);
  };
  const count = (fn) => rows.reduce((acc, r) => { for (const k of [].concat(fn(r))) if (k) acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const sorted = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);

  const titleRow = rs.addRow([`Reportes de Stands Talapo — ${rows.length} en total`]);
  titleRow.font = { bold: true, size: 14, color: { argb: 'FF0A2F44' } };
  rs.addRow([`Generado: ${new Date().toLocaleString('es-SV')}`]).font = { italic: true, color: { argb: 'FF58717F' } };
  rs.addRow([]);
  block('Por urgencia', sorted(count((r) => URG[r.urgency] || r.urgency)));
  block('Por estado de la zona', sorted(count((r) => ZONA[r.zone_status] || r.zone_status)));
  block('Por tipo de basura', sorted(count((r) => String(r.trash_types || '').split(',').filter(Boolean).map((t) => BASURA[t] || t))));
  block('Por stand', sorted(count((r) => r.stand || r.stand_id)));
  block('Con cuenta Talapo vs. sin cuenta', sorted(count((r) => (r.username ? 'Con cuenta' : 'Sin cuenta'))));

  const dir = path.resolve('reportes');
  fs.mkdirSync(dir, { recursive: true });
  // Un archivo NUEVO cada vez (con fecha y hora), así nunca choca con uno abierto en Excel
  const n = new Date(); const pad = (x) => String(x).padStart(2, '0');
  const stamp = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}_${pad(n.getHours())}h${pad(n.getMinutes())}m${pad(n.getSeconds())}s`;
  const file = path.join(dir, `reportes-stand-${stamp}.xlsx`);
  try {
    await wb.xlsx.writeFile(file);
  } catch (e) {
    if (['EBUSY', 'EPERM', 'EACCES'].includes(e.code)) {
      console.error('✖ No se pudo guardar el Excel porque está abierto o bloqueado. Ciérralo y vuelve a correr: npm run reportes');
      process.exit(1);
    }
    throw e;
  }
  return file;
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.alignment = { vertical: 'middle' };
  row.height = 22;
  row.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C6E6B' } }; });
}

const rows = fetchRows();
const file = await build(rows);
console.log(`✔ Listo: ${rows.length} formularios exportados (el más reciente: ${rows[0] ? new Date(rows[0].created_at).toLocaleString('es-SV') : '—'}).`);
console.log(`  Archivo: ${file}`);
if (isWin) spawnSync('cmd', ['/c', 'start', '', file], { stdio: 'ignore' }); // lo abre en Excel
