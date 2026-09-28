import { createApp } from 'vue';
import { createPinia } from 'pinia';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import App from './App.vue';
import router from './router';
import './styles/tokens.css';
import './styles/base.css';

// Leaflet con bundler: arreglar rutas de los íconos y exponer `L` para las páginas heredadas
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });
window.L = L;

createApp(App).use(createPinia()).use(router).mount('#app');
