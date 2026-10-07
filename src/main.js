import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/tokens.css';
import './styles/base.css';

// Leaflet (mapas) ya no se carga aquí: lo pide cada página con mapa (src/lib/leafletSetup.js)

// Instalar Talapo como app: el navegador avisa cuando se puede y se guarda el evento para usarlo en un botón
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__talapoInstall = e;
  window.dispatchEvent(new Event('talapo-installable'));
});
window.addEventListener('appinstalled', () => { window.__talapoInstall = null; });

createApp(App).use(createPinia()).use(router).mount('#app');

// Funciona sin internet (sobre todo el Stand): service worker solo en producción
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
