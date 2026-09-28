// Prefija el CSS de cada página heredada con `.lg-<nombre>` para que no choque
// con el resto de la SPA (antes cada HTML tenía su propio body, .container, etc.).
// Para travelkits compila además Tailwind (antes venía del CDN) acotado a su plantilla.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import prefixer from 'postcss-prefix-selector';
import tailwind from 'tailwindcss';

const root = path.resolve('src/legacy/pages');

for (const name of fs.readdirSync(root)) {
  const dir = path.join(root, name);
  const scope = `.lg-${name}`;
  const raw = fs.readFileSync(path.join(dir, 'style.raw.css'), 'utf8')
    // @import de fuentes: se cargan desde meta.json, aquí solo estorban
    .replace(/@import\s+url\([^)]*\)\s*;?/g, '')
    .replace(/@import\s+["'][^"']*["']\s*;?/g, '');

  const scoped = await postcss([
    prefixer({
      prefix: scope,
      transform(prefix, selector, prefixed) {
        const s = selector.trim();
        if (/^(html|body|:root)$/.test(s)) return prefix;
        if (/^(html|body)\s*>?\s*/.test(s)) return s.replace(/^(html|body)\s*(>\s*)?/, `${prefix} `);
        if (s === '*') return `${prefix}, ${prefix} *`;
        if (s.startsWith('*')) return `${prefix} ${s}`;
        if (s.startsWith(':root')) return s.replace(':root', prefix);
        return prefixed;
      },
    }),
  ]).process(raw, { from: undefined });

  let css = `/* Generado por tools/scope_css.mjs — no editar a mano */\n${scoped.css}`;

  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  if (meta.tailwind) {
    // Recupera el `tailwind.config = {...}` que la página tenía para el CDN
    const js = fs.readFileSync(path.join(dir, 'script.js'), 'utf8');
    let pageConfig = {};
    const at = js.indexOf('var __tailwindConfig =');
    if (at >= 0) {
      const open = js.indexOf('{', at);
      let depth = 0, end = open;
      for (; end < js.length; end++) {
        if (js[end] === '{') depth++;
        else if (js[end] === '}' && --depth === 0) break;
      }
      pageConfig = Function(`return (${js.slice(open, end + 1)})`)();
    }
    const tw = await postcss([
      tailwind({
        theme: pageConfig.theme || {},
        content: [path.join(dir, 'template.html'), path.join(dir, 'script.js')],
        important: scope,
        corePlugins: { preflight: false },
      }),
    ]).process('@tailwind components;\n@tailwind utilities;', { from: undefined });
    css += `\n/* Tailwind acotado a ${scope} (sustituye cdn.tailwindcss.com) */\n${tw.css}`;
  }

  // Ajustes mínimos por página (tools/overrides/<nombre>.css), ya escritos con su prefijo
  const override = path.resolve('tools/overrides', `${name}.css`);
  if (fs.existsSync(override)) css += `\n/* Ajuste de integración: tools/overrides/${name}.css */\n${fs.readFileSync(override, 'utf8')}`;

  fs.writeFileSync(path.join(dir, 'style.css'), css);
  console.log(`${name.padEnd(22)} ${(css.length / 1024).toFixed(1)} KB`);
}
