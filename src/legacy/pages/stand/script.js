/* eslint-disable */
// Código original de components/stand.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
// 1. Array with the official Picture Stands across El Salvador
const stands = [
    {
        id: 1,
        nombre: "Parque Libertad",
        departamento: "San Salvador",
        coords: [-89.1914, 13.6989],
        tematica: "Colonial Historic Center",
        descripcion: "Located in the heart of the Historic Center. Known for its art deco architecture and immense cultural value for locals.",
        consejo: "Visit it during the late afternoon or evening to capture the lighting of the plaza.",
        imagen: "/assets/img/stand/parque.jpg"
    },
    {
        id: 2,
        nombre: "Parque Cuscatlán",
        departamento: "San Salvador",
        coords: [-89.2150, 13.6950],
        tematica: "Urban Art and Nature",
        descripcion: "An urban green lung full of history and memory, featuring cultural spaces and iconic photographic spots of Salvadoran identity.",
        consejo: "Ideal in the mornings to take advantage of the natural light filtering through the trees.",
        imagen: "/assets/img/stand/parquecuscatlan.jpg"
    },
    {
        id: 3,
        nombre: "San Salvador Volcano (El Boquerón)",
        departamento: "La Libertad",
        coords: [-89.2833, 13.7333],
        tematica: "Adventure and Mountain Climate",
        descripcion: "A natural viewpoint situated high on the crater rim. A fresh spot offering an unmatched mountainous panorama.",
        consejo: "Bring a light jacket and arrive before 4:00 PM to avoid dense fog.",
        imagen: "/assets/img/main/elboqueron.jpg"
    },
    {
        id: 4,
        nombre: "El Tunco Beach",
        departamento: "La Libertad",
        coords: [-89.3835, 13.4905],
        tematica: "Tropical Sunset and Surf",
        descripcion: "The benchmark international surfing beach in El Salvador, featuring a vibrant atmosphere and coastal art.",
        consejo: "Take your photo precisely during the golden hour of the sunset.",
        imagen: "/assets/img/main/playahero.jpg"
    },
    {
        id: 5,
        nombre: "Santa Ana Central Park",
        departamento: "Santa Ana",
        coords: [-89.5558, 13.9942],
        tematica: "Neo-Gothic Architecture",
        descripcion: "Located right in front of the majestic Santa Ana Theater and Cathedral, paying tribute to rich western history.",
        consejo: "Use symmetric angles facing the cathedral for a picture-perfect shot.",
        imagen: "/assets/img/stand/parksantaana.jpg"
    },
    {
        id: 6,
        nombre: "Historic Town of Suchitoto",
        departamento: "Cuscatlán",
        coords: [-89.0308, 13.9358],
        tematica: "Culture and Lake View",
        descripcion: "Cobblestone streets, colonial ambiance, and a privileged view overlooking the majestic Lake Suchitlán.",
        consejo: "Wear light-colored clothing that contrasts with the town's colonial facades.",
        imagen: "/assets/img/stand/suchitoto.jpg"
    },
    {
        id: 7,
        nombre: "Mirador de la Paz",
        departamento: "San Miguel",
        coords: [-88.1814, 13.4833],
        tematica: "Eastern El Salvador",
        descripcion: "A panoramic balcony in the eastern part of the country known for its warmth, tradition, and festive migueleño spirit.",
        consejo: "Enjoy the eastern sunset from this strategic viewpoint.",
        imagen: "/assets/img/stand/mirador.jpg"
    }
];

// 2. Initialize the OpenLayers map centered on El Salvador
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([-88.9, 13.7]),
        zoom: 8.5
    })
});

// 3. Create map pins using custom markers aligned with the Talapo color palette
const vectorSource = new ol.source.Vector();

stands.forEach(stand => {
    const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(stand.coords)),
        id: stand.id,
        name: stand.nombre,
        dept: stand.departamento,
        tematica: stand.tematica,
        descripcion: stand.descripcion,
        consejo: stand.consejo,
        imagen: stand.imagen
    });

    feature.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            crossOrigin: 'anonymous',
            src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', 
            scale: 0.08,
            tint: '#0f766e' // Corporate Talapo green tint
        })
    }));

    vectorSource.addFeature(feature);
});

const vectorLayer = new ol.layer.Vector({
    source: vectorSource
});
map.addLayer(vectorLayer);

// 4. Render the left sidebar listing with images and elements
const standsListContainer = document.getElementById('standsList');
const infoPanel = document.getElementById('infoPanel');

function renderStandsList() {
    if (!standsListContainer) return;
    standsListContainer.innerHTML = '';
    
    stands.forEach(stand => {
        const item = document.createElement('div');
        item.className = 'stand-card-item';
        item.setAttribute('data-id', stand.id);
        item.innerHTML = `
            <img src="${stand.imagen}" alt="${stand.nombre}">
            <div class="stand-card-info">
                <h4>${stand.nombre}</h4>
                <span>${stand.departamento}</span>
            </div>
        `;

        item.addEventListener('click', () => {
            selectStand(stand.id);
        });

        standsListContainer.appendChild(item);
    });
}

// 5. Interactive selection logic (Zoom and bottom panel update)
function selectStand(id) {
    const selectedStand = stands.find(s => s.id === id);
    if (!selectedStand || !infoPanel) return;

    document.querySelectorAll('.stand-card-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-id') == id) {
            el.classList.add('active');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    map.getView().animate({
        center: ol.proj.fromLonLat(selectedStand.coords),
        zoom: 13,
        duration: 1000
    });

    infoPanel.innerHTML = `
        <div class="active-stand-content">
            <img src="${selectedStand.imagen}" alt="${selectedStand.nombre}">
            <div class="active-stand-details">
                <h3>${selectedStand.nombre} (${selectedStand.departamento})</h3>
                <p><strong>Theme:</strong> ${selectedStand.tematica}</p>
                <p>${selectedStand.descripcion}</p>
                <div class="tip-box-bottom">
                    <strong>💡 Talapo Photo Tip:</strong> ${selectedStand.consejo}
                </div>
            </div>
        </div>
    `;
}

// Initialize list
renderStandsList();

// 6. Map marker click event
map.on('click', function(event) {
    let clickedFeature = null;
    map.forEachFeatureAtPixel(event.pixel, function(feature) {
        clickedFeature = feature;
        return true;
    });

    if (clickedFeature) {
        const props = clickedFeature.getProperties();
        selectStand(props.id);
    }
});

// Interactive hand cursor over map pins
map.on('pointermove', function(e) {
    const hit = map.hasFeatureAtPixel(e.pixel);
    map.getTarget().style.cursor = hit ? 'pointer' : '';
});

// 7. DOM automations, mobile menu, and user profile sync
__ready( () => {
    // Mobile Menu
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            navLinks.classList.toggle('active');
            
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        __listen(document, 'click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuToggle) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        });
    }

    // Sync passport profile picture with the navigation bar
    const savedPassport = localStorage.getItem('talapo_passport');
    if (savedPassport) {
        try {
            const data = JSON.parse(savedPassport);
            const navProfileImg = document.querySelector('.nav-profile-img');
            if (navProfileImg && data.fotoUrl) {
                navProfileImg.src = data.fotoUrl;
            }
        } catch (error) {
            console.error("Error reading passport data:", error);
        }
    }
});
;

if (typeof __onload === "function") __ready(__onload);
