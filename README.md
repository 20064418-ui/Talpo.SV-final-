# Talapo.SV 2.0 — Vue 3 + InsForge

Plataforma de turismo de El Salvador migrada de 27 archivos HTML sueltos a una SPA en **Vue 3** (Vite, Vue Router, Pinia) con **InsForge** como backend (auth, base de datos, storage y edge functions).

## Estructura

```
src/
  components/layout/   AppNavbar · AppFooter · TalapoAI   ← idénticos en TODAS las páginas
  components/auth/     AuthShell · SocialButtons (Google, GitHub, Facebook)
  views/               Landing (index) · Main · Login · Register · AuthCallback
                       Passport · Contests · Tours · Itineraries · NotFound · LegacyPage
  stores/              auth · passport (perfil + racha + sellos) · itineraries · contests
  data/                navigation · tours · contests · site
  legacy/pages/<pág>/  páginas heredadas en "modo compatibilidad" (ver abajo)
  lib/insforge.js      cliente único de InsForge
  legacy/bridge.js     puente __talapo: las páginas viejas (foro) usan InsForge
migrations/            SQL: tablas, RLS, racha, ranking y foro (lo lee el CLI)
insforge/functions/talapo-chat/index.ts   IA segura (la clave NO va en el navegador)
tools/setup-insforge.mjs   conecta todo con `npm run setup:insforge`
tools/port_legacy.py · scope_css.mjs   scripts que migraron las páginas viejas
```

### Rutas y redirecciones

| Ruta | Página |
|---|---|
| `/` | Landing (antes `index.html`) |
| `/main` | Principal — destino tras **Sign In** |
| `/register` → `/passport` | Registro por primera vez (email u OAuth) lleva al **Pasaporte** |
| `/login` → `/main` | Usuario ya registrado va a la **Principal** |
| `/passport`, `/itineraries` | Requieren sesión |
| `/tours`, `/contests` | Nativas en Vue |
| `/buses`, `/typicalrecipes`, … | 19 páginas heredadas |

Los enlaces viejos (`main.html`, `components/pasaporte.html`, etc.) redirigen solos a la ruta nueva.

### Páginas heredadas ("modo compatibilidad")

Las 19 páginas secundarias (`buses`, `conversiones`, `emergency`, `planes`, `plan*`, `stand`, `traductor`, `travelkits`, `turisticattractions`, `typicalrecipes`, `gastronomy`, `foro`, `clothing`, `ra`, `talapo-itinerario`) se migraron automáticamente con `tools/port_legacy.py` + `tools/scope_css.mjs`:

- Se les quitó su navbar, footer y chatbot duplicados; ahora usan los componentes globales.
- Su CSS quedó **acotado** (`.lg-buses …`) para que no rompa el resto del sitio.
- Su JS original corre dentro de `LegacyPage.vue`, que limpia listeners/intervalos al salir. El código duplicado del navbar/carrusel de `main.js` quedó neutralizado.
- Tailwind de `travelkits` ya no viene del CDN (afectaba todo el sitio): se compila solo para esa página.

Así el sitio completo funciona ya en Vue, y cada página puede reescribirse como componente nativo cuando haya tiempo (como se hizo con Tours), sin tocar las demás.

---

## Diseño: se conserva el original

Cada página mantiene **su diseño original**: mismo HTML y CSS, y su propio JS en las páginas heredadas.
- `index`, `main`, `tours` y las demás páginas corren su HTML/CSS/JS original (ver "modo compatibilidad").
- El **index conserva su navbar propio** (Mission & Vision, Places, Partners, Create Account). Las demás páginas usan el navbar de `main.html`, idéntico al original, más el enlace Tours.
- Login, Registro y Pasaporte usan el marcado y el CSS de `login.html`, `registre.html` y `pasaporte.html` (`src/styles/pages/`), con InsForge por dentro.
- Footer y chat de IA: los de `main.html`, iguales en todas las páginas.
- Lo único nuevo son **transiciones**: entrada entre páginas, barra de progreso al navegar, aparición suave al hacer scroll (solo opacidad y desplazamiento), animación del chat, de los mensajes, de los sellos del pasaporte y de los paneles de login/registro. Se desactivan si el sistema pide "reducir movimiento".

## Integración con InsForge — paso a paso

### Opción rápida (recomendada): un solo comando

```bash
npm install
npm run setup:insforge
```

El script `tools/setup-insforge.mjs` (Windows, Mac y Linux) hace todo esto y se puede repetir sin romper nada:

1. Inicia sesión en InsForge y vincula la carpeta a tu proyecto (`.insforge/project.json`).
2. Aplica las migraciones de `migrations/` (las tablas de abajo, RLS, racha y ranking).
3. Crea los buckets públicos `passport-photos` y `forum-images`.
4. Te pide tu `OPENROUTER_API_KEY`, la guarda como **secreto** y despliega la función `talapo-chat`.
5. Escribe `.env.local` con `VITE_INSFORGE_URL` y `VITE_INSFORGE_ANON_KEY`.
6. Verifica que las 9 tablas existan.

Después solo falta el paso manual de **Autenticación** (sección 4).

### Opción manual (los mismos pasos, uno por uno)

```bash
npx @insforge/cli login
npx @insforge/cli link                      # elige tu proyecto
npx @insforge/cli db migrations up --all    # lee la carpeta migrations/
npx @insforge/cli storage create-bucket passport-photos --public
npx @insforge/cli storage create-bucket forum-images --public
npx @insforge/cli secrets add OPENROUTER_API_KEY sk-or-...
npx @insforge/cli functions deploy talapo-chat --file insforge/functions/talapo-chat/index.ts
npx @insforge/cli secrets get ANON_KEY      # cópiala a .env.local
```

`.env.local` (copia de `.env.example`):

```
VITE_INSFORGE_URL=https://<appkey>.<region>.insforge.app
VITE_INSFORGE_ANON_KEY=<anon key>
```

> Los archivos de migración deben llamarse `<número>_<nombre-con-guiones>.sql`; el CLI rechaza guiones bajos en el nombre.

### 3. Qué página usa qué tabla

| Página | Tablas / servicios | Qué guarda |
|---|---|---|
| Registro, Login, `/auth/callback` | Auth (email + Google/GitHub/Facebook), `profiles` | Sesión; primera vez → `/passport`, usuario existente → `/main` |
| `/passport` | `profiles`, `activity_log`, `passport_stamps`, bucket `passport-photos` | Datos del pasaporte, foto, sellos de lugares |
| Racha Talapo (navbar y pasaporte) | función `touch_streak()` + `activity_log` | Se calcula en el servidor al entrar cada día |
| `/tours` y `/itineraries` | `itineraries` (`source = 'tours'`) | Rutas guardadas (paradas en `jsonb`) |
| `/talapo-itinerario` | `itineraries` (`source = 'planner'`, plan completo en `details`) | Botón “Save to my itineraries”; se reabre con `?itinerary=<id>` |
| `/contests` | `contest_entries`, vista `ranking_talapo` | Inscripciones a los 5 retos y Ranking Talapo |
| `/foro` | `forum_posts`, `forum_comments`, `forum_reactions`, `forum_saves`, bucket `forum-images` | Publicaciones, respuestas, likes/loves, guardados, fotos |
| Widget IA | edge function `talapo-chat` | Nada (la clave vive como secreto) |

Todas las tablas tienen **RLS**: cada usuario solo lee y modifica lo suyo. El foro y el ranking son de lectura pública. Los triggers impiden que un usuario cambie su puntuación en concursos o su fecha de ingreso a la Familia Talapo.

Las demás páginas heredadas (buses, recetas, conversiones, etc.) no guardan datos de usuario, así que no necesitan base de datos. Solo leían `talapo_passport` de `localStorage` para la foto del navbar viejo, y eso ahora lo hace el Navbar global.

### 4. Autenticación (paso manual en el Dashboard)

1. **Authentication → Auth Methods**: activa Google, GitHub y Facebook con el *client ID* y *secret* de cada consola de desarrollador. La URL de callback que te piden esas consolas aparece en la misma pantalla de InsForge.
2. **Allowed redirect URLs**: agrega `http://localhost:5173/auth/callback`, `http://localhost:5173/login` y las mismas con tu dominio real.
3. Si activas verificación de email, elige el método **código de 6 dígitos**: la pantalla de registro ya trae el campo para escribirlo.

### Si el código de verificación no llega al correo

El servicio de correo del plan gratuito puede tardar o caer en spam. En la pantalla de registro ya hay un botón **"resend the code"**. Si prefieres que no pida código:

- **Dashboard:** Authentication → Settings → desactiva **Require email verification**.
- **Terminal:**
  ```bash
  npx @insforge/cli config export                          # crea insforge.toml con tu configuración
  # en insforge.toml, dentro de [auth], pon: require_email_verification = false
  npx @insforge/cli config apply                           # lo aplica al proyecto
  ```

### 5. Comprobar que todo quedó unido

1. `npm run dev` y abre `http://localhost:5173`.
2. Crea una cuenta → debes llegar a `/passport`. Completa el pasaporte con foto.
3. En **Tours** arma una ruta y guárdala → aparece en `/itineraries` y en tu pasaporte.
4. En **Contests** inscríbete en un reto → sube tu contador y aparece en el ranking.
5. En **Forum** publica con imagen, comenta y reacciona → recarga la página: todo sigue ahí.
6. Revisa los datos en Dashboard → Database, o con `npx @insforge/cli db query "select count(*) from forum_posts"`.

### 6. IA Talapo — si no responde

En `npm run dev` el chat te dice exactamente qué falta. Las causas posibles son:

1. **No existe `.env.local`**: ejecuta `npm run setup:insforge` y reinicia `npm run dev`.
2. **La función no está desplegada**: `npx @insforge/cli functions deploy talapo-chat --file insforge/functions/talapo-chat/index.ts`.
3. **Falta el secreto**: copia la clave de Dashboard → Model Gateway y ejecuta `npx @insforge/cli secrets add OPENROUTER_API_KEY <clave>`. Después vuelve a desplegar la función.

Si la función falla, el chat intenta como respaldo el proxy de IA integrado de InsForge (`insforge.ai.chat.completions`, en modo compatibilidad).

### 6b. Detalles de la IA

La clave de Gemini del proyecto original estaba en el código del navegador. ⚠️ **Revócala**: quedó expuesta en el código y en el historial de git. El widget ahora llama a la edge function `talapo-chat`, que usa el secreto `OPENROUTER_API_KEY`. Para cambiar de modelo, agrega el secreto `TALAPO_MODEL` (por defecto `openai/gpt-4o-mini`).

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
```
Hosting: `vercel.json` y `public/_redirects` (Netlify) ya incluyen el *fallback* de SPA.

### Videos
Los `.mp4` (≈175 MB) no van en el repositorio. Cópialos a `public/assets/mp4/` o, mejor, súbelos a un bucket de InsForge Storage y cambia las rutas. `05 Talapo.SV.mp4` y `Panesdepollo.mp4` se referencian en el código original pero no venían en el proyecto.

### Correcciones aplicadas al migrar
Referencias de imágenes con mayúsculas incorrectas (404 en Linux), nombres dañados por el ZIP (`#U00e1` → `á`), `ocument.addEventListener` en emergency, `policia.jpg`→`.webp`, ruta truncada `emergency/tra`, imágenes base64 de 1 MB en gastronomy extraídas a archivos, 3 copias de Font Awesome unificadas, imágenes optimizadas (38 MB → 23 MB).
