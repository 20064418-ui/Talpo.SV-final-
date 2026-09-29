/* eslint-disable */
// Código original de components/talapo-itinerario.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;

/* =========================================================================
   FORM NAVIGATION
   ========================================================================= */
const steps = Array.from(document.querySelectorAll('.panel'));
const total = steps.length;
let current = 0;

const routeTrack = document.getElementById('routeTrack');
const stepLabels = ["You","Trip","$","Tastes","Logistics","Details","Ready"];
steps.forEach((_, i) => {
  const el = document.createElement('div');
  el.className = 'route-step';
  el.innerHTML = `<div class="route-line"></div><div class="route-pin"><span>${i+1}</span></div><div class="route-label">${stepLabels[i] || ''}</div>`;
  routeTrack.appendChild(el);
});

function renderRoute(){
  document.querySelectorAll('.route-step').forEach((el, i) => {
    el.classList.remove('active','done');
    if(i < current) el.classList.add('done');
    if(i === current) el.classList.add('active');
  });
}

function showStep(i){
  steps.forEach((p, idx) => p.classList.toggle('visible', idx === i));
  document.getElementById('btnBack').style.visibility = i === 0 ? 'hidden' : 'visible';
  const btnNext = document.getElementById('btnNext');
  btnNext.textContent = (i === total - 1) ? 'Generate my itinerary' : 'Next';
  if(i === total - 1) buildSummary();
  renderRoute();
  window.scrollTo({top: 0, behavior:'smooth'});
}

function validateStep(i){
  const requiredFields = steps[i].querySelectorAll('[required]');
  for (const f of requiredFields){ if(!f.reportValidity()) return false; }
  return true;
}

document.getElementById('btnNext').addEventListener('click', () => {
  if(current < total - 1){
    if(!validateStep(current)) return;
    current++; showStep(current);
  } else {
    generarItinerario();
  }
});
document.getElementById('btnBack').addEventListener('click', () => {
  if(current > 0){ current--; showStep(current); }
});

// Phone field only accepts digits, spaces, "+" and "-" (no letters or symbols).
const telefonoInput = document.getElementById('telefono');
if(telefonoInput){
  telefonoInput.addEventListener('input', () => {
    telefonoInput.value = telefonoInput.value.replace(/[^0-9+\-\s]/g, '');
  });
}

document.querySelectorAll('.stepper-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    const delta = parseInt(btn.dataset.delta, 10);
    const input = document.getElementById(target);
    const countEl = document.getElementById(target + 'Count');
    let val = parseInt(input.value, 10) + delta;
    const min = target === 'adultos' ? 1 : 0;
    if(val < min) val = min; if(val > 20) val = 20;
    input.value = val; countEl.textContent = val;
  });
});

const budgetRange = document.getElementById('budgetRange');
const budgetValue = document.getElementById('budgetValue');
budgetRange.addEventListener('input', () => {
  budgetValue.textContent = '$' + budgetRange.value + (budgetRange.value == 500 ? '+' : '');
});

const prioridadGrid = document.getElementById('prioridadGastoGrid');
prioridadGrid.addEventListener('change', () => {
  const checked = prioridadGrid.querySelectorAll('input:checked');
  if(checked.length > 2){ checked[0].checked = false; }
});

function getFormData(){
  const form = document.getElementById('tripForm');
  const fd = new FormData(form);
  const obj = {};
  for (const [key, value] of fd.entries()){
    if(obj[key] !== undefined){
      if(Array.isArray(obj[key])) obj[key].push(value);
      else obj[key] = [obj[key], value];
    } else obj[key] = value;
  }
  if(obj.intereses && !Array.isArray(obj.intereses)) obj.intereses = [obj.intereses];
  if(obj.prioridadGasto && !Array.isArray(obj.prioridadGasto)) obj.prioridadGasto = [obj.prioridadGasto];
  return obj;
}

function buildSummary(){
  const data = getFormData();
  const list = document.getElementById('summaryList');
  list.innerHTML = '';
  const rows = [
    ['Name', data.nombre || '—'],
    ['Email', data.email || '—'],
    ['Travelers', `${data.adultos || 1} adult(s), ${data.ninos || 0} child(ren)`],
    ['Destination', data.destino || '—'],
    ['Dates', `${data.fechaInicio || '—'} → ${data.fechaFin || '—'}`],
    ['Budget per person', '$' + (data.presupuesto || '—')],
    ['Interests', (data.intereses || []).join(', ') || '—'],
    ['Pace', data.ritmo || '—'],
    ['Accommodation', data.alojamiento || '—'],
    ['Transport', data.transporte || '—'],
  ];
  rows.forEach(([label, value]) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${label}</strong><span class="val">${value}</span>`;
    list.appendChild(li);
  });
}

/* =========================================================================
   ITINERARY ENGINE — generates the result 100% in the browser
   (it doesn't depend on any external API, so it ALWAYS works, no
   matter where you publish this file). Further down, in "generarItinerario()",
   we leave the exact spot where you can plug in your own backend with OpenAI
   or Claude if you want real AI-generated responses later on.
   ========================================================================= */
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMsg = document.getElementById('loadingMsg');
const formError = document.getElementById('formError');
let mapInstance = null;
let itinerarioActual = null;

function setLoading(visible, msg){
  loadingOverlay.classList.toggle('visible', visible);
  if(msg) loadingMsg.textContent = msg;
}

// ---------- Dataset de lugares reales de El Salvador ----------
const PLACES = {
  "San Salvador": [
    {nombre:"El Boquerón National Park", categorias:["naturaleza","fotografia","aventura"], lat:13.7333, lng:-89.2833, costoEntrada:2, duracionMin:90, descripcion:"Crater of the San Salvador volcano, with lookout points and hiking trails.", tip:"Bring a light sweater — it's cool up in the mountains."},
    {nombre:"Puerta del Diablo", categorias:["naturaleza","fotografia","aventura"], lat:13.6167, lng:-89.1667, costoEntrada:1, duracionMin:60, descripcion:"Rock formation with panoramic views over southern El Salvador.", tip:"Go early to beat the heat and the crowds."},
    {nombre:"Metropolitan Cathedral of San Salvador", categorias:["cultura","religioso","arte"], lat:13.6989, lng:-89.1914, costoEntrada:0, duracionMin:45, descripcion:"Resting place of Archbishop Romero, with neoclassical architecture in the historic center.", tip:"Great for sunset photos over the National Palace."},
    {nombre:"Museo Tin Marín", categorias:["familiar","arte"], lat:13.6994, lng:-89.2103, costoEntrada:3, duracionMin:75, descripcion:"Interactive children's museum inside Parque Cuscatlan.", tip:"A great spot to slow down if you're traveling with kids."},
    {nombre:"National Museum of Anthropology (MUNA)", categorias:["cultura","arte"], lat:13.6802, lng:-89.2359, costoEntrada:1, duracionMin:60, descripcion:"Salvadoran history and archaeology in a single visit.", tip:"Ask about the Maya artifact exhibit."},
    {nombre:"Ex Cuartel Market", categorias:["compras","cultura"], lat:13.6986, lng:-89.1919, costoEntrada:0, duracionMin:50, descripcion:"Traditional handicrafts, hammocks, and Salvadoran textiles.", tip:"A little friendly haggling is part of the local culture."},
    {nombre:"National Zoo", categorias:["familiar","naturaleza"], lat:13.6772, lng:-89.2011, costoEntrada:1, duracionMin:80, descripcion:"Native and regional wildlife on a family-friendly walk.", tip:"Bring water — some areas have little shade."},
    {nombre:"Cadejo Brewing / Historic Center", categorias:["vidaNocturna","gastronomia"], lat:13.6983, lng:-89.1912, costoEntrada:0, duracionMin:70, descripcion:"Local craft brewery with an urban vibe downtown.", tip:"Great spot to see Plaza Gerardo Barrios lit up at night."}
  ],
  "La Libertad": [
    {nombre:"Playa El Tunco", categorias:["playas","aventura","fotografia","vidaNocturna"], lat:13.4903, lng:-89.3919, costoEntrada:0, duracionMin:120, descripcion:"Iconic surf beach with a laid-back vibe and oceanfront restaurants.", tip:"The best waves are usually early in the morning."},
    {nombre:"Playa El Sunzal", categorias:["playas","bienestar","aventura"], lat:13.4958, lng:-89.3781, costoEntrada:0, duracionMin:100, descripcion:"A great beach for beginner surfers, or just relaxing.", tip:"Rent a board for a couple of hours if you've never surfed."},
    {nombre:"Joya de Cerén", categorias:["cultura","fotografia"], lat:13.8214, lng:-89.3597, costoEntrada:3, duracionMin:70, descripcion:"UNESCO World Heritage archaeological site, known as the 'Pompeii of the Americas.'", tip:"Hiring a local guide makes the visit far more worthwhile."},
    {nombre:"La Libertad Port", categorias:["gastronomia","fotografia"], lat:13.4886, lng:-89.3228, costoEntrada:0, duracionMin:60, descripcion:"Pier with fresh seafood and Pacific sunset views.", tip:"Try the shrimp ceviche at the pier food stalls."},
    {nombre:"Playa El Zonte", categorias:["playas","bienestar","fotografia"], lat:13.4956, lng:-89.4344, costoEntrada:0, duracionMin:90, descripcion:"Quiet beach known as 'Bitcoin Beach,' great for unplugging.", tip:"A good, less touristy spot to watch the sunset."},
    {nombre:"Los Cobanos Viewpoint", categorias:["naturaleza","fotografia","aventura"], lat:13.5167, lng:-89.4167, costoEntrada:0, duracionMin:60, descripcion:"Coastal area with coral reefs, great for snorkeling.", tip:"Ask about snorkel tours during the dry season."}
  ],
  "Santa Ana": [
    {nombre:"Santa Ana Volcano (Ilamatepec)", categorias:["naturaleza","aventura","fotografia"], lat:13.8536, lng:-89.6297, costoEntrada:6, duracionMin:180, descripcion:"Guided hike up to a crater with a turquoise lagoon at the summit.", tip:"Leave very early; bring water and hiking shoes."},
    {nombre:"Santa Ana Cathedral", categorias:["cultura","arte","religioso"], lat:13.9942, lng:-89.5597, costoEntrada:0, duracionMin:40, descripcion:"Striking Gothic architecture right in the city center.", tip:"The Santa Ana Theater is right next door — great for photos."},
    {nombre:"Lake Coatepeque", categorias:["naturaleza","bienestar","fotografia"], lat:13.8628, lng:-89.5486, costoEntrada:0, duracionMin:150, descripcion:"Blue-water volcanic lake, perfect for relaxing or a boat ride.", tip:"Many lakeside restaurants have their own dock for swimming."},
    {nombre:"Central Park and El Calvario Church", categorias:["cultura","arte"], lat:13.9946, lng:-89.5603, costoEntrada:0, duracionMin:35, descripcion:"The historic heart of Santa Ana, with colonial architecture.", tip:"A good starting point for exploring downtown on foot."}
  ],
  "Sonsonate": [
    {nombre:"Los Chorros de la Calera Springs", categorias:["naturaleza","familiar","bienestar"], lat:13.7206, lng:-89.7242, costoEntrada:3, duracionMin:120, descripcion:"Natural pools fed by waterfalls, surrounded by tropical vegetation.", tip:"It fills up fast on weekends — get there early."},
    {nombre:"Juayua (Route of Flowers)", categorias:["gastronomia","cultura","compras"], lat:13.8425, lng:-89.7517, costoEntrada:0, duracionMin:150, descripcion:"A town famous for its weekend food fair.", tip:"Try the rabbit in chicha sauce if you visit during the fair."},
    {nombre:"Salcoatitán", categorias:["cultura","fotografia","compras"], lat:13.8514, lng:-89.7333, costoEntrada:0, duracionMin:70, descripcion:"A colorful town with murals and high-altitude coffee.", tip:"Great for photos among the picturesque houses."},
    {nombre:"Nahuizalco", categorias:["cultura","compras","gastronomia"], lat:13.7761, lng:-89.7347, costoEntrada:0, duracionMin:80, descripcion:"Indigenous town known for its wicker crafts and candlelit night market.", tip:"The night market is one of a kind, lit entirely by candles."}
  ],
  "Chalatenango": [
    {nombre:"La Palma", categorias:["cultura","arte","compras"], lat:14.3167, lng:-89.1667, costoEntrada:0, duracionMin:90, descripcion:"An artisan town known for Fernando Llort's naive folk art.", tip:"Visit the workshops painting on wood and copinol seeds."},
    {nombre:"El Pital (highest point in El Salvador)", categorias:["naturaleza","aventura","fotografia"], lat:14.3833, lng:-89.1167, costoEntrada:2, duracionMin:150, descripcion:"Mountain lookout with cool weather and pine-forest views.", tip:"Bring a jacket — temperatures can drop below 15°C (59°F)."},
    {nombre:"Tamulasco River", categorias:["naturaleza","bienestar","familiar"], lat:14.3333, lng:-89.15, costoEntrada:1, duracionMin:100, descripcion:"Natural pools surrounded by forest, perfect for cooling off.", tip:"The water is cold even in the dry season."}
  ],
  "La Paz": [
    {nombre:"San Diego Beach", categorias:["playas","familiar","bienestar"], lat:13.4267, lng:-89.1467, costoEntrada:0, duracionMin:120, descripcion:"Calm beach with gentle waves, great for families.", tip:"Shaded palm-thatch ranchos are available for the day."},
    {nombre:"Zacatecoluca Historic Center", categorias:["cultura","gastronomia"], lat:13.5081, lng:-88.8697, costoEntrada:0, duracionMin:70, descripcion:"Central park and colonial church, a good food stop.", tip:"Try the local turkey sandwich, a specialty here."},
    {nombre:"Costa del Sol", categorias:["playas","bienestar","familiar"], lat:13.3272, lng:-88.9092, costoEntrada:0, duracionMin:150, descripcion:"A long beach with hotels and a laid-back Pacific vibe.", tip:"A great spot to watch the sunset over the ocean."}
  ],
  "San Miguel": [
    {nombre:"Chaparrastique Volcano", categorias:["naturaleza","aventura","fotografia"], lat:13.4342, lng:-88.5200, costoEntrada:0, duracionMin:180, descripcion:"Hike up an active volcano with views toward the eastern coast.", tip:"Requires decent fitness — hire a local guide."},
    {nombre:"San Miguel Cathedral", categorias:["cultura","religioso"], lat:13.4833, lng:-88.1833, costoEntrada:0, duracionMin:40, descripcion:"A landmark of the historic center and home of the November fair.", tip:"If you're visiting in November, ask about the carnival."},
    {nombre:"El Jocotal Lagoon", categorias:["naturaleza","fotografia"], lat:13.3667, lng:-88.35, costoEntrada:1, duracionMin:90, descripcion:"A wetland with a wide variety of waterbirds.", tip:"Great for birdwatching at sunset."}
  ],
  "Morazán": [
    {nombre:"Downtown Perquin", categorias:["cultura","naturaleza"], lat:13.9667, lng:-88.1833, costoEntrada:0, duracionMin:80, descripcion:"A cool mountain town tied to the country's recent history.", tip:"Nights are cold — bring a jacket."},
    {nombre:"Museum of the Salvadoran Revolution", categorias:["cultura"], lat:13.9683, lng:-88.185, costoEntrada:1, duracionMin:70, descripcion:"Testimonies and artifacts from the Salvadoran civil war.", tip:"Guides are often former combatants — it's a deeply personal experience."},
    {nombre:"El Mozote", categorias:["cultura"], lat:13.85, lng:-88.15, costoEntrada:0, duracionMin:60, descripcion:"A historic memorial honoring the community.", tip:"Please visit respectfully — this is a site of historical memory."}
  ],
  "Ahuachapán": [
    {nombre:"Concepción de Ataco", categorias:["cultura","fotografia","compras","gastronomia"], lat:13.8722, lng:-89.8497, costoEntrada:0, duracionMin:120, descripcion:"A colorful Ruta de las Flores town with murals and high-altitude coffee shops.", tip:"Try single-farm local coffee at a cafe downtown."},
    {nombre:"Tacuba / El Imposible National Park", categorias:["naturaleza","aventura"], lat:13.9333, lng:-89.85, costoEntrada:6, duracionMin:180, descripcion:"Hiking and waterfalls inside one of the country's largest protected areas.", tip:"Hire a local guide — some trails require ropes."},
    {nombre:"Santa Teresa Hot Springs", categorias:["bienestar","naturaleza"], lat:13.9, lng:-89.85, costoEntrada:5, duracionMin:100, descripcion:"Natural hot springs surrounded by mountains.", tip:"A perfect way to end the day and relax sore muscles."}
  ]
};

// ---------- Typical meals by department ----------
const COMIDAS = {
  "San Salvador": [
    {nombre:"Local pupuseria downtown", costo:9, descripcion:"Mixed pupusas, curtido slaw, and horchata."},
    {nombre:"Cafe La Casona / Cadejo Brewery", costo:14, descripcion:"Traditional dishes with a gourmet twist, paired with a local drink."}
  ],
  "La Libertad": [
    {nombre:"Oceanfront restaurant in El Tunco", costo:12, descripcion:"Grilled fish with rice and salad."},
    {nombre:"Seafood spot at the La Libertad pier", costo:13, descripcion:"Fresh ceviche and shrimp cocktail."}
  ],
  "Santa Ana": [
    {nombre:"Restaurant by Lake Coatepeque", costo:11, descripcion:"Fried fish with plantain and curtido slaw."},
    {nombre:"Traditional diner near the historic center", costo:8, descripcion:"Local Santa Ana-style plate with handmade tortillas."}
  ],
  "Sonsonate": [
    {nombre:"Juayua Food Fair", costo:10, descripcion:"A variety of dishes and desserts from the Route of Flowers."},
    {nombre:"Local diner in Nahuizalco", costo:7, descripcion:"Home cooking made from traditional indigenous recipes."}
  ],
  "Chalatenango": [{nombre:"Mountain diner in La Palma", costo:8, descripcion:"Free-range chicken soup with griddle-cooked tortillas."}],
  "La Paz": [{nombre:"Beachfront rancho in Costa del Sol", costo:11, descripcion:"Mixed seafood platter and a cold beer with an ocean view."}],
  "San Miguel": [{nombre:"Traditional eastern-style restaurant", costo:9, descripcion:"Grilled beef with chirmol salsa and fried beans."}],
  "Morazán": [{nombre:"Perquin diner", costo:7, descripcion:"Free-range chicken with rice and local salad."}],
  "Ahuachapán": [{nombre:"High-altitude cafe in Concepcion de Ataco", costo:10, descripcion:"Single-farm coffee with a homemade dessert."}]
};

// ---------- Approximate weather by department ----------
const CLIMA = {
  "San Salvador": {clima:"Sunny with scattered clouds", temperatura:"27°C (81°F)", ropa:"Comfortable clothes, a hat, sunscreen, and sneakers"},
  "La Libertad": {clima:"Hot and humid, with a coastal breeze", temperatura:"30°C (86°F)", ropa:"Light clothing, a swimsuit, sandals, and sunscreen"},
  "Santa Ana": {clima:"Cool in the morning, sunny by midday", temperatura:"23°C (73°F)", ropa:"A light sweater, hiking shoes, and sunscreen"},
  "Sonsonate": {clima:"Mild, with a chance of light rain", temperatura:"25°C (77°F)", ropa:"Comfortable clothes and a light jacket for the afternoon"},
  "Chalatenango": {clima:"Cool mountain air, cold nights", temperatura:"19°C (66°F)", ropa:"A coat, long pants, and closed-toe shoes"},
  "La Paz": {clima:"Hot, typical coastal weather", temperatura:"31°C (88°F)", ropa:"Light clothing, a hat, and sunscreen"},
  "San Miguel": {clima:"Hot, dry in the afternoons", temperatura:"32°C (90°F)", ropa:"Cool clothing, plenty of water, and a hat"},
  "Morazán": {clima:"Cool mountain air", temperatura:"21°C (70°F)", ropa:"A light jacket and comfortable shoes"},
  "Ahuachapán": {clima:"Cool and misty in the mornings", temperatura:"20°C (68°F)", ropa:"A sweater, light jacket, and closed-toe shoes"}
};

// ---------- Known holidays (month-day) ----------
const FESTIVIDADES = [
  {md:"08-01", nombre:"Start of the August Festival (San Salvador)"},
  {md:"08-06", nombre:"August Festival — Feast of the Divine Savior of the World"},
  {md:"09-15", nombre:"El Salvador Independence Day"},
  {md:"11-02", nombre:"Day of the Dead"},
  {md:"11-21", nombre:"Salvadoran Friendship Day"},
  {md:"12-25", nombre:"Christmas"},
  {md:"05-03", nombre:"Day of the Cross"}
];

function buscarFestividad(fechaInicioStr, indiceDia){
  const base = fechaInicioStr ? new Date(fechaInicioStr + "T00:00:00") : new Date();
  base.setDate(base.getDate() + indiceDia);
  const mm = String(base.getMonth()+1).padStart(2,"0");
  const dd = String(base.getDate()).padStart(2,"0");
  const encontrada = FESTIVIDADES.find(f => f.md === `${mm}-${dd}`);
  return encontrada ? encontrada.nombre : null;
}

// ---------- Fun facts by department ----------
const DATOS_CURIOSOS = {
  "San Salvador": ["El Boqueron's last major eruption was in 1917, and steam can still be seen rising from cracks in the crater.", "The Metropolitan Cathedral holds the remains of Archbishop Oscar Arnulfo Romero, canonized as a saint in 2018."],
  "La Libertad": ["Playa El Zonte has been known worldwide as 'Bitcoin Beach' since 2019.", "Joya de Ceren is the only site in Central America where everyday Maya life was preserved thanks to volcanic ash."],
  "Santa Ana": ["Santa Ana Volcano (Ilamatepec) is the highest in El Salvador, at 2,381 meters (7,812 ft).", "Lake Coatepeque formed after the collapse of an ancient volcano thousands of years ago."],
  "Sonsonate": ["The Route of Flowers gets its name from the coffee blossoms and izote flowers that line the road in certain seasons.", "Nahuizalco is nationally known for its wicker and vine craftsmanship."],
  "Chalatenango": ["El Pital is the highest point in El Salvador, at 2,730 meters (8,957 ft) above sea level.", "La Palma is the birthplace of Salvadoran naive folk art, thanks to painter Fernando Llort."],
  "La Paz": ["Costa del Sol has more than 12 km (7.5 mi) of continuous beach, one of the longest in the country."],
  "San Miguel": ["Chaparrastique Volcano is one of the most active in El Salvador."],
  "Morazán": ["Perquin is today a landmark of historical memory tourism about the Salvadoran civil war."],
  "Ahuachapán": ["Concepcion de Ataco is famous for its street murals, painted by local artists."]
};

// ---------- Safety and culture tips (rotate daily) ----------
const CONSEJOS_GENERALES = [
  "Keep digital copies of your important documents in case you need them.",
  "The US dollar is the official currency — carry cash for places that don't take cards.",
  "Always book transportation through trusted apps or a recommendation from your lodging.",
  "Try street food at busy stalls — it's usually the freshest.",
  "Share your real-time location with someone you trust during the day.",
  "Carry cash in small bills for tips and informal vendors."
];

// ---------- Messages for special occasions ----------
const MENSAJES_OCASION = {
  cumpleanos: "🎉 Happy birthday! We put this trip together so you can celebrate in style.",
  aniversario: "💞 An itinerary designed to help you celebrate your anniversary together.",
  lunaDeMiel: "🌙 Congratulations on your honeymoon! This trip is designed to enjoy as a couple.",
  despedidaSoltero: "🥳 Let the party begin! We put together a high-energy trip for the whole group.",
  viajeDeNegocios: "💼 A balanced itinerary to help you perform well in meetings while still seeing the country.",
  reunionFamiliar: "👨‍👩‍👧‍👦 A trip designed for the whole family to enjoy, with a relaxed pace and variety."
};

// ---------- Recommendations by accommodation type ----------
const ALOJAMIENTO_TIPS = {
  hotel: "Look for well-located hotels near your first stop of the day to save time on transfers.",
  hostal: "Hostels usually have a shared kitchen, which is great for saving on some meals.",
  airbnb: "Book ahead during high season, and confirm check-in time with the host.",
  resort: "Double-check exactly which activities and meals are included in your all-inclusive package.",
  ecolodge: "Confirm power and signal availability if you're heading to a rural or mountain area.",
  sinPreferencia: "Compare options near your first stop of the day to cut down on transfers."
};

function iconoTransporte(transporte){
  return {uberTaxi:"🚕", vehiculoPropio:"🚗", publico:"🚌", tourPrivado:"🚐"}[transporte] || "🚗";
}

function fechaDeDia(fechaInicioStr, indiceDia){
  const base = fechaInicioStr ? new Date(fechaInicioStr + "T00:00:00") : new Date();
  base.setDate(base.getDate() + indiceDia);
  const meses = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${meses[base.getMonth()]} ${base.getDate()}, ${base.getFullYear()}`;
}

function computeDays(inicioStr, finStr){
  if(!inicioStr || !finStr) return 1;
  const d1 = new Date(inicioStr + "T00:00:00");
  const d2 = new Date(finStr + "T00:00:00");
  let diff = Math.round((d2 - d1) / 86400000) + 1;
  if(isNaN(diff) || diff < 1) diff = 1;
  return Math.min(diff, 6); // practical limit of 6 days per generation
}

function haversineKm(lat1,lng1,lat2,lng2){
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLng = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function estimarTraslado(distKm, transporte){
  const velocidades = {uberTaxi:32, vehiculoPropio:38, publico:16, tourPrivado:34};
  const velocidad = velocidades[transporte] || 30;
  let minutos = Math.round((distKm / velocidad) * 60 / 5) * 5;
  minutos = Math.max(10, Math.min(minutos, 75));
  const costosBase = {uberTaxi:[4,9], vehiculoPropio:[2,5], publico:[0.5,1.5], tourPrivado:[0,0]};
  const [min,max] = costosBase[transporte] || [4,8];
  const costo = transporte === "tourPrivado" ? 0 : Math.round((min + Math.random()*(max-min)) * 100)/100;
  return {minutos, costo};
}

function minutosAHora(mins){
  let h = Math.floor(mins/60) % 24;
  const m = ((mins % 60) + 60) % 60;
  const ampm = h >= 12 ? "p.m." : "a.m.";
  let h12 = h % 12; if(h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2,"0")} ${ampm}`;
}

function elegirLugares(pool, data, cantidad){
  const intereses = data.intereses || [];
  const evitarLista = (data.evitar || "").toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
  const mustSeeLista = (data.mustSee || "").toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
  const scored = pool.map(p => {
    let score = Math.random() * 1.5;
    p.categorias.forEach(c => { if(intereses.includes(c)) score += 3; });
    if(mustSeeLista.some(m => m && p.nombre.toLowerCase().includes(m))) score += 12;
    if(evitarLista.some(e => e && p.nombre.toLowerCase().includes(e))) score -= 100;
    if(data.aventura === "adrenalina" && p.categorias.includes("aventura")) score += 2;
    if(data.aventura === "tranquilo" && p.categorias.includes("aventura")) score -= 1.5;
    return {p, score};
  }).filter(s => s.score > -50);
  scored.sort((a,b) => b.score - a.score);
  return scored.slice(0, cantidad).map(s => s.p);
}

function ordenarDepartamentosPorInteres(data){
  const intereses = data.intereses || [];
  const puntuados = Object.keys(PLACES).map(dep => {
    let score = 0;
    (PLACES[dep] || []).forEach(p => p.categorias.forEach(c => { if(intereses.includes(c)) score += 1; }));
    return {dep, score: score + Math.random()*0.3};
  });
  puntuados.sort((a,b) => b.score - a.score);
  return puntuados.map(p => p.dep);
}

function generarLocalItinerario(data){
  const totalDias = computeDays(data.fechaInicio, data.fechaFin);

  // One department per day so distances stay realistic.
  let departamentosDelViaje;
  if(data.destino === "varias" || !PLACES[data.destino]){
    const ordenados = ordenarDepartamentosPorInteres(data);
    departamentosDelViaje = [];
    for(let i=0; i<totalDias; i++) departamentosDelViaje.push(ordenados[i % ordenados.length]);
  } else {
    departamentosDelViaje = new Array(totalDias).fill(data.destino);
  }

  const stopsPerDay = data.horasDia === "medio-dia" ? 3 : (data.ritmo === "intenso" ? 5 : (data.ritmo === "relajado" ? 3 : 4));
  const maxMinutosDia = data.horasDia === "medio-dia" ? 13*60 : 20*60;
  const personas = (parseInt(data.adultos)||1) + (parseInt(data.ninos)||0) * 0.6;

  const usados = new Set();
  const dias = [];

  for(let d = 0; d < totalDias; d++){
    const depto = departamentosDelViaje[d];
    const poolDepto = (PLACES[depto] || []).map(p => ({...p, departamento: depto}));
    const disponibles = poolDepto.filter(p => !usados.has(p.nombre));
    const baseElegibles = disponibles.length >= 2 ? disponibles : poolDepto;
    let elegidos = elegirLugares(baseElegibles, data, stopsPerDay);
    elegidos.forEach(p => usados.add(p.nombre));

    const climaInfo = CLIMA[depto] || CLIMA["San Salvador"];
    const comidasDepto = COMIDAS[depto] || COMIDAS["San Salvador"];

    const paradas = [];
    let minutosActuales = 8*60;
    let costoTransporte = 0, costoEntradas = 0, costoComidas = 0, kmRecorridos = 0;
    let prevCoord = null;

    for(let i = 0; i < elegidos.length; i++){
      const lugar = elegidos[i];
      let trasladoInfo = null;
      if(prevCoord){
        const dist = haversineKm(prevCoord.lat, prevCoord.lng, lugar.lat, lugar.lng);
        const traslado = estimarTraslado(dist, data.transporte);
        minutosActuales += traslado.minutos;
        costoTransporte += traslado.costo;
        kmRecorridos += dist;
        trasladoInfo = { minutos: traslado.minutos, costo: traslado.costo, km: Math.round(dist*10)/10 };
      } else if(data.transporte === "tourPrivado"){
        costoTransporte += 15; // flat daily rate for the private tour
      }

      if(minutosActuales > maxMinutosDia && paradas.filter(p=>!p.esComida).length >= 2){
        break;
      }

      if(minutosActuales >= 12*60 && minutosActuales < 13*60 + 30 && !paradas.some(pp=>pp.esComida)){
        const almuerzo = comidasDepto[0];
        const costoAlmuerzo = Math.round(almuerzo.costo * personas * 100)/100;
        paradas.push({
          hora: minutosAHora(minutosActuales), lugar: almuerzo.nombre, descripcion: almuerzo.descripcion,
          costo: "$"+costoAlmuerzo.toFixed(2), duracion: "45 min",
          tip: "A good chance to rest before continuing the day.",
          lat: lugar.lat, lng: lugar.lng, esComida:true
        });
        costoComidas += costoAlmuerzo;
        minutosActuales += 45;
      }

      const costoEntradaLugar = Math.round(lugar.costoEntrada * personas * 100)/100;
      costoEntradas += costoEntradaLugar;

      paradas.push({
        hora: minutosAHora(minutosActuales), lugar: lugar.nombre, descripcion: lugar.descripcion,
        costo: costoEntradaLugar > 0 ? "$"+costoEntradaLugar.toFixed(2) : "Free",
        duracion: lugar.duracionMin + " min", tip: lugar.tip, lat: lugar.lat, lng: lugar.lng,
        traslado: trasladoInfo
      });

      minutosActuales += lugar.duracionMin;
      prevCoord = {lat: lugar.lat, lng: lugar.lng};
    }

    if(minutosActuales >= 17*60 || data.horario === "nocturno"){
      if(minutosActuales < 18*60) minutosActuales = 18*60 + 30;
      if(minutosActuales > 22*60) minutosActuales = 21*60;
      const cena = comidasDepto[1] || comidasDepto[0];
      const costoCena = Math.round(cena.costo * personas * 100)/100;
      paradas.push({
        hora: minutosAHora(minutosActuales), lugar: cena.nombre, descripcion: cena.descripcion,
        costo: "$"+costoCena.toFixed(2), duracion: "1 h",
        tip: "A nice way to close out the day before heading back.",
        lat: (prevCoord||{}).lat, lng: (prevCoord||{}).lng, esComida:true
      });
      costoComidas += costoCena;
    }

    const totalDiaNum = costoTransporte + costoEntradas + costoComidas;
    const curiosidades = DATOS_CURIOSOS[depto] || [];
    dias.push({
      diaLabel: `Day ${d+1}`,
      fecha: fechaDeDia(data.fechaInicio, d),
      festividad: buscarFestividad(data.fechaInicio, d),
      clima: climaInfo.clima, temperatura: climaInfo.temperatura, ropaRecomendada: climaInfo.ropa,
      departamento: depto,
      datoCurioso: curiosidades.length ? curiosidades[d % curiosidades.length] : null,
      consejoDia: CONSEJOS_GENERALES[d % CONSEJOS_GENERALES.length],
      kmRecorridos: Math.round(kmRecorridos*10)/10,
      paradas,
      resumenGastos: [
        {concepto:"Transporte", costo:"$"+costoTransporte.toFixed(2)},
        {concepto:"Entradas", costo:"$"+costoEntradas.toFixed(2)},
        {concepto:"Comidas", costo:"$"+costoComidas.toFixed(2)}
      ],
      totalDia: "$"+totalDiaNum.toFixed(2)
    });
  }

  return {data, dias, totalDias};
}

function generarChecklist(data, dias){
  const items = [];
  const add = (t) => { if(!items.includes(t)) items.push(t); };
  add("ID card or passport");
  add("Cash in US dollars (the official currency of El Salvador)");
  const intereses = data.intereses || [];
  if(intereses.includes("playas")){ add("Swimsuit"); add("Sunscreen"); add("Sandals"); }
  if(intereses.includes("aventura") || intereses.includes("naturaleza")){ add("Closed-toe or hiking shoes"); add("Insect repellent"); }
  if(intereses.includes("fotografia")) add("Camera or phone with free battery/storage");
  if(dias.some(d => parseInt(d.temperatura) < 23)) add("A light jacket or coat for cool mountain weather");
  if((parseInt(data.ninos)||0) > 0) add("Snacks and entertainment for the kids");
  if(data.accesibilidad) add("Mobility equipment based on your needs");
  if(data.restricciones) add("Snacks that fit your dietary restrictions, just in case");
  if(data.seguroViaje !== "si") add("Consider getting travel insurance before you go");
  add("Reusable water bottle");
  add("Power bank or portable charger");
  return items;
}

function generarItinerario(){
  if(!validateStep(current)) return;
  formError.style.display = 'none';
  document.getElementById('btnNext').disabled = true;

  const mensajes = ['Reading your preferences…', 'Picking the best places…', 'Calculating routes and budget…', 'Adding the finishing touches…'];
  let paso = 0;
  setLoading(true, mensajes[0]);
  const intervalo = __interval(() => { paso = (paso+1) % mensajes.length; setLoading(true, mensajes[paso]); }, 450);

  // A short pause so the user can see the process (the actual generation is instant).
  setTimeout(() => {
    clearInterval(intervalo);
    try{
      const data = getFormData();
      itinerarioActual = generarLocalItinerario(data);
      renderResultado(itinerarioActual);
      document.getElementById('formView').style.display = 'none';
      document.getElementById('resultView').style.display = 'block';
      window.scrollTo({top:0, behavior:'smooth'});
    } catch(err){
      console.error(err);
      formError.textContent = 'We couldn\'t generate the itinerary (' + err.message + '). Please try again.';
      formError.style.display = 'block';
      formError.scrollIntoView({behavior:'smooth'});
    } finally {
      setLoading(false);
      document.getElementById('btnNext').disabled = false;
    }

    // -----------------------------------------------------------------
    // Want itineraries generated by real AI instead of this rules-based
    // engine? Replace the "try" block above with a call to your own
    // backend (never expose your OpenAI/Claude API key from the
    // browser), for example:
    //
    // fetch('https://your-backend.com/generate-itinerary', {
    //   method: 'POST', headers: {'Content-Type':'application/json'},
    //   body: JSON.stringify(data)
    // }).then(r => r.json()).then(result => { ...renderResultado(result)... });
    // -----------------------------------------------------------------
  }, 1400);
}

/* =========================================================================
   RESULT RENDERING: carousel, day tabs, map, budget
   ========================================================================= */
function renderResultado(itinerario){
  const { data, dias } = itinerario;
  document.getElementById('resTitulo').textContent = `Full Itinerary: ${data.destino || 'El Salvador'}`;
  document.getElementById('resSub').textContent = `${data.fechaInicio || ''} → ${data.fechaFin || ''} · ${dias.length} day(s) · ${data.adultos || 1} adult(s), ${data.ninos || 0} child(ren)`;

  const badges = document.getElementById('resBadges');
  badges.innerHTML = '';
  const badgeVals = [dias[0]?.clima, dias[0]?.temperatura, data.ritmo, data.alojamiento].filter(Boolean);
  badgeVals.forEach(v => {
    const b = document.createElement('span'); b.className='result-badge'; b.textContent = v; badges.appendChild(b);
  });

  // Special occasion banner
  const ocasionBanner = document.getElementById('ocasionBanner');
  if(data.ocasion && MENSAJES_OCASION[data.ocasion]){
    ocasionBanner.style.display = 'block';
    ocasionBanner.textContent = MENSAJES_OCASION[data.ocasion];
  } else {
    ocasionBanner.style.display = 'none';
  }

  // Executive summary (stats)
  const totalLugares = dias.reduce((acc,d) => acc + (d.paradas||[]).filter(p=>!p.esComida).length, 0);
  const totalKm = dias.reduce((acc,d) => acc + (d.kmRecorridos||0), 0);
  const totalGastoNum = dias.reduce((acc,d) => acc + parseFloat((d.totalDia||'0').replace(/[^0-9.]/g,'')), 0);
  const climaFrecuente = dias[0]?.temperatura || '—';
  const stats = document.getElementById('statsBar');
  stats.innerHTML = `
    <div class="stat-card"><div class="num">${dias.length}</div><div class="lab">Day(s)</div></div>
    <div class="stat-card"><div class="num">${totalLugares}</div><div class="lab">Places</div></div>
    <div class="stat-card"><div class="num">${totalKm.toFixed(0)} km</div><div class="lab">Traveled</div></div>
    <div class="stat-card"><div class="num">$${totalGastoNum.toFixed(0)}</div><div class="lab">Est. spend</div></div>
  `;

  // Carousel
  const track = document.getElementById('carouselTrack');
  track.innerHTML = '';
  let idx = 0;
  dias.forEach((dia, di) => {
    (dia.paradas || []).filter(p=>!p.esComida).slice(0,4).forEach(p => {
      const card = document.createElement('div');
      card.className = 'carousel-card';
      card.innerHTML = `<div class="tag">Day ${di+1} · ${p.hora || ''}</div><div>${p.lugar || ''}</div>`;
      track.appendChild(card);
      idx++;
    });
  });

  // Day tabs
  const tabs = document.getElementById('dayTabs');
  tabs.innerHTML = '';
  dias.forEach((dia, i) => {
    const tab = document.createElement('button');
    tab.className = 'day-tab' + (i === 0 ? ' active' : '');
    tab.textContent = dia.diaLabel || `Day ${i+1}`;
    tab.addEventListener('click', () => {
      document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderDia(i);
    });
    tabs.appendChild(tab);
  });

  renderDia(0);
  renderPresupuestoTotal(dias);

  // "What to bring" checklist
  const checklistUl = document.getElementById('checklistUl');
  checklistUl.innerHTML = '';
  generarChecklist(data, dias).forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<input type="checkbox"> <span>${item}</span>`;
    checklistUl.appendChild(li);
  });

  // Additional alerts (travel insurance and tour guide)
  const alerts = document.getElementById('extraAlerts');
  alerts.innerHTML = '';
  if(data.seguroViaje !== 'si'){
    alerts.innerHTML += `<div class="alert-card warn">⚠️ <div>You didn't mark having travel insurance. We recommend getting some before you leave, especially if your trip includes adventure activities.</div></div>`;
  }
  if(data.guiaTuristico === 'si'){
    alerts.innerHTML += `<div class="alert-card info">🧭 <div>You asked to include a tour guide. Reach out via the "Join the Talapo plan" button and we'll connect you with certified guides in your area.</div></div>`;
  }
  if(ALOJAMIENTO_TIPS[data.alojamiento]){
    alerts.innerHTML += `<div class="alert-card info">🏨 <div>${ALOJAMIENTO_TIPS[data.alojamiento]}</div></div>`;
  }
}

function renderDia(index){
  const dia = itinerarioActual.dias[index];
  const data = itinerarioActual.data;
  const content = document.getElementById('dayContent');
  content.innerHTML = '';

  const meta = document.createElement('div');
  meta.className = 'day-meta';
  meta.innerHTML = `
    <div class="meta-chip"><b>Date</b>${dia.fecha || '—'}</div>
    <div class="meta-chip"><b>Holiday</b>${dia.festividad || 'None'}</div>
    <div class="meta-chip"><b>Weather</b>${dia.clima || '—'} · ${dia.temperatura || ''}</div>
    <div class="meta-chip"><b>Recommended clothing</b>${dia.ropaRecomendada || '—'}</div>
  `;
  content.appendChild(meta);

  // Fun fact + tip of the day
  const extras = document.getElementById('dayExtras');
  extras.innerHTML = '';
  if(dia.datoCurioso){
    extras.innerHTML += `<div class="day-extra-card"><b>💡 Did you know?</b>${dia.datoCurioso}</div>`;
  }
  if(dia.consejoDia){
    extras.innerHTML += `<div class="day-extra-card"><b>🛟 Tip of the day</b>${dia.consejoDia}</div>`;
  }

  const icono = iconoTransporte(data.transporte);
  (dia.paradas || []).forEach(p => {
    if(p.traslado){
      const t = document.createElement('div');
      t.className = 'traslado-row';
      t.innerHTML = `<span class="line"></span> ${icono} ${p.traslado.minutos} min · $${p.traslado.costo.toFixed(2)} · ${p.traslado.km} km to get here`;
      content.appendChild(t);
    }
    const card = document.createElement('div');
    card.className = 'stop-card';
    card.innerHTML = `
      <div class="stop-time">${p.hora || ''}</div>
      <div class="stop-body">
        <h3>📍 ${p.lugar || ''}</h3>
        <p>${p.descripcion || ''}</p>
        <div class="stop-meta-row">
          ${p.costo ? `<span>💲 ${p.costo}</span>` : ''}
          ${p.duracion ? `<span>⏱️ ${p.duracion}</span>` : ''}
        </div>
        ${p.tip ? `<div class="stop-tip">💡 ${p.tip}</div>` : ''}
      </div>
    `;
    content.appendChild(card);
  });

  if(dia.kmRecorridos != null){
    const resumenDia = document.createElement('div');
    resumenDia.className = 'day-extra-card';
    resumenDia.innerHTML = `<b>📊 Day summary</b>${dia.kmRecorridos} km traveled · Estimated spend ${dia.totalDia}`;
    content.appendChild(resumenDia);
  }

  renderMapa(dia);
}

let lastBounds = null;
function refitMap(){
  if(!mapInstance) return;
  mapInstance.invalidateSize();
  if(lastBounds) mapInstance.fitBounds(lastBounds, { padding: [30,30], maxZoom: 14 });
}
function renderMapa(dia){
  const paradas = (dia.paradas || []).filter(p => typeof p.lat === 'number' && typeof p.lng === 'number');
  const el = document.getElementById('map');
  if(!mapInstance){
    mapInstance = L.map(el, { scrollWheelZoom: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    }).addTo(mapInstance);
    // ARREGLO: el mapa se creaba con su recuadro escondido y quedaba gris.
    // Ahora se vuelve a medir cada vez que el recuadro aparece o cambia de tamaño.
    if('ResizeObserver' in window){
      const ro = new ResizeObserver(() => refitMap());
      ro.observe(el);
    }
  }
  mapInstance.eachLayer(layer => { if(layer instanceof L.Marker || layer instanceof L.Polyline) mapInstance.removeLayer(layer); });

  if(!paradas.length){
    lastBounds = null;
    mapInstance.setView([13.6929, -89.2182], 9);
    setTimeout(refitMap, 150);
    return;
  }
  const latlngs = paradas.map(p => [p.lat, p.lng]);
  paradas.forEach((p, i) => {
    L.marker([p.lat, p.lng]).addTo(mapInstance)
      .bindPopup(`<b>${i+1}. ${p.lugar || ''}</b><br>${p.hora || ''}<br><a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener">Go here →</a>`);
  });
  L.polyline(latlngs, { color: '#3C91E6', weight: 3, dashArray: '6,8' }).addTo(mapInstance);
  lastBounds = L.latLngBounds(latlngs);
  mapInstance.fitBounds(lastBounds, { padding: [30,30], maxZoom: 14 });
  // cuando el resultado termina de mostrarse, se vuelve a medir
  setTimeout(refitMap, 150);
  setTimeout(refitMap, 600);
}

function renderPresupuestoTotal(dias){
  const body = document.getElementById('budgetBody');
  body.innerHTML = '';
  const totales = {};
  let granTotal = 0;
  dias.forEach(dia => {
    (dia.resumenGastos || []).forEach(item => {
      const val = parseFloat((item.costo || '0').replace(/[^0-9.]/g,'')) || 0;
      totales[item.concepto] = (totales[item.concepto] || 0) + val;
    });
  });
  Object.entries(totales).forEach(([concepto, val]) => {
    granTotal += val;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${concepto}</td><td style="text-align:right;">$${val.toFixed(2)}</td>`;
    body.appendChild(tr);
  });
  const trTotal = document.createElement('tr');
  trTotal.className = 'budget-total-row';
  trTotal.innerHTML = `<td>Estimated total</td><td style="text-align:right;">$${granTotal.toFixed(2)}</td>`;
  body.appendChild(trTotal);

  const presupuestoUsuario = parseFloat(itinerarioActual.data.presupuesto) || 0;
  const diferencia = presupuestoUsuario - granTotal;
  const note = document.getElementById('budgetNote');
  if(diferencia >= 0){
    note.textContent = `➡️ You have about $${diferencia.toFixed(2)} left in your budget for extras or souvenirs.`;
  } else {
    note.textContent = `⚠️ This itinerary goes over your budget by about $${Math.abs(diferencia).toFixed(2)}. You can edit your preferences to adjust it.`;
  }
}

/* =========================================================================
   CAROUSEL, PDF, BOOKINGS, EDIT, TALAPO PLAN
   ========================================================================= */
document.getElementById('carouselPrev').addEventListener('click', () => {
  document.getElementById('carouselTrack').scrollBy({left:-170, behavior:'smooth'});
});
document.getElementById('carouselNext').addEventListener('click', () => {
  document.getElementById('carouselTrack').scrollBy({left:170, behavior:'smooth'});
});

document.getElementById('btnEditar').addEventListener('click', () => {
  document.getElementById('resultView').style.display = 'none';
  document.getElementById('formView').style.display = 'block';
  current = total - 1;
  showStep(current);
});

document.getElementById('btnRegenerar').addEventListener('click', () => {
  if(!itinerarioActual) return;
  itinerarioActual = generarLocalItinerario(itinerarioActual.data);
  renderResultado(itinerarioActual);
  window.scrollTo({top:0, behavior:'smooth'});
});

document.getElementById('btnPDF').addEventListener('click', () => window.print());

document.getElementById('btnReservas').addEventListener('click', () => {
  // TODO: replace with your real booking flow (backend, WhatsApp Business API, etc.)
  const mensaje = encodeURIComponent(`Hi Talapo, I'd like to make my reservations for the itinerary in ${itinerarioActual?.data?.destino || 'El Salvador'}.`);
  window.open(`https://wa.me/50370000000?text=${mensaje}`, '_blank');
});

document.getElementById('btnCompartir').addEventListener('click', async () => {
  if(!itinerarioActual) return;
  const { data, dias } = itinerarioActual;
  const resumen = dias.map(d => `${d.diaLabel} (${d.fecha}): ` + d.paradas.filter(p=>!p.esComida).map(p=>p.lugar).join(', ')).join('\n');
  const texto = `My Talapo.sv itinerary in ${data.destino || 'El Salvador'}:\n${resumen}\n\nGenerated with talapo.sv`;
  if(navigator.share){
    try{ await navigator.share({ title: 'My Talapo.sv itinerary', text: texto }); } catch(e){ /* cancelled by user */ }
  } else if(navigator.clipboard){
    await navigator.clipboard.writeText(texto);
    alert('Itinerary copied to clipboard. You can now paste it anywhere!');
  } else {
    alert(texto);
  }
});

document.getElementById('btnPlan').addEventListener('click', () => {
  // Adjust this path to match your existing page's real name/location
  window.location.href = '/planes';
});

showStep(current);

;


/* ================= NUEVO: guardar este itinerario en InsForge (tabla itineraries) ================= */
const PENDING_PLAN_KEY = 'talapo_pending_plan';
let itinerarioGuardadoId = null;

function paradasDelPlan(it){
  // todas las paradas de todos los días, en orden, con el formato que usa "Mis itinerarios"
  const stops = [];
  it.dias.forEach((dia, d) => (dia.paradas || []).forEach((p) => {
    if (p.lat == null || p.lng == null) return;
    stops.push({ id: `d${d + 1}-${stops.length}`, name: p.lugar, place: `${dia.diaLabel} · ${dia.departamento || ''}`.trim(),
                 lat: p.lat, lng: p.lng, time: p.hora, day: d + 1 });
  }));
  return stops;
}

async function guardarItinerario(){
  if(!itinerarioActual) return;
  const btn = document.getElementById('btnGuardarItinerario');
  if(!__talapo.user()){
    sessionStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(itinerarioActual));
    __talapo.requireLogin('Sign in to save your itinerary — it will be waiting for you');
    return;
  }
  const it = itinerarioActual;
  const stops = paradasDelPlan(it);
  const km = it.dias.reduce((a, d) => a + (Number(d.kmRecorridos) || 0), 0);
  const title = `${(it.data.destino && it.data.destino !== 'varias') ? it.data.destino : 'El Salvador'} · ${it.dias.length} day(s)`;
  btn.disabled = true; btn.textContent = '⏳ Saving…';
  const row = {
    user_id: __talapo.user().id,
    source: 'planner',
    title,
    start_label: it.data.destino || 'El Salvador',
    start_lat: stops[0]?.lat ?? null, start_lng: stops[0]?.lng ?? null,
    stops, details: it,
    distance_km: Math.round(km * 10) / 10,
  };
  const req = itinerarioGuardadoId
    ? __talapo.db.from('itineraries').update(row).eq('id', itinerarioGuardadoId).select()
    : __talapo.db.from('itineraries').insert([row]).select();
  const { data, error } = await req;
  btn.disabled = false;
  if(error){ btn.textContent = '💾 Save to my itineraries'; __talapo.toast(error.message || 'Could not save', 'error'); return; }
  itinerarioGuardadoId = data[0].id;
  btn.textContent = '✅ Saved in my itineraries';
  __talapo.toast('Itinerary saved to your passport ✈️');
}
__listen(document.getElementById('btnGuardarItinerario'), 'click', guardarItinerario);

// Al generar otra versión, el botón vuelve a "guardar como nuevo"
const __regen = document.getElementById('btnRegenerar');
if (__regen) __listen(__regen, 'click', () => {
  itinerarioGuardadoId = null;
  const b = document.getElementById('btnGuardarItinerario'); if (b) b.textContent = '💾 Save to my itineraries';
});

function mostrarItinerarioGuardado(it, id){
  itinerarioActual = it;
  itinerarioGuardadoId = id || null;
  renderResultado(itinerarioActual);
  document.getElementById('formView').style.display = 'none';
  document.getElementById('resultView').style.display = 'block';
  if (id) document.getElementById('btnGuardarItinerario').textContent = '✅ Saved in my itineraries';
}

// Abrir uno guardado (/talapo-itinerario?itinerary=<id>) o recuperar el pendiente tras el login
__ready(async () => {
  const params = new URLSearchParams(location.search);
  if (params.get('itinerary') && __talapo.user()) {
    const { data } = await __talapo.db.from('itineraries').select('*').eq('id', params.get('itinerary')).limit(1);
    if (data && data[0] && data[0].details) mostrarItinerarioGuardado(data[0].details, data[0].id);
  } else if (sessionStorage.getItem(PENDING_PLAN_KEY) && __talapo.user()) {
    const it = JSON.parse(sessionStorage.getItem(PENDING_PLAN_KEY));
    sessionStorage.removeItem(PENDING_PLAN_KEY);
    mostrarItinerarioGuardado(it, null);
    guardarItinerario();
  }
});
if (typeof __onload === "function") __ready(__onload);
