/* eslint-disable */
// Código original de components/ra.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;

        // Base de datos con los enlaces "Embed" reales de Google Street View en El Salvador
        const mapas360 = {
            centro_historico: {
                titulo: "Historic Center 360°",
                // Vista frente al Palacio Nacional y Plaza Gerardo Barrios
                embedUrl: "https://www.google.com/maps/embed?pb=!3m2!1ses!2ssv!4v1783831482319!5m2!1ses!2ssv!6m8!1m7!1sCAoSFkNJSE0wb2dLRUlDQWdJREV1NjItVUE.!2m2!1d13.69777770010024!2d-89.19055179487336!3f22.00562857113718!4f13.112742329061433!5f0.7820865974627469"
            },
            joya_de_ceren: {
                titulo: "Joya de Cerén 360°",
                // Vista desde las estructuras arqueológicas cubiertas
                embedUrl: "https://www.google.com/maps/embed?pb=!3m2!1ses!2ssv!4v1783831638923!5m2!1ses!2ssv!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJRHVvSWU0NWdF!2m2!1d13.82787273857649!2d-89.35631148850707!3f179.1864934582391!4f2.0669747680789925!5f0.4000000000000002"
            },
            los_tercios: {
                titulo: "Los Tercios Waterfall 360°",
                // Vista panorámica desde la cima de la formación rocosa
                embedUrl: "https://www.google.com/maps/embed?pb=!3m2!1ses!2ssv!4v1783832391257!5m2!1ses!2ssv!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJQ0VqWmVEa2dF!2m2!1d13.93708885750206!2d-89.0133932763776!3f167.89984207445542!4f2.063854792203088!5f0.4000000000000002"
            },
            lago_coatepeque: {
                titulo: "Lake Coatepeque 360°",
                // Vista panorámica desde un mirador del lago
                embedUrl: "https://www.google.com/maps/embed?pb=!3m2!1ses!2ssv!4v1783832007502!5m2!1ses!2ssv!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJRGVqT3lpdGdF!2m2!1d13.88819580099372!2d-89.53831937405073!3f333.257745540904!4f-18.931073926882277!5f0.7820865974627469"
            },
            el_tunco: {
                titulo: "El Tunco Beach 360°",
                // Vista interactiva en la pura arena frente a la roca del Tunco
                embedUrl: "https://www.google.com/maps/embed?pb=!3m2!1ses!2ssv!4v1783832133408!5m2!1ses!2ssv!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJREVtOHpNa2dF!2m2!1d13.49263810195101!2d-89.3854629976591!3f169.30648578981172!4f8.898334261331499!5f0.7820865974627469"
            }
        };

        // 1. Capturar el destino de la URL (?lugar=...)
        const params = new URLSearchParams(window.location.search);
        const destino = params.get('lugar');

        // 2. Inyectar el Street View correspondiente
        if (destino && mapas360[destino]) {
            const info = mapas360[destino];
            
            // Cambiar el título superior
            document.getElementById('ui-titulo').innerText = "" + info.titulo;
            
            // Cargar el mapa incrustado correcto en el iframe
            document.getElementById('google-streetview').setAttribute('src', info.embedUrl);
        } else {
            // Destino por defecto (Frente al Palacio Nacional si algo falla)
            document.getElementById('ui-titulo').innerText = "Talapo.sv destination";
            document.getElementById('google-streetview').setAttribute('src', mapas360.centro_historico.embedUrl);
        }
    
;

if (typeof __onload === "function") __ready(__onload);
