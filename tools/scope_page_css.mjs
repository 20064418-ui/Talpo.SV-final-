// Acota un CSS original a un prefijo: node tools/scope_page_css.mjs <entrada.css> <.prefijo> <salida.css>
import fs from 'node:fs';
import postcss from 'postcss';
import prefixer from 'postcss-prefix-selector';
const [input, prefix, output] = process.argv.slice(2);
const raw = fs.readFileSync(input, 'utf8').replace(/\r/g, '');
const out = await postcss([prefixer({
  prefix,
  transform(p, selector, prefixed) {
    const s = selector.trim();
    if (/^(html|body|:root)$/.test(s)) return p;
    if (s === '*') return `${p}, ${p} *`;
    if (s.startsWith('*')) return `${p} ${s}`;
    return prefixed;
  },
})]).process(raw, { from: undefined });
fs.writeFileSync(output, `/* CSS ORIGINAL de ${input.split('/').pop()} acotado a ${prefix} (generado) */\n${out.css}`);
console.log('ok', output);
