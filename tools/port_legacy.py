"""
Migra las páginas HTML heredadas de Talapo a módulos que la SPA de Vue monta en
"modo compatibilidad" (patrón strangler: se migran a Vue nativo poco a poco).

Por cada página genera src/legacy/pages/<nombre>/:
  template.html  -> cuerpo limpio (sin navbar/footer/chat duplicados)
  style.raw.css  -> CSS de la página (se prefija luego con .lg-<nombre>)
  script.js      -> JS envuelto en `export default function run(ctx)`
  meta.json      -> fuentes externas, scripts externos y handlers globales

Uso: python3 tools/port_legacy.py "<carpeta del proyecto original>" <carpeta talapo-vue>
"""
import hashlib, base64, json, os, re, sys, unicodedata
from urllib.parse import unquote
from bs4 import BeautifulSoup, Comment

SRC, DST = sys.argv[1], sys.argv[2]
PUB = os.path.join(DST, 'public')
OUT = os.path.join(DST, 'src', 'legacy', 'pages')

LEGACY = ['index', 'main', 'tours', 'buses', 'clothing', 'conversiones', 'emergency', 'foro', 'gastronomy', 'planes',
          'planflights', 'planguide', 'planhoteles', 'planrestaurantes', 'plantransporte', 'ra',
          'stand', 'talapo-itinerario', 'traductor', 'travelkits', 'turisticattractions',
          'typicalrecipes']

# Páginas ya adaptadas a mano (p. ej. foro conectado a InsForge): no se regeneran
MANUAL = {'foro', 'tours', 'talapo-itinerario'}

# .html -> ruta del router
ROUTES = {'main': '/main', 'index': '/', 'talapo': '/', 'login': '/login', 'registre': '/register',
          'registro': '/register', 'pasaporte': '/passport', 'tours': '/tours', 'stands': '/stand'}
for n in LEGACY:
    ROUTES.setdefault(n, '/' + n)
ROUTES['index'] = '/'

# Globales que el HTML/JS externo necesita aunque no aparezcan en atributos on*
EXTRA_GLOBALS = {'traductor': ['googleTranslateElementInit']}

# Scripts externos que NO se cargan (se sustituyen por dependencias de npm o se descartan)
DROP_SCRIPTS = ('leaflet', 'tailwindcss', 'kit.fontawesome.com')

# ---------- índice de archivos públicos (para arreglar mayúsculas y codificación) ----------
index = {}
for root, _, files in os.walk(os.path.join(PUB, 'assets')):
    for f in files:
        rel = os.path.relpath(os.path.join(root, f), PUB).replace(os.sep, '/')
        index[unicodedata.normalize('NFC', rel).lower()] = rel
missing = set()


def resolve_asset(path):
    """'../assets/img/Index/Ataco.jpg' -> '/assets/img/index/ataco.jpg' (ruta real)."""
    p = unquote(path).strip()
    p = re.sub(r'^(\./|\.\./)+', '', p).lstrip('/')
    key = unicodedata.normalize('NFC', p).lower()
    if key in index:
        return '/' + index[key]
    # Mismo nombre con otra extensión (p. ej. policia.jpg -> policia.webp) o nombre truncado
    stem = key.rsplit('.', 1)[0]
    cands = [v for k, v in index.items() if k.rsplit('.', 1)[0] == stem] or \
            [v for k, v in index.items() if len(stem) > len('assets/img/x/') + 2 and k.startswith(stem)]
    if len(cands) == 1:
        return '/' + cands[0]
    # Último recurso: mismo nombre de archivo en cualquier carpeta de assets
    base = key.rsplit('/', 1)[-1]
    cands = [v for k, v in index.items() if k.rsplit('/', 1)[-1] == base]
    if len(cands) == 1:
        return '/' + cands[0]
    missing.add(p)
    return '/' + p


ASSET_RE = re.compile(r'''(?P<q>["'`(])(?P<p>(?:\.{1,2}/)*assets/(?:img|mp4)/[^"'`)\n]+?)(?P=q)''')
ASSET_PAREN_RE = re.compile(r'''url\(\s*(?P<p>(?:\.{1,2}/)*assets/(?:img|mp4)/[^)]+?)\s*\)''')
HTML_LINK_RE = re.compile(r'''(?P<q>["'`])(?:\.{1,2}/)?(?:components/)?(?P<n>[A-Za-z0-9_\-]+)\.html(?P<h>[?#][^"'`]*)?(?P=q)''')


CSS_IMG_RE = re.compile(r'''url\(\s*(['"]?)\.\./(img|mp4)/([^)'"]+)\1\s*\)''')


def fix_refs(text):
    # En los .css originales las rutas son relativas a assets/css: url('../img/x.jpg')
    text = CSS_IMG_RE.sub(lambda m: 'url("' + resolve_asset(f'assets/{m.group(2)}/{m.group(3)}') + '")', text)
    text = ASSET_RE.sub(lambda m: m.group('q') + resolve_asset(m.group('p')) + m.group('q'), text)
    text = ASSET_PAREN_RE.sub(lambda m: 'url("' + resolve_asset(m.group('p').strip('"\'')) + '")', text)

    def link(m):
        n = m.group('n').lower()
        route = ROUTES.get(n, '/' + n)
        return m.group('q') + route + (m.group('h') or '') + m.group('q')
    return HTML_LINK_RE.sub(link, text)


def extract_base64(html, name):
    """Saca imágenes base64 enormes (gastronomy pesa 1.1 MB) a archivos en /public."""
    outdir = os.path.join(PUB, 'assets', 'img', 'legacy-inline')
    os.makedirs(outdir, exist_ok=True)

    def repl(m):
        ext = {'jpeg': 'jpg'}.get(m.group(1), m.group(1))
        raw = base64.b64decode(m.group(2))
        fname = f'{name}-{hashlib.sha1(raw).hexdigest()[:10]}.{ext}'
        with open(os.path.join(outdir, fname), 'wb') as fh:
            fh.write(raw)
        return f'/assets/img/legacy-inline/{fname}'
    return re.sub(r'data:image/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=\s]+)', repl, html)


# ---------- transformación del JS heredado ----------
def strip_old_chatbot(code):
    """Quita el chatbot viejo (con la clave de Gemini expuesta): ahora lo reemplaza TalapoAI.vue."""
    start = code.find('function toggleTalapoChat()')
    if start == -1:
        return code
    m = re.search(r'async function sendTalapoMessage\(\)[\s\S]*?\n}\n', code[start:])
    end = start + (m.end() if m else 0)
    # también el appendMessage duplicado que venía justo después
    m2 = re.match(r'\s*function appendMessage\([^)]*\)\s*\{[\s\S]*?\n}\n', code[end:])
    if m2:
        end += m2.end()
    return code[:start] + '/* [Talapo] chatbot viejo eliminado: ahora es el componente TalapoAI.vue */\n' + code[end:]


def transform_js(code, name):
    code = strip_old_chatbot(code)
    # Nunca publicar claves de Gemini/Google escritas en el código
    code = re.sub(r'(["\'])(?:AIza[0-9A-Za-z_\-]{20,}|AQ\.[0-9A-Za-z_\-]{20,})\1', '""', code)
    if name == 'emergency':  # el original tenía "ocument.addEventListener" (error de tipeo)
        code = re.sub(r'(^|\n)ocument\.addEventListener', r'\1document.addEventListener', code)
    # Navbar/carrusel duplicados de main.js: ahora viven en AppNavbar.vue
    code = re.sub(r'''window\.addEventListener\(\s*['"]resize['"]\s*,\s*updateRotativeCarousel\s*\);?''',
                  '/* [migración] listener del carrusel de main.js eliminado */', code)
    code = re.sub(r'''(?:document|window)\.addEventListener\(\s*(['"])(?:DOMContentLoaded|load)\1\s*,''',
                  '__ready(', code)
    code = re.sub(r'(?<![\w.$])window\.addEventListener\(', '__listen(window, ', code)
    code = re.sub(r'(?<![\w.$])document\.addEventListener\(', '__listen(document, ', code)
    code = re.sub(r'(?<![\w.$])(?:window\.)?setInterval\(', '__interval(', code)
    code = code.replace('window.onload =', '__onload =')
    # La config del CDN de Tailwind se aplica al compilar (tools/scope_css.mjs), no en el navegador
    code = re.sub(r'(?<![\w.])tailwind\.config\s*=', 'var __tailwindConfig =', code)
    return fix_refs(code)


def handler_names(soup):
    names = set()
    for tag in soup.find_all(True):
        for attr, val in tag.attrs.items():
            if attr.startswith('on') and isinstance(val, str):
                for n in re.findall(r'([A-Za-z_$][\w$]*)\s*\(', val):
                    if n not in ('if', 'return', 'function', 'alert', 'confirm', 'event', 'this'):
                        names.add(n)
    return sorted(names)


def page(name):
    path = os.path.join(SRC, 'index.html') if name == 'index' else os.path.join(SRC, 'components', name + '.html')
    raw = open(path, encoding='utf-8', errors='ignore').read()
    raw = extract_base64(raw, name)
    soup = BeautifulSoup(raw, 'lxml')

    fonts, externals, css_parts, inline_js = [], [], [], []
    for link in soup.find_all('link'):
        href = link.get('href', '')
        if 'fonts.googleapis.com/css' in href:
            fonts.append(href)
        elif href.startswith('http') and 'stylesheet' in (link.get('rel') or []) \
                and 'font-awesome' not in href and 'leaflet' not in href:
            externals.append({'type': 'css', 'src': href})
        elif re.match(r'^(\.\./)?assets/css/', href):
            css_parts.append(open(os.path.join(SRC, 'assets', 'css', href.split('/')[-1]),
                                  encoding='utf-8', errors='ignore').read())
    for st in soup.find_all('style'):
        css_parts.append(st.get_text())
        st.decompose()

    js_files = []
    for sc in soup.find_all('script'):
        src = sc.get('src')
        if src and src.startswith('http'):
            if not any(d in src for d in DROP_SCRIPTS):
                externals.append({'type': 'js', 'src': src})
        elif src and re.match(r'^(\.\./)?assets/js/', src):
            js_files.append(open(os.path.join(SRC, 'assets', 'js', src.split('/')[-1]),
                                 encoding='utf-8', errors='ignore').read())
        elif sc.get_text().strip():
            inline_js.append(sc.get_text())
        sc.decompose()

    body = soup.body
    # Quitar chrome duplicado: navbar, footer y el chatbot viejo (ahora son componentes globales)
    # Solo el chrome del SITIO: ojo, typicalrecipes tiene <footer class="footer-banner"> que es contenido
    # El index conserva SU navbar original (petición del cliente): solo ahí no se quita nav.navbar
    # El index conserva SU navbar y SU footer originales (petición del cliente)
    site_chrome = [] if name == 'index' else ['nav.navbar', 'footer.footer']
    for sel in site_chrome + ['nav.main-nav', 'div.main-nav', 'footer.talapo-footer',
                '.talapo-chat-bubble', '.talapo-chat-window', '#chatBubble', '#chatWindow']:
        for el in body.select(sel):
            el.decompose()
    for c in body.find_all(string=lambda t: isinstance(t, Comment)):
        c.extract()

    # Traducciones por página (tools/translations/<nombre>.json): frase original -> inglés
    tr_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'translations', name + '.json')
    translations = json.load(open(tr_file, encoding='utf-8')) if os.path.exists(tr_file) else {}

    globals_ = sorted(set(handler_names(body)) | set(EXTRA_GLOBALS.get(name, [])))
    template = fix_refs(body.decode_contents()).strip()
    for es, en in translations.items():
        template = template.replace(es, en)

    js = '\n;\n'.join(js_files + inline_js)
    js = transform_js(js, name)
    for es, en in translations.items():
        js = js.replace(es, en)
    expose = '\n'.join(f"  if (typeof {g} !== 'undefined') __expose('{g}', {g});" for g in globals_)
    # Se ejecuta con new Function(...) en modo "sloppy" (igual que un <script> clásico),
    # así las variables globales implícitas del código viejo siguen funcionando.
    module = (
        '/* eslint-disable */\n'
        f'// Código original de components/{name}.html adaptado por tools/port_legacy.py.\n'
        '// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.\n'
        '// Los listeners e intervalos se limpian solos al salir de la página.\n'
        'var __onload = null;\n'
        f'{js}\n'
        ';\n'
        f'{expose}\n'
        'if (typeof __onload === "function") __ready(__onload);\n'
    )

    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'template.html'), 'w', encoding='utf-8').write(template)
    open(os.path.join(d, 'style.raw.css'), 'w', encoding='utf-8').write(fix_refs('\n'.join(css_parts)))
    open(os.path.join(d, 'script.js'), 'w', encoding='utf-8').write(module)
    title = (soup.title.get_text().strip() if soup.title else 'Talapo.SV')
    meta = {'name': name, 'title': title, 'fonts': fonts, 'externals': externals,
            'globals': globals_, 'tailwind': name == 'travelkits'}
    json.dump(meta, open(os.path.join(d, 'meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'{name:22s} html={len(template):7d} css={sum(map(len, css_parts)):6d} js={len(js):7d} globals={globals_}')


for n in LEGACY:
    if n in MANUAL and os.path.exists(os.path.join(OUT, n, 'script.js')):
        print(f'{n:22s} (mantenido a mano, se omite)')
        continue
    page(n)
if missing:
    print('\nAssets referenciados que NO existen en el proyecto original:')
    for m in sorted(missing):
        print('  -', m)
