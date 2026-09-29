/* eslint-disable */
// Código original de components/tours.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;

  // If the primary CDN (jsdelivr) is blocked or fails, retry once from cdnjs.
  window.__loadLeafletFallback = function(){
    if(window.__leafletFallbackTried) return;
    window.__leafletFallbackTried = true;
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(css);
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
    s.onload = function(){ window.__leafletLoaded = true; if(window.__retryMapInit) window.__retryMapInit(); };
    document.head.appendChild(s);
  };

;

/* ================= DATA ================= */
const destinos = [
  // Ahuachapán
  {id:'ataco', nombre:'Concepción de Ataco', depto:'ahuachapan', deptoLabel:'Flower Route, Ahuachapán', rating:5, lat:13.8724, lng:-89.8244, tag:'Picturesque town', cat:'nature', duracion:'Half day', desc:'Cobblestone streets, colorful murals, and surrounding coffee plantations. Ideal for a leisurely walk, buying handicrafts, and eating local food at the weekend market.', img:'/assets/img/tours/ataco.jpg'},
  {id:'apaneca', nombre:'Apaneca', depto:'ahuachapan', deptoLabel:'Flower Route, Ahuachapán', rating:4, lat:13.8494, lng:-89.7994, tag:'Coffee-growing town', cat:'nature', duracion:'Half day', desc:'The highest town in El Salvador, surrounded by coffee farms. A great starting point for ziplining, horseback riding, and mountain viewpoints.', img:'/assets/img/tours/apaneca.jpg'},
  {id:'ausoles', nombre:'Los Ausoles', depto:'ahuachapan', deptoLabel:'Ahuachapán', rating:4, lat:13.9214, lng:-89.8453, tag:'Hot springs', cat:'volcano', duracion:'2-3 hours', desc:'Fumaroles and hot spring pools of volcanic origin. A curious look at the geothermal energy that powers part of the country.', img:'/assets/img/tours/los auseles.jpg'},
  // Santa Ana
  {id:'casablanca', nombre:'Casa Blanca', depto:'santa-ana', deptoLabel:'Chalchuapa, Santa Ana', rating:4, lat:13.9897, lng:-89.6803, tag:'Archaeological site', cat:'nature', duracion:'2 hours', desc:'Mayan archaeological complex featuring obsidian workshops and a botanical garden. Site museum included with admission.', img:'/assets/img/tours/casa blanca chalchuapa.jpg'},
  {id:'cerroverde', nombre:'Cerro Verde', depto:'santa-ana', deptoLabel:'Santa Ana', rating:5, lat:13.8404, lng:-89.6316, tag:'National park', cat:'volcano', duracion:'Half day', desc:'Starting point for climbing Ilamatepec, featuring viewpoints overlooking the Izalco crater and Lake Coatepeque. Short trails suitable for the whole family.', img:'/assets/img/tours/cerro verde.jpg'},
  {id:'ilamatepec', nombre:'Ilamatepec', depto:'santa-ana', deptoLabel:'Santa Ana Volcano', rating:5, lat:13.8536, lng:-89.6303, tag:'Active volcano', cat:'volcano', duracion:'4-5 hours', desc:'The highest volcano in the country, featuring a turquoise lagoon in its crater. The hike is demanding, but the view from the top makes it all worth it.', img:'/assets/img/tours/ilamatepec.jpg'},
  {id:'catedralsa', nombre:'Santa Ana Cathedral', depto:'santa-ana', deptoLabel:'Downtown, Santa Ana', rating:5, lat:13.9946, lng:-89.5597, tag:'Gothic architecture', cat:'colonial', duracion:'1 hour', desc:'One of the most photographed Gothic facades in Central America, located right across from the Santa Ana Theater. Ideal to combine with a coffee in the historic center.', img:'/assets/img/tours/catedral.jpg'},
  // Sonsonate
  {id:'cobanos', nombre:'Los Cóbanos', depto:'sonsonate', deptoLabel:'Sonsonate', rating:5, lat:13.5194, lng:-89.7969, tag:'Coral reef', cat:'beach', duracion:'Half day', desc:'El Salvador\'s only living coral reef. A great spot for snorkeling, diving, and whale watching in season.', img:'/assets/img/tours/cobanos.jpg'},
  {id:'atecozol', nombre:'Atecozol Park', depto:'sonsonate', deptoLabel:'Izalco, Sonsonate', rating:4, lat:13.5333, lng:-89.7167, tag:'Forest and pools', cat:'nature', duracion:'2-3 hours', desc:'A forest of century-old kapok trees with natural pools, perfect for a relaxing family break near the coast.', img:'/assets/img/tours/atecosol.jpg'},
  {id:'izalco', nombre:'Izalco Volcano', depto:'sonsonate', deptoLabel:'Sonsonate', rating:5, lat:13.8149, lng:-89.6333, tag:'Lighthouse of the Pacific', cat:'volcano', duracion:'4 hours', desc:'Known as "The Lighthouse of the Pacific" due to its former continuous activity that guided ships at sea. Almost perfect cone, visible from Cerro Verde.', img:'/assets/img/tours/izalco.jpg'},
  // Chalatenango
  {id:'lapalma', nombre:'La Palma', depto:'chalatenango', deptoLabel:'Chalatenango', rating:5, lat:14.3167, lng:-89.1667, tag:'Naïve art', cat:'nature', duracion:'Half day', desc:'Birthplace of Salvadoran naïve art: walls, buses, and workshops painted in vivid colors by local artisans.', img:'/assets/img/tours/la palma.jpg'},
  {id:'elpital', nombre:'Cerro El Pital', depto:'chalatenango', deptoLabel:'Chalatenango', rating:5, lat:14.3897, lng:-89.1936, tag:'Highest point in the country', cat:'nature', duracion:'Full day', desc:'At 2,730 meters above sea level, it is the highest point in El Salvador. Cold climate, cloud forest, and views extending to Honduras on clear days.', img:'/assets/img/tours/pital.jpg'},
  // La Libertad
  {id:'eltunco', nombre:'El Tunco Beach', depto:'la-libertad', deptoLabel:'La Libertad', rating:5, lat:13.4939, lng:-89.3831, tag:'Surf and sunsets', cat:'beach', duracion:'Half day', desc:'The most famous surf beach in the country, featuring volcanic black sand, beachfront restaurants, and highly photographed sunsets.', img:'/assets/img/tours/el tunco.jpg'},
  {id:'joyaceren', nombre:'Joya de Cerén', depto:'la-libertad', deptoLabel:'La Libertad', rating:4, lat:13.8236, lng:-89.3606, tag:'UNESCO World Heritage', cat:'nature', duracion:'1-2 hours', desc:'Dubbed the "Pompeii of the Americas": an agricultural village buried by volcanic ash 1,400 years ago, surprisingly well preserved.', img:'/assets/img/tours/joya de ceren.jpg'},
  // San Salvador
  {id:'palacio', nombre:'National Palace', depto:'san-salvador', deptoLabel:'Historic Center, San Salvador', rating:4, lat:13.6980, lng:-89.1912, tag:'Historic heritage', cat:'colonial', duracion:'1-2 hours', desc:'Former seat of the Salvadoran government, featuring marble halls in four distinct architectural styles. Free guided tours available.', img:'/assets/img/tours/palacio nacional.jpg'},
  {id:'catedralss', nombre:'Metropolitan Cathedral', depto:'san-salvador', deptoLabel:'San Salvador', rating:4, lat:13.6989, lng:-89.1912, tag:'Historic center', cat:'colonial', duracion:'45 min', desc:'Facing Plaza Cívica, housing the crypt of Archbishop Óscar Romero. A central spot to explore the rest of the historic center on foot.', img:'/assets/img/tours/catedral metropolitana.jpg'},
  {id:'puertadiablo', nombre:'Puerta del Diablo', depto:'san-salvador', deptoLabel:'Panchimalco, San Salvador', rating:5, lat:13.6167, lng:-89.1667, tag:'Natural viewpoint', cat:'nature', duracion:'2 hours', desc:'Two giant split rock formations offering a panoramic view of the San Salvador valley. Very popular at sunrise.', img:'/assets/img/tours/puerta de diablo.jpg'},
  {id:'boqueron', nombre:'El Boquerón', depto:'san-salvador', deptoLabel:'San Salvador Volcano', rating:5, lat:13.7358, lng:-89.2842, tag:'Volcanic crater', cat:'volcano', duracion:'2-3 hours', desc:'A 1.5 km diameter crater with its own inner cone, "el boqueroncito." Accessible trail with views of the capital.', img:'/assets/img/tours/el boqueron.jpg'},
  // Cuscatlán
  {id:'suchitoto', nombre:'Suchitoto', depto:'cuscatlan', deptoLabel:'Cuscatlán', rating:5, lat:13.9386, lng:-89.0264, tag:'Colonial town', cat:'colonial', duracion:'Full day', desc:'Adobe houses, cobblestone streets, and a vibrant cultural scene: galleries, music, and the best pot-brewed coffee in the country by the lake.', img:'/assets/img/tours/suchitoto.jpg'},
  {id:'suchitlan', nombre:'Lake Suchitlán', depto:'cuscatlan', deptoLabel:'Cuscatlán', rating:4, lat:13.9700, lng:-89.0400, tag:'Boat ride', cat:'beach', duracion:'2-3 hours', desc:'The largest reservoir in the country. Boat tours among migratory bird islands, particularly beautiful at sunset.', img:'/assets/img/tours/lago suchitlan.jpg'},
  // La Paz
  {id:'costadelsol', nombre:'Costa del Sol', depto:'la-paz', deptoLabel:'La Paz', rating:4, lat:13.4167, lng:-88.9167, tag:'Family beach', cat:'beach', duracion:'Full day', desc:'A 14 km stretch of quiet beach with warm waters, ideal for families, situated between the ocean and the Jaltepeque estuary.', img:'/assets/img/tours/playo el sol.jpg'},
  // Cabañas
  {id:'cinquera', nombre:'Cinquera', depto:'cabanas', deptoLabel:'Cabañas', rating:4, lat:13.9236, lng:-88.9308, tag:'Forest and historical memory', cat:'nature', duracion:'3-4 hours', desc:'A forest regenerated after the civil war, featuring trails, small waterfalls, and a community museum of historical memory.', img:'/assets/img/tours/cinquera.jpg'},
  // San Vicente
  {id:'apastepeque', nombre:'Apastepeque Lagoon', depto:'san-vicente', deptoLabel:'San Vicente', rating:4, lat:13.6739, lng:-88.7761, tag:'Crater lagoon', cat:'beach', duracion:'2-3 hours', desc:'A crater lagoon with warm, deep waters, surrounded by lush vegetation. Great for swimming or simply relaxing.', img:'/assets/img/tours/apastepeque.jpg'},
  // Usulután
  {id:'alegria', nombre:'Alegría Lagoon', depto:'usulutan', deptoLabel:'Usulután', rating:5, lat:13.4956, lng:-88.4939, tag:'Sulfur lagoon', cat:'volcano', duracion:'2-3 hours', desc:'A turquoise sulfur lagoon inside a crater, located in one of the most colorful and cool towns in the eastern part of the country.', img:'/assets/img/tours/laguna de la alegria.jpg'},
  // San Miguel
  {id:'chaparrastique', nombre:'Chaparrastique Volcano', depto:'san-miguel', deptoLabel:'San Miguel', rating:4, lat:13.4342, lng:-88.2694, tag:'Active volcano', cat:'volcano', duracion:'4-5 hours', desc:'An iconic volcano in eastern El Salvador, featuring a wide crater and views extending to the Gulf of Fonseca on clear days.', img:'/assets/img/tours/chaparrastique.jpg'},
  // Morazán
  {id:'perquin', nombre:'Perquín', depto:'morazan', deptoLabel:'Morazán', rating:5, lat:13.9578, lng:-88.1697, tag:'History and mountains', cat:'nature', duracion:'Full day', desc:'A cool mountain town featuring the Museum of the Salvadoran Revolution and trails leading to El Mozote, a key place to understand the country\'s recent history.', img:'/assets/img/tours/perquin.jpg'},
  // La Unión
  {id:'conchagua', nombre:'Conchagua Volcano', depto:'la-union', deptoLabel:'La Unión', rating:4, lat:13.2833, lng:-87.7500, tag:'Gulf of Fonseca', cat:'beach', duracion:'3-4 hours', desc:'From its summit, you can see three countries at once: El Salvador, Honduras, and Nicaragua, bordering the islands of the Gulf of Fonseca.', img:'/assets/img/tours/conchagua.jpg'}
];

const departamentos = [
  {id:'all', label:'Todos'},
  {id:'ahuachapan', label:'Ahuachapán'},
  {id:'santa-ana', label:'Santa Ana'},
  {id:'sonsonate', label:'Sonsonate'},
  {id:'chalatenango', label:'Chalatenango'},
  {id:'la-libertad', label:'La Libertad'},
  {id:'san-salvador', label:'San Salvador'},
  {id:'cuscatlan', label:'Cuscatlán'},
  {id:'la-paz', label:'La Paz'},
  {id:'cabanas', label:'Cabañas'},
  {id:'san-vicente', label:'San Vicente'},
  {id:'usulutan', label:'Usulután'},
  {id:'san-miguel', label:'San Miguel'},
  {id:'morazan', label:'Morazán'},
  {id:'la-union', label:'La Unión'},
];

const tours = [
  {nombre:'Volcano Route', desc:'Ilamatepec, Cerro Verde and the Izalco viewpoint', dur:'6 h', cat:'volcano', img:'/assets/img/tours/Ruta de Volcanes.jpg'},
  {nombre:'Colonial Center', desc:'Cathedrals, plazas and historic architecture', cat:'colonial', dur:'4 h', img:'/assets/img/tours/Centro Colonial.jpg'},
  {nombre:'Balsam Coast', desc:'Reefs, sunsets and fishing villages', cat:'beach', dur:'8 h', img:'/assets/img/tours/Costa del Bálsamo.jpg'},
  {nombre:'Flower Route', desc:'Ataco, Apaneca and coffee towns', cat:'nature', dur:'7 h', img:'/assets/img/tours/Ruta de las Flores.jpg'},
  {nombre:'Deep East', desc:'Perquín, crater lagoons and the Gulf of Fonseca', cat:'nature', dur:'2 days', img:'/assets/img/tours/Oriente Profundo.jpg'},
];

/* ================= STATE ================= */
let selected = new Set();
let favorites = new Set();
let currentStep = 0;
const stepIds = ['paso-explorar','paso-seleccion','paso-partida','paso-ruta','paso-tours'];

/* ================= ICONS ================= */
const starSVG = (filled) => `<svg viewBox="0 0 20 20" class="${filled?'':'empty'}"><path d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L10 14.9 4.4 18.1l1.4-6.3L1 7.5l6.4-.6L10 1z"/></svg>`;
const heartSVG = `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2 4.6 5.8 4.1c2-.3 3.8.7 4.9 2.3 1.1-1.6 2.9-2.6 4.9-2.3 3.8.5 5.4 4.3 3.8 7.7C19.5 16.4 12 21 12 21z" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const plusSVG = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
const checkSVG = `<svg viewBox="0 0 24 24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5 11-11"/></svg>`;
const trashSVG = `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>`;

function sceneImg(img, label){
  // Si el destino/tour ya tiene una ruta de imagen en su campo "img", se muestra aquí.
  if(img){
    return `<img src="${img}" alt="${label}" loading="lazy">`;
  }
  // Si no hay imagen todavía, queda el espacio vacío listo para poner el código de la imagen, p. ej.:
  // <img src="/assets/img/destinos/${label}.jpg" alt="${label}">
  return '';
}

function starsRow(rating){
  let out = '';
  for(let i=0;i<5;i++) out += starSVG(i<rating);
  return `<div class="stars">${out}</div>`;
}

/* ================= RENDER: CHIPS ================= */
function renderChips(){
  const row = document.getElementById('chipRow');
  row.innerHTML = departamentos.map(d =>
    `<button class="chip ${d.id==='all'?'active':''}" data-depto="${d.id}">${d.label}</button>`
  ).join('');
  row.querySelectorAll('.chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      row.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      activeDepto = chip.dataset.depto;
      renderGrid();
    });
  });
}

/* ================= RENDER: GRID ================= */
let activeDepto = 'all';
let searchTerm = '';

function renderGrid(){
  const grid = document.getElementById('destGrid');
  let list = activeDepto==='all' ? destinos : destinos.filter(d=>d.depto===activeDepto);
  if(searchTerm){
    const q = searchTerm.toLowerCase();
    list = list.filter(d => d.nombre.toLowerCase().includes(q) || d.tag.toLowerCase().includes(q) || d.deptoLabel.toLowerCase().includes(q));
  }
  document.getElementById('resultsCount').textContent = `${list.length} destino${list.length===1?'':'s'} encontrado${list.length===1?'':'s'}`;
  if(list.length===0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">No places match that search. Try another term or clear the department filter.</div>`;
    return;
  }
  grid.innerHTML = list.map((d,i) => cardHTML(d,i)).join('');
  attachCardEvents();
}

function cardHTML(d,i){
  const isFav = favorites.has(d.id);
  const isSel = selected.has(d.id);
  return `
  <article class="card" data-id="${d.id}" style="animation-delay:${Math.min(i,8)*45}ms">
    <div class="card-scene">
      ${sceneImg(d.img, d.nombre)}
      <div class="card-actions">
        <button class="icon-btn fav ${isFav?'active':''}" data-action="fav" data-id="${d.id}" aria-label="Marcar ${d.nombre} como favorito">${heartSVG}</button>
        <button class="icon-btn add ${isSel?'active':''}" data-action="add" data-id="${d.id}" aria-label="Add ${d.nombre} to your tour">${isSel?checkSVG:plusSVG}</button>
      </div>
      <span class="card-tag">${d.tag}</span>
    </div>
    <div class="card-body">
      <span class="place-name">${d.nombre}</span>
      <span class="place-loc">${d.deptoLabel}</span>
      ${starsRow(d.rating)}
    </div>
  </article>`;
}

function attachCardEvents(){
  document.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('click', ()=> openDetail(card.dataset.id));
  });
  document.querySelectorAll('[data-action="fav"]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const id = btn.dataset.id;
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      btn.classList.toggle('active');
    });
  });
  document.querySelectorAll('[data-action="add"]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const id = btn.dataset.id;
      const d = destinos.find(x=>x.id===id);
      if(selected.has(id)){ selected.delete(id); }
      else { selected.add(id); }
      btn.classList.toggle('active');
      btn.innerHTML = selected.has(id) ? checkSVG : plusSVG;
      refreshCounts();
      renderSelection();
      if(d) showToast(selected.has(id) ? `Added to your route: ${d.nombre}` : `Removed from your route: ${d.nombre}`, !selected.has(id));
    });
  });
}

/* ================= RENDER: SELECTION (Paso 2) ================= */
function renderSelection(){
  const wrap = document.getElementById('selectionList');
  const chosen = destinos.filter(d=>selected.has(d.id));
  if(chosen.length===0){
    wrap.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">You haven't chosen a place yet. <a href="#paso-explorar" onclick="goToStep(0)">Explore destinations</a> and add them with the “+” button.</div>`;
  } else {
    wrap.innerHTML = chosen.map(d => `
      <div class="sel-card" data-id="${d.id}">
        <div class="card-scene">${sceneImg(d.img, d.nombre)}</div>
        <div class="sel-row">
          <div class="info"><b>${d.nombre}</b><span>${d.deptoLabel}</span></div>
          <button class="trash-btn" data-remove="${d.id}" aria-label="Remove ${d.nombre} from your route">${trashSVG}</button>
        </div>
      </div>`).join('');
    wrap.querySelectorAll('[data-remove]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.remove;
        const d = destinos.find(x=>x.id===id);
        selected.delete(id);
        refreshCounts();
        renderSelection();
        renderGrid();
        if(d) showToast(`Removed from your route: ${d.nombre}`, true);
      });
    });
  }
  document.getElementById('genRouteBtn').disabled = chosen.length===0;
}

function refreshCounts(){
  document.getElementById('countTop').textContent = selected.size;
  document.getElementById('selCountLabel').textContent = `${selected.size} place${selected.size===1?'':'s'} added`;
  document.getElementById('miniCount').textContent = selected.size;
  const cart = document.getElementById('miniCart');
  document.getElementById('miniCartText').textContent = `${selected.size} place${selected.size===1?'':'s'} · View route`;
  cart.classList.toggle('visible', selected.size>0 && currentStep<3);
}

/* ================= DETAIL PANEL ================= */
function openDetail(id){
  const d = destinos.find(x=>x.id===id);
  if(!d) return;
  document.getElementById('detailScene').innerHTML = sceneImg(d.img, d.nombre);
  document.getElementById('detailTag').textContent = d.tag;
  document.getElementById('detailName').textContent = d.nombre;
  document.getElementById('detailLoc').textContent = d.deptoLabel;
  document.getElementById('detailStars').innerHTML = starsRow(d.rating);
  document.getElementById('detailDesc').textContent = d.desc;
  document.getElementById('detailDur').textContent = d.duracion;
  document.getElementById('detailCoord').textContent = `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}`;

  const addBtn = document.getElementById('detailAddBtn');
  const favBtn = document.getElementById('detailFavBtn');
  const syncButtons = ()=>{
    const isSel = selected.has(d.id);
    const isFav = favorites.has(d.id);
    addBtn.innerHTML = isSel ? `${checkSVG} Added to your route` : `${plusSVG} Add to your route`;
    addBtn.classList.toggle('is-added', isSel);
    favBtn.innerHTML = `${heartSVG} <span>${isFav ? 'In favorites' : 'Favorite'}</span>`;
    favBtn.classList.toggle('active', isFav);
  };
  syncButtons();

  addBtn.onclick = ()=>{
    if(selected.has(d.id)){ selected.delete(d.id); showToast(`Removed from your route: ${d.nombre}`, true); }
    else { selected.add(d.id); showToast(`Added to your route: ${d.nombre}`); }
    refreshCounts(); renderSelection(); renderGrid(); syncButtons();
  };
  favBtn.onclick = ()=>{
    const nowFav = !favorites.has(d.id);
    nowFav ? favorites.add(d.id) : favorites.delete(d.id);
    syncButtons();
    renderGrid();
    showToast(nowFav ? `Added to favorites: ${d.nombre}` : `Removed from favorites: ${d.nombre}`, !nowFav);
  };

  document.getElementById('detailOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDetail(){
  document.getElementById('detailOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ================= HERO SEARCH (funcional) ================= */
function initHeroSearch(){
  const sel = document.getElementById('heroLocation');
  sel.innerHTML = departamentos.map(d =>
    `<option value="${d.id}">${d.id==='all' ? 'All of El Salvador' : d.label}</option>`
  ).join('');

  document.getElementById('heroSearchBtn').addEventListener('click', ()=>{
    const depto = sel.value;
    const dateVal = document.getElementById('heroDate').value;

    activeDepto = depto;
    document.querySelectorAll('#chipRow .chip').forEach(c=>{
      c.classList.toggle('active', c.dataset.depto === depto);
    });
    searchTerm = '';
    const searchInput = document.getElementById('searchInput');
    if(searchInput) searchInput.value = '';

    renderGrid();
    goToStep(0);

    const label = (departamentos.find(d=>d.id===depto) || {}).label || 'nationwide';
    const deptoText = depto === 'all' ? 'nationwide' : label;
    if(dateVal){
      const nice = new Date(dateVal + 'T00:00:00').toLocaleDateString('es-SV', {day:'numeric', month:'long'});
      showToast(`Showing destinations in ${deptoText} for ${nice}`);
    } else {
      showToast(`Showing destinations in ${deptoText}`);
    }
  });
}

/* ================= TOAST ================= */
function showToast(message, isRemove){
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = 'toast' + (isRemove ? ' remove' : '');
  el.innerHTML = `${isRemove ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5 11-11"/></svg>'} ${message}`;
  stack.appendChild(el);
  setTimeout(()=>{
    el.classList.add('leaving');
    setTimeout(()=> el.remove(), 220);
  }, 2200);
}

/* ================= RENDER: TOURS ================= */
function renderTours(){
  const grid = document.getElementById('toursGrid');
  grid.innerHTML = tours.map(t => `
    <div class="tour-card">
      ${sceneImg(t.img, t.nombre)}
      <div class="tour-info">
        <b>${t.nombre}</b>
        <span>${t.desc}</span><br>
        <span class="dur">${t.dur} · guía incluido</span>
      </div>
    </div>`).join('');
}

/* ================= TRAIL STEPPER ================= */
const nodePositions = [
  {x:30,y:40},{x:320,y:42},{x:560,y:40},{x:750,y:40},{x:970,y:32}
];
const stepIcons = [
  // Explorar — brújula
  '<path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke-linecap="round"/><circle cx="12" cy="12" r="8"/><path d="M14.5 9.5l-2 5-3 1.5 2-5 3-1.5z" fill="currentColor" stroke="none"/>',
  // Selección — corazón con check
  '<path d="M12 20s-6.5-4-8.5-8C2 8.5 3.5 5 7 5c2 0 3.5 1.2 5 3 1.5-1.8 3-3 5-3 3.5 0 5 3.5 3.5 7-2 4-8.5 8-8.5 8z"/>',
  // Punto de partida — pin
  '<path d="M12 21s-6-5.2-6-10.2C6 6.5 8.7 3.5 12 3.5s6 3 6 7.3C18 15.8 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
  // Ruta — camino con curva
  '<path d="M4 20c3-1 4-5 7-5s3 4 6 4 3-4 3-7" stroke-linecap="round"/><circle cx="4" cy="20" r="1.4" fill="currentColor" stroke="none"/><circle cx="20" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  // Tours — bandera
  '<path d="M6 21V4" stroke-linecap="round"/><path d="M6 4h12l-3 4 3 4H6"/>',
];
function renderTrailNodes(){
  const g = document.getElementById('trailNodes');
  g.innerHTML = nodePositions.map((p,i)=>`
    <g class="trail-node" data-step="${i}" transform="translate(${p.x},${p.y})">
      <circle class="ring" r="15"></circle>
      <svg class="node-icon" x="-8" y="-8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">${stepIcons[i]}</svg>
    </g>`).join('');
  g.querySelectorAll('.trail-node').forEach(n=>{
    n.addEventListener('click', ()=>goToStep(parseInt(n.dataset.step)));
  });
}

function updateTrail(step){
  currentStep = step;
  document.querySelectorAll('.trail-node').forEach((n,i)=>{
    n.classList.toggle('active', i===step);
    n.classList.toggle('done', i<step);
  });
  document.querySelectorAll('#trailLabels span').forEach((s,i)=>{
    s.classList.toggle('active', i===step);
  });
  const path = document.getElementById('trailProgress');
  const total = path.getTotalLength();
  const frac = step/(nodePositions.length-1);
  path.style.strokeDasharray = total;
  path.style.strokeDashoffset = total * (1-frac);
  if(typeof refreshCounts === 'function') refreshCounts();
}

function goToStep(step){
  const el = document.getElementById(stepIds[step]);
  updateTrail(step);
  el.scrollIntoView({behavior:'smooth', block:'start'});
}

/* observe scroll to sync trail with visible section */
function initScrollSync(){
  const opts = {rootMargin:'-160px 0px -55% 0px', threshold:0};
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const idx = stepIds.indexOf(e.target.id);
        if(idx>-1) updateTrail(idx);
      }
    });
  }, opts);
  stepIds.forEach(id => obs.observe(document.getElementById(id)));
}

/* ================= MAPS ================= */
let mapStart, startMarker, mapRoute;

// Mapas SIN clave: OpenStreetMap como principal y OSM Humanitarian como respaldo.
// (CARTO ahora exige API key y mostraba "API KEY REQUIRED" sobre el mapa.)
function addResilientTiles(map){
  const primary = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 19
  });
  let fellBack = false;
  primary.on('tileerror', ()=>{
    if(fellBack) return;
    fellBack = true;
    map.removeLayer(primary);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors, Humanitarian OSM', maxZoom: 19
    }).addTo(map);
  });
  primary.addTo(map);
}

function showMapError(containerId, message){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;background:var(--sand-100);color:var(--ink-600);font-size:.88rem;">${message}</div>`;
}

function initStartMap(){
  if(typeof L === 'undefined'){
    // Leaflet hasn't finished loading yet (slow network or first CDN failing over
    // to the backup). Show a friendly loading state and retry automatically
    // as soon as the library becomes available — no page reload needed.
    showMapError('map-start', 'Loading map…');
    window.__retryMapInit = initStartMap;
    return;
  }
  window.__retryMapInit = null;
  const latEl = document.getElementById('lat');
  const lngEl = document.getElementById('lng');
  const initLat = parseFloat(latEl.value);
  const initLng = parseFloat(lngEl.value);

  mapStart = L.map('map-start', {zoomControl:true}).setView([initLat, initLng], 13);
  addResilientTiles(mapStart);

  startMarker = L.marker([initLat, initLng], {draggable:true}).addTo(mapStart);

  function syncFromMarker(latlng){
    latEl.value = latlng.lat.toFixed(8);
    lngEl.value = latlng.lng.toFixed(8);
  }
  startMarker.on('dragend', ()=> syncFromMarker(startMarker.getLatLng()));
  mapStart.on('click', (e)=>{
    startMarker.setLatLng(e.latlng);
    syncFromMarker(e.latlng);
  });
  [latEl,lngEl].forEach(inp=>{
    inp.addEventListener('change', ()=>{
      const la = parseFloat(latEl.value), ln = parseFloat(lngEl.value);
      if(!isNaN(la) && !isNaN(ln)){
        startMarker.setLatLng([la,ln]);
        mapStart.panTo([la,ln]);
      }
    });
  });

  // Guard against Leaflet mis-measuring its container on first paint
  // (common when fonts/layout settle a moment after the map is created).
  setTimeout(()=> mapStart && mapStart.invalidateSize(), 250);
  __ready( ()=> mapStart && mapStart.invalidateSize());
  __listen(window, 'resize', ()=> mapStart && mapStart.invalidateSize());
}

// Watchdog: if after 12s Leaflet still hasn't loaded (both CDNs failing —
// most likely the network itself is blocking these domains), show a clear
// message instead of an endless loading state.
setTimeout(()=>{
  if(typeof L === 'undefined'){
    showMapError('map-start', 'The map could not load. Check your internet connection and refresh the page.');
  }
}, 12000);

function numberedIcon(n, isStart){
  return L.divIcon({
    className:'',
    html:`<div style="width:28px;height:28px;border-radius:50%;background:${isStart?'#16324F':'#E8834A'};color:#fff;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:12px;box-shadow:0 6px 14px -6px rgba(11,31,51,.5);border:2px solid #fff;">${n}</div>`,
    iconSize:[28,28], iconAnchor:[14,14]
  });
}

function haversine(a,b){
  const R=6371, toRad = x=>x*Math.PI/180;
  const dLat = toRad(b.lat-a.lat), dLng = toRad(b.lng-a.lng);
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}

async function buildRoute(){
  const chosen = destinos.filter(d=>selected.has(d.id));
  if(chosen.length===0){ goToStep(0); return; }

  if(typeof L === 'undefined'){
    showMapError('map-route', 'The map could not load. Check your internet connection and refresh the page.');
    goToStep(3);
    return;
  }

  const startLat = parseFloat(document.getElementById('lat').value);
  const startLng = parseFloat(document.getElementById('lng').value);
  const points = [{lat:startLat,lng:startLng,nombre:'My location'}, ...chosen];

  goToStep(3);

  if(!mapRoute){
    mapRoute = L.map('map-route').setView([startLat,startLng], 10);
    addResilientTiles(mapRoute);
  } else {
    mapRoute.eachLayer(l => { if(!(l instanceof L.TileLayer)) mapRoute.removeLayer(l); });
  }

  const markers = L.featureGroup().addTo(mapRoute);
  points.forEach((p,i)=>{
    L.marker([p.lat,p.lng], {icon: numberedIcon(i+1, i===0)})
      .addTo(markers)
      .bindPopup(`<b>${p.nombre}</b>`);
  });
  mapRoute.fitBounds(markers.getBounds().pad(0.3));

  document.getElementById('routeLegend').innerHTML = points.map((p,i)=>
    `<div class="leg"><span class="leg-pin">${i+1}</span>${p.nombre}</div>`
  ).join('');

  document.getElementById('routeTime').textContent = 'Calculating…';
  document.getElementById('routeDist').textContent = 'Calculating…';

  try{
    const coordStr = points.map(p=>`${p.lng},${p.lat}`).join(';');
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 8000); // don't hang if OSRM is unreachable
    const resp = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`, {signal: controller.signal});
    clearTimeout(timeout);
    const data = await resp.json();
    if(data.code==='Ok'){
      const route = data.routes[0];
      const latlngs = route.geometry.coordinates.map(c=>[c[1],c[0]]);
      L.polyline(latlngs, {color:'#3E7CB1', weight:5, opacity:.9}).addTo(mapRoute);
      const hrs = route.duration/3600;
      const h = Math.floor(hrs), m = Math.round((hrs-h)*60);
      document.getElementById('routeTime').textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} Horas`;
      document.getElementById('routeDist').textContent = `${(route.distance/1000).toFixed(3)} Km`;
    } else {
      throw new Error('no route');
    }
  } catch(err){
    // Fallback: straight-line estimate if routing service is unavailable
    let dist = 0;
    for(let i=0;i<points.length-1;i++) dist += haversine(points[i], points[i+1]);
    const latlngs = points.map(p=>[p.lat,p.lng]);
    L.polyline(latlngs, {color:'#3E7CB1', weight:5, opacity:.85, dashArray:'2 10'}).addTo(mapRoute);
    const hrs = dist/45; // approx avg speed km/h on local roads
    const h = Math.floor(hrs), m = Math.round((hrs-h)*60);
    document.getElementById('routeTime').textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} Horas`;
    document.getElementById('routeDist').textContent = `${dist.toFixed(3)} Km`;
  }
}

/* ================= INIT ================= */
__ready( ()=>{
  // Each piece initializes independently: if one throws, the rest (crucially
  // the map) still run instead of the whole page silently getting stuck.
  const steps = [
    ['renderChips', renderChips],
    ['renderGrid', renderGrid],
    ['renderSelection', renderSelection],
    ['renderTours', renderTours],
    ['renderTrailNodes', renderTrailNodes],
    ['updateTrail', ()=>updateTrail(0)],
    ['initScrollSync', initScrollSync],
    ['initStartMap', initStartMap],
    ['initHeroSearch', initHeroSearch],
  ];
  steps.forEach(([name, fn])=>{
    try{ fn(); } catch(err){ console.error(`[Talapo] Falló ${name}:`, err); }
  });

  try{
    document.getElementById('detailBackdrop').addEventListener('click', closeDetail);
    document.getElementById('detailClose').addEventListener('click', closeDetail);
    __listen(document, 'keydown', (e)=>{ if(e.key==='Escape') closeDetail(); });
  } catch(err){ console.error('[Talapo] Falló el panel de detalle:', err); }

  try{
    let searchDebounce;
    document.getElementById('searchInput').addEventListener('input', (e)=>{
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(()=>{
        searchTerm = e.target.value.trim();
        renderGrid();
      }, 180);
    });
  } catch(err){ console.error('[Talapo] Falló el buscador:', err); }
});

/* [migración] listener del carrusel de main.js eliminado */

__ready( () => {
    updateRotativeCarousel();
    startAutoPlay();

    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        navLinks?.classList.toggle('active');
        
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        }
    });

    __listen(document, 'click', (e) => {
        if (navLinks?.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuToggle) {
            navLinks.classList.remove('active');
            const icon = menuToggle?.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        }
    });
});


// Sincronizar la foto del pasaporte con la barra de navegación del Main
    __ready( () => {
        const savedPassport = localStorage.getItem('talapo_passport');
        if (savedPassport) {
            const data = JSON.parse(savedPassport);
            const navProfileImg = document.querySelector('.nav-profile-img');
            if (navProfileImg && data.fotoUrl) {
                navProfileImg.src = data.fotoUrl;
            }
        }
}); 


;
  if (typeof buildRoute !== 'undefined') __expose('buildRoute', buildRoute);
  if (typeof goToStep !== 'undefined') __expose('goToStep', goToStep);

/* ================= NUEVO: guardar/cargar itinerarios en InsForge ================= */
const PENDING_KEY = 'talapo_pending_route';
function currentRoutePoints(){
  return destinos.filter(d=>selected.has(d.id));
}
async function saveItinerary(){
  const chosen = currentRoutePoints();
  if(!chosen.length){ showToast ? showToast('Select at least one place first') : null; goToStep(0); return; }
  const titleEl = document.getElementById('routeTitle');
  const title = (titleEl.value || '').trim() || (chosen[0].nombre + (chosen.length>1 ? ' + ' + (chosen.length-1) + ' more' : ''));
  const lat = parseFloat(document.getElementById('lat').value);
  const lng = parseFloat(document.getElementById('lng').value);
  if(!__talapo.user()){
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ids:[...selected], lat, lng, title }));
    __talapo.requireLogin('Sign in to save your tour — your route will be waiting');
    return;
  }
  const kmText = document.getElementById('routeDist').textContent;
  const timeText = document.getElementById('routeTime').textContent;
  const km = parseFloat(kmText);
  const hm = timeText.match(/(\d+):(\d+)/);
  const btn = document.getElementById('saveRouteBtn');
  btn.disabled = true; btn.textContent = 'Saving…';
  const { error } = await __talapo.db.from('itineraries').insert([{
    user_id: __talapo.user().id,
    title,
    start_label: 'My starting point',
    start_lat: lat, start_lng: lng,
    stops: chosen.map(d=>({ id:d.id, name:d.nombre, place:d.deptoLabel, lat:d.lat, lng:d.lng, img:d.img, duration:d.duracion })),
    distance_km: isNaN(km) ? null : km,
    duration_min: hm ? (+hm[1])*60 + (+hm[2]) : null,
  }]);
  btn.disabled = false;
  if(error){ btn.textContent = 'Save tour'; __talapo.toast(error.message || 'Could not save', 'error'); return; }
  btn.textContent = 'Saved ✓';
  document.getElementById('viewSavedBtn').hidden = false;
  __talapo.toast('Tour saved to your passport ✈️');
  __talapo.onSaved && __talapo.onSaved();
}
__expose('saveItinerary', saveItinerary);

// Abrir una ruta guardada (/tours?itinerary=id) o recuperar la pendiente tras el login
__ready(async () => {
  const params = new URLSearchParams(location.search);
  let preset = null;
  if(params.get('itinerary') && __talapo.user()){
    const { data } = await __talapo.db.from('itineraries').select('*').eq('id', params.get('itinerary')).limit(1);
    if(data && data[0]) preset = { ids: data[0].stops.map(s=>s.id), lat: data[0].start_lat, lng: data[0].start_lng, title: data[0].title };
  } else if(params.get('resume') && sessionStorage.getItem(PENDING_KEY) && __talapo.user()){
    preset = JSON.parse(sessionStorage.getItem(PENDING_KEY));
    sessionStorage.removeItem(PENDING_KEY);
  }
  if(!preset) return;
  selected = new Set(preset.ids.filter(id=>destinos.some(d=>d.id===id)));
  document.getElementById('lat').value = preset.lat;
  document.getElementById('lng').value = preset.lng;
  document.getElementById('routeTitle').value = preset.title || '';
  try{ renderGrid(); renderSelection(); refreshCounts(); }catch(e){}
  setTimeout(()=>buildRoute(), 400);
});
if (typeof __onload === "function") __ready(__onload);