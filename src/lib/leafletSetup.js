// Leaflet se carga SOLO en las páginas que tienen mapa (antes se cargaba al abrir
// cualquier página, incluso el inicio, y hacía más lenta la primera carga).
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Con bundler: arreglar rutas de los íconos y exponer `L` para las páginas heredadas
if (!L.__talapoReady) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });
  L.__talapoReady = true;
}
window.L = L;

export default L;
