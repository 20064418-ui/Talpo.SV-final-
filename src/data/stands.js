/**
 * Stands de Talapo (quioscos con tablet). Para agregar otro stand, copia el bloque
 * de 'parque-libertad', cambia sus datos y agrégalo también a la tabla `stands`
 * (migración 20260929010000_stands.sql).
 *
 * ⚠️ Las coordenadas son aproximadas: revísalas en el mapa del stand y ajústalas aquí.
 */
import { t } from '@/i18n/kiosk';

export const stands = {
  'parque-libertad': {
    id: 'parque-libertad',
    name: 'Parque Libertad',
    city: 'Santa Ana',
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
        emoji: '🌳',
        image: '/assets/img/stand/parksantaana.jpg',
        lat: 13.9943, lng: -89.5596,
        name: { es: 'Parque Libertad', en: 'Parque Libertad', fr: 'Parc Libertad', pt: 'Parque Libertad' },
        category: { es: 'Plaza', en: 'Plaza', fr: 'Place', pt: 'Praça' },
        short: {
          es: 'La plaza principal de Santa Ana, rodeada de los edificios históricos más importantes de la ciudad.',
          en: 'The main square of Santa Ana, surrounded by the city’s most important historic buildings.',
          fr: 'La place principale de Santa Ana, entourée des bâtiments historiques les plus importants de la ville.',
          pt: 'A praça principal de Santa Ana, cercada pelos edifícios históricos mais importantes da cidade.',
        },
        story: {
          es: 'El Parque Libertad es el punto de encuentro tradicional de Santa Ana. A su alrededor están la Catedral, el Teatro de Santa Ana y el Palacio Municipal, así que en un solo paseo puedes ver el patrimonio arquitectónico que convirtió a Santa Ana en una de las ciudades más importantes de El Salvador. Familias, vendedores y eventos le dan vida todos los días.',
          en: 'Parque Libertad is the traditional meeting point of Santa Ana. Around it stand the Cathedral, the Santa Ana Theater and the Municipal Palace, so in a single walk you can see the architectural heritage that made Santa Ana one of the most important cities in El Salvador. Families, street vendors and events keep the square alive every day.',
          fr: 'Le Parc Libertad est le lieu de rencontre traditionnel de Santa Ana. Autour de lui se trouvent la Cathédrale, le Théâtre de Santa Ana et le Palais municipal : en une seule promenade, vous découvrez le patrimoine architectural qui a fait de Santa Ana l’une des villes les plus importantes du Salvador. Familles, vendeurs et événements l’animent chaque jour.',
          pt: 'O Parque Libertad é o ponto de encontro tradicional de Santa Ana. Ao seu redor estão a Catedral, o Teatro de Santa Ana e o Palácio Municipal; em um só passeio você conhece o patrimônio arquitetônico que fez de Santa Ana uma das cidades mais importantes de El Salvador. Famílias, vendedores e eventos animam a praça todos os dias.',
        },
        tip: {
          es: 'Ven al final de la tarde, cuando la fachada de la Catedral se ilumina con el atardecer.',
          en: 'Visit in the late afternoon, when the Cathedral façade lights up with the sunset.',
          fr: 'Venez en fin d’après-midi, quand la façade de la Cathédrale s’illumine au coucher du soleil.',
          pt: 'Venha no fim da tarde, quando a fachada da Catedral se ilumina com o pôr do sol.',
        },
      },
      {
        slug: 'catedral-santa-ana',
        emoji: '⛪',
        image: '/assets/img/realidadaumentada/santaana.jpg',
        lat: 13.9945, lng: -89.5588,
        name: { es: 'Catedral de Santa Ana', en: 'Santa Ana Cathedral', fr: 'Cathédrale de Santa Ana', pt: 'Catedral de Santa Ana' },
        category: { es: 'Iglesia', en: 'Church', fr: 'Église', pt: 'Igreja' },
        short: {
          es: 'Una catedral neogótica de fachada blanca, uno de los edificios más fotografiados del país.',
          en: 'A neo-Gothic cathedral with a white façade, one of the most photographed buildings in the country.',
          fr: 'Une cathédrale néogothique à la façade blanche, l’un des bâtiments les plus photographiés du pays.',
          pt: 'Uma catedral neogótica de fachada branca, um dos edifícios mais fotografados do país.',
        },
        story: {
          es: 'La Catedral de Nuestra Señora Santa Ana se construyó a inicios del siglo XX en estilo neogótico, con torres puntiagudas y una fachada blanca muy decorada. Es el centro espiritual de la ciudad y el escenario de las fiestas en honor a Santa Ana, patrona de la ciudad, en julio.',
          en: 'The Cathedral of Our Lady Saint Anne was built at the beginning of the 20th century in neo-Gothic style, with pointed towers and a richly decorated white façade. It is the spiritual center of the city and the setting of the festivities in honor of Saint Anne, the patron saint of Santa Ana, in July.',
          fr: 'La Cathédrale Notre-Dame-Sainte-Anne a été construite au début du XXe siècle dans un style néogothique, avec des tours pointues et une façade blanche richement décorée. C’est le centre spirituel de la ville et le cadre des fêtes en l’honneur de sainte Anne, patronne de Santa Ana, en juillet.',
          pt: 'A Catedral de Nossa Senhora Sant’Ana foi construída no início do século XX em estilo neogótico, com torres pontiagudas e uma fachada branca muito decorada. É o centro espiritual da cidade e o cenário das festas em honra a Sant’Ana, padroeira da cidade, em julho.',
        },
        tip: {
          es: 'Entra en silencio para ver los vitrales y la altura de la nave.',
          en: 'Step inside quietly to see the stained glass and the height of the nave.',
          fr: 'Entrez en silence pour admirer les vitraux et la hauteur de la nef.',
          pt: 'Entre em silêncio para ver os vitrais e a altura da nave.',
        },
      },
      {
        slug: 'teatro-santa-ana',
        emoji: '🎭',
        image: null,
        lat: 13.9951, lng: -89.5595,
        name: { es: 'Teatro de Santa Ana', en: 'Santa Ana Theater', fr: 'Théâtre de Santa Ana', pt: 'Teatro de Santa Ana' },
        category: { es: 'Cultura', en: 'Culture', fr: 'Culture', pt: 'Cultura' },
        short: {
          es: 'Un teatro neoclásico inaugurado a inicios del siglo XX, símbolo de la prosperidad de la época del café.',
          en: 'A neoclassical theater opened in the early 1900s, symbol of the city’s coffee-era prosperity.',
          fr: 'Un théâtre néoclassique inauguré au début du XXe siècle, symbole de la prospérité de l’époque du café.',
          pt: 'Um teatro neoclássico inaugurado no início do século XX, símbolo da prosperidade da era do café.',
        },
        story: {
          es: 'El Teatro de Santa Ana se construyó con la riqueza del auge cafetalero y se inauguró a inicios del siglo XX. Su fachada neoclásica y su interior, inspirado en los teatros de ópera europeos, lo convierten en una de las joyas de la arquitectura salvadoreña. Hoy recibe conciertos, obras de teatro y eventos culturales.',
          en: 'The Santa Ana Theater was built with the wealth of the coffee boom and opened at the beginning of the 20th century. Its neoclassical façade and its interior, inspired by European opera houses, make it one of the jewels of Salvadoran architecture. Today it hosts concerts, plays and cultural events.',
          fr: 'Le Théâtre de Santa Ana a été construit grâce à la richesse du boom du café et inauguré au début du XXe siècle. Sa façade néoclassique et son intérieur, inspiré des opéras européens, en font l’un des joyaux de l’architecture salvadorienne. Il accueille aujourd’hui concerts, pièces de théâtre et événements culturels.',
          pt: 'O Teatro de Santa Ana foi construído com a riqueza do auge do café e inaugurado no início do século XX. Sua fachada neoclássica e seu interior, inspirado nos teatros de ópera europeus, fazem dele uma das joias da arquitetura salvadorenha. Hoje recebe concertos, peças de teatro e eventos culturais.',
        },
        tip: {
          es: 'Revisa la programación en la entrada: a menudo hay eventos culturales gratuitos.',
          en: 'Check the program at the entrance — there are often free cultural events.',
          fr: 'Consultez le programme à l’entrée : il y a souvent des événements culturels gratuits.',
          pt: 'Confira a programação na entrada: muitas vezes há eventos culturais gratuitos.',
        },
      },
      {
        slug: 'palacio-municipal',
        emoji: '🏛️',
        image: null,
        lat: 13.9943, lng: -89.5604,
        name: { es: 'Palacio Municipal', en: 'Municipal Palace', fr: 'Palais municipal', pt: 'Palácio Municipal' },
        category: { es: 'Historia', en: 'History', fr: 'Histoire', pt: 'História' },
        short: {
          es: 'La alcaldía histórica de Santa Ana, un edificio neoclásico con patio interior.',
          en: 'The historic city hall of Santa Ana, a neoclassical building with an interior courtyard.',
          fr: 'L’hôtel de ville historique de Santa Ana, un bâtiment néoclassique avec une cour intérieure.',
          pt: 'A prefeitura histórica de Santa Ana, um edifício neoclássico com pátio interno.',
        },
        story: {
          es: 'El Palacio Municipal, sede de la alcaldía de Santa Ana, es un edificio neoclásico de finales del siglo XIX. Sus arcadas y su patio interior reflejan la elegancia de la época. Junto con la Catedral y el Teatro, completa el conjunto histórico alrededor del Parque Libertad.',
          en: 'The Municipal Palace, home of the Santa Ana city government, is a neoclassical building from the late 19th century. Its arcades and interior courtyard reflect the elegance of the period. Together with the Cathedral and the Theater, it completes the historic ensemble around Parque Libertad.',
          fr: 'Le Palais municipal, siège de la mairie de Santa Ana, est un bâtiment néoclassique de la fin du XIXe siècle. Ses arcades et sa cour intérieure reflètent l’élégance de l’époque. Avec la Cathédrale et le Théâtre, il complète l’ensemble historique autour du Parc Libertad.',
          pt: 'O Palácio Municipal, sede da prefeitura de Santa Ana, é um edifício neoclássico do final do século XIX. Suas arcadas e seu pátio interno refletem a elegância da época. Junto com a Catedral e o Teatro, completa o conjunto histórico ao redor do Parque Libertad.',
        },
        tip: {
          es: 'Mira el patio desde la entrada: sus columnas son perfectas para fotos.',
          en: 'Look at the courtyard from the entrance: its columns are perfect for photos.',
          fr: 'Regardez la cour depuis l’entrée : ses colonnes sont parfaites pour les photos.',
          pt: 'Olhe o pátio da entrada: suas colunas são perfeitas para fotos.',
        },
      },
      {
        slug: 'casino-santaneco',
        emoji: '🏰',
        image: null,
        lat: 13.9939, lng: -89.5603,
        name: { es: 'Casino Santaneco', en: 'Casino Santaneco', fr: 'Casino Santaneco', pt: 'Casino Santaneco' },
        category: { es: 'Historia', en: 'History', fr: 'Histoire', pt: 'História' },
        short: {
          es: 'Un edificio histórico y ornamentado junto a la plaza, club social de las familias tradicionales de Santa Ana.',
          en: 'An ornate historic building next to the square, a social club of Santa Ana’s traditional families.',
          fr: 'Un bâtiment historique orné près de la place, club social des familles traditionnelles de Santa Ana.',
          pt: 'Um edifício histórico ornamentado junto à praça, clube social das famílias tradicionais de Santa Ana.',
        },
        story: {
          es: 'El Casino Santaneco es un edificio histórico cerca del Parque Libertad que durante generaciones fue club social de las familias de la ciudad. Su fachada decorada es otro ejemplo de la arquitectura que floreció en Santa Ana gracias al café.',
          en: 'The Casino Santaneco is a historic building near Parque Libertad that for generations served as a social club for the families of the city. Its decorated façade is another example of the architecture that flourished in Santa Ana thanks to coffee.',
          fr: 'Le Casino Santaneco est un bâtiment historique près du Parc Libertad qui a servi pendant des générations de club social aux familles de la ville. Sa façade décorée est un autre exemple de l’architecture qui a fleuri à Santa Ana grâce au café.',
          pt: 'O Casino Santaneco é um edifício histórico perto do Parque Libertad que, por gerações, foi clube social das famílias da cidade. Sua fachada decorada é mais um exemplo da arquitetura que floresceu em Santa Ana graças ao café.',
        },
        tip: {
          es: 'Admira su fachada desde el parque; la mejor vista es desde el lado oeste de la plaza.',
          en: 'Admire its façade from the park; the best view is from the west side of the square.',
          fr: 'Admirez sa façade depuis le parc ; la meilleure vue est depuis le côté ouest de la place.',
          pt: 'Admire a fachada a partir do parque; a melhor vista é do lado oeste da praça.',
        },
      },
      {
        slug: 'museo-regional-occidente',
        emoji: '🏺',
        image: null,
        lat: 13.9931, lng: -89.5593,
        name: { es: 'Museo Regional de Occidente', en: 'Western Regional Museum', fr: 'Musée régional de l’Ouest', pt: 'Museu Regional do Ocidente' },
        category: { es: 'Museo', en: 'Museum', fr: 'Musée', pt: 'Museu' },
        short: {
          es: 'Un museo sobre la historia y la arqueología del occidente de El Salvador, a pocos pasos de la plaza.',
          en: 'A museum about the history and archaeology of western El Salvador, a short walk from the square.',
          fr: 'Un musée sur l’histoire et l’archéologie de l’ouest du Salvador, à quelques pas de la place.',
          pt: 'Um museu sobre a história e a arqueologia do ocidente de El Salvador, a poucos passos da praça.',
        },
        story: {
          es: 'El Museo Regional de Occidente presenta la historia de la región occidental de El Salvador: arqueología, la época del café y el desarrollo de Santa Ana. Es una gran parada para entender las historias detrás de los edificios que ves alrededor del Parque Libertad.',
          en: 'The Western Regional Museum presents the history of the western region of El Salvador: archaeology, the coffee era and the development of Santa Ana. It is a great stop to understand the stories behind the buildings you see around Parque Libertad.',
          fr: 'Le Musée régional de l’Ouest présente l’histoire de la région occidentale du Salvador : archéologie, époque du café et développement de Santa Ana. Une excellente étape pour comprendre les histoires derrière les bâtiments autour du Parc Libertad.',
          pt: 'O Museu Regional do Ocidente apresenta a história da região ocidental de El Salvador: arqueologia, a era do café e o desenvolvimento de Santa Ana. É uma ótima parada para entender as histórias por trás dos edifícios ao redor do Parque Libertad.',
        },
        tip: {
          es: 'Pregunta en la entrada por los horarios y las visitas guiadas.',
          en: 'Ask at the entrance about opening hours and guided visits.',
          fr: 'Renseignez-vous à l’entrée sur les horaires et les visites guidées.',
          pt: 'Pergunte na entrada sobre os horários e as visitas guiadas.',
        },
      },
    ],
  },
};

export const trashTypes = [
  { id: 'plastic', key: 'tPlastic', emoji: '🧴' },
  { id: 'paper', key: 'tPaper', emoji: '📦' },
  { id: 'glass', key: 'tGlass', emoji: '🍾' },
  { id: 'metal', key: 'tMetal', emoji: '🥫' },
  { id: 'organic', key: 'tOrganic', emoji: '🍌' },
  { id: 'bulky', key: 'tBulky', emoji: '🛋️' },
  { id: 'other', key: 'tOther', emoji: '❓' },
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
  const dist = m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
  return t('walking', { dist, min });
}

export function directionsUrl(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=walking`;
}
