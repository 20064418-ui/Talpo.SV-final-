// Carga perezosa de las páginas heredadas (cada una en su propio chunk)
const templates = import.meta.glob('./pages/*/template.html', { query: '?raw', import: 'default' });
const scripts = import.meta.glob('./pages/*/script.js', { query: '?raw', import: 'default' });
const styles = import.meta.glob('./pages/*/style.css');
const metas = import.meta.glob('./pages/*/meta.json', { eager: true, import: 'default' });

export async function loadLegacyPage(name) {
  const key = (file) => `./pages/${name}/${file}`;
  if (!templates[key('template.html')]) throw new Error(`Legacy page "${name}" not found`);
  const [html, code] = await Promise.all([templates[key('template.html')](), scripts[key('script.js')](), styles[key('style.css')]()]);
  return { html, code, meta: metas[key('meta.json')] };
}

const loadedAssets = new Map();
/** Inserta <link>/<script> externos una sola vez (OpenLayers, Google Translate, fuentes…). */
export function loadExternal({ type, src }) {
  if (loadedAssets.has(src)) return loadedAssets.get(src);
  const p = new Promise((resolve) => {
    const el = document.createElement(type === 'js' ? 'script' : 'link');
    if (type === 'js') { el.src = src; el.async = false; } else { el.rel = 'stylesheet'; el.href = src; }
    el.onload = resolve;
    el.onerror = () => { console.warn('[Talapo] no se pudo cargar', src); resolve(); };
    document.head.appendChild(el);
  });
  loadedAssets.set(src, p);
  return p;
}
