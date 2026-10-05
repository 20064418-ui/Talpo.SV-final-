/** Descarga una lista de filas como CSV (con BOM para que Excel respete tildes y ñ). */
export function downloadCsv(filename, rows, columns) {
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = Array.isArray(v) ? v.join('; ') : String(v);
    // evita que Excel ejecute fórmulas escritas por usuarios (=, +, -, @)
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(','));
  const blob = new Blob(['\ufeff' + [head, ...body].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
