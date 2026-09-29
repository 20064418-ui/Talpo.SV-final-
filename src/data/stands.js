/**
 * Stands de Talapo (quioscos con tablet). Para agregar otro stand, copia el bloque
 * de 'parque-libertad', cambia sus datos y agrégalo también a la tabla `stands`
 * (migración 20260929010000_stands.sql).
 *
 * ⚠️ Las coordenadas son aproximadas: revísalas en el mapa del stand y ajústalas aquí.
 */
export const stands = {
  'parque-libertad': {
    id: 'parque-libertad',
    name: 'Parque Libertad',
    city: 'Santa Ana',
    tagline: 'The heart of historic Santa Ana',
    cover: '/assets/img/stand/parksantaana.jpg',
    lat: 13.9943,
    lng: -89.5596,
    // Correo donde las personas mandan sus noticias municipales (solo llega aquí)
    newsEmail: 'avisos.talapo@gmail.com',
    newsSubject: 'Municipal news — Parque Libertad, Santa Ana',
    // Para poner una foto real de un lugar: guárdala en public/assets/img/stand/ y cambia `image`.
    // Si `image` es null, se muestra un fondo de color con el ícono (`emoji`).
    places: [
      {
        slug: 'parque-libertad',
        name: 'Parque Libertad',
        category: 'Plaza',
        emoji: '🌳',
        image: '/assets/img/stand/parksantaana.jpg',
        lat: 13.9943, lng: -89.5596,
        short: 'The main square of Santa Ana, surrounded by the city’s most important historic buildings.',
        story: 'Parque Libertad is the traditional meeting point of Santa Ana. Around it stand the Cathedral, the Santa Ana Theater and the Municipal Palace, so in a single walk you can see the architectural heritage that made Santa Ana one of the most important cities in El Salvador. Families, street vendors and events keep the square alive every day.',
        tip: 'Visit in the late afternoon, when the Cathedral façade lights up with the sunset.',
      },
      {
        slug: 'catedral-santa-ana',
        name: 'Santa Ana Cathedral',
        category: 'Church',
        emoji: '⛪',
        image: '/assets/img/realidadaumentada/santaana.jpg',
        lat: 13.9945, lng: -89.5588,
        short: 'A neo-Gothic cathedral with a white façade, one of the most photographed buildings in the country.',
        story: 'The Cathedral of Our Lady Saint Anne was built at the beginning of the 20th century in neo-Gothic style, with pointed towers and a richly decorated white façade. It is the spiritual center of the city and the setting of the festivities in honor of Saint Anne, the patron saint of Santa Ana, in July.',
        tip: 'Step inside quietly to see the stained glass and the height of the nave.',
      },
      {
        slug: 'teatro-santa-ana',
        name: 'Santa Ana Theater',
        category: 'Culture',
        emoji: '🎭',
        image: null,
        lat: 13.9951, lng: -89.5595,
        short: 'A neoclassical theater opened in the early 1900s, symbol of the city’s coffee-era prosperity.',
        story: 'The Santa Ana Theater was built with the wealth of the coffee boom and opened at the beginning of the 20th century. Its neoclassical façade and its interior, inspired by European opera houses, make it one of the jewels of Salvadoran architecture. Today it hosts concerts, plays and cultural events.',
        tip: 'Check the program at the entrance — there are often free cultural events.',
      },
      {
        slug: 'palacio-municipal',
        name: 'Municipal Palace',
        category: 'History',
        emoji: '🏛️',
        image: null,
        lat: 13.9943, lng: -89.5604,
        short: 'The historic city hall of Santa Ana, a neoclassical building with an interior courtyard.',
        story: 'The Municipal Palace, home of the Santa Ana city government, is a neoclassical building from the late 19th century. Its arcades and interior courtyard reflect the elegance of the period. Together with the Cathedral and the Theater, it completes the historic ensemble around Parque Libertad.',
        tip: 'Look at the courtyard from the entrance: its columns are perfect for photos.',
      },
      {
        slug: 'casino-santaneco',
        name: 'Casino Santaneco',
        category: 'History',
        emoji: '🏰',
        image: null,
        lat: 13.9939, lng: -89.5603,
        short: 'An ornate historic building next to the square, a social club of Santa Ana’s traditional families.',
        story: 'The Casino Santaneco is a historic building near Parque Libertad that for generations served as a social club for the families of the city. Its decorated façade is another example of the architecture that flourished in Santa Ana thanks to coffee.',
        tip: 'Admire its façade from the park; the best view is from the west side of the square.',
      },
      {
        slug: 'museo-regional-occidente',
        name: 'Western Regional Museum',
        category: 'Museum',
        emoji: '🏺',
        image: null,
        lat: 13.9931, lng: -89.5593,
        short: 'A museum about the history and archaeology of western El Salvador, a short walk from the square.',
        story: 'The Western Regional Museum presents the history of the western region of El Salvador: archaeology, the coffee era and the development of Santa Ana. It is a great stop to understand the stories behind the buildings you see around Parque Libertad.',
        tip: 'Ask at the entrance about opening hours and guided visits.',
      },
    ],
  },
};

export const trashTypes = [
  { id: 'plastic', label: 'Plastic', emoji: '🧴' },
  { id: 'paper', label: 'Paper / cardboard', emoji: '📦' },
  { id: 'glass', label: 'Glass', emoji: '🍾' },
  { id: 'metal', label: 'Cans / metal', emoji: '🥫' },
  { id: 'organic', label: 'Organic / food', emoji: '🍌' },
  { id: 'bulky', label: 'Large objects', emoji: '🛋️' },
  { id: 'other', label: 'Other', emoji: '❓' },
];

/** Distancia en metros entre dos puntos. */
export function distanceMeters(a, b) {
  const R = 6371000; const r = (x) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat); const dLng = r(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** "250 m · 3 min walking" */
export function walkLabel(m) {
  const min = Math.max(1, Math.round(m / 80));   // ~4.8 km/h
  return `${m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`} · ${min} min walking`;
}

export function directionsUrl(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=walking`;
}
