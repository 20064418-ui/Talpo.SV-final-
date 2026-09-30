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
    lat: 13.99474,
    lng: -89.55661,
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
        lat: 13.99474, lng: -89.55661,
        name: { es: 'Parque Libertad', en: 'Parque Libertad', fr: 'Parc Libertad', pt: 'Parque Libertad' },
        category: { es: 'Plaza', en: 'Plaza', fr: 'Place', pt: 'Praça' },
        short: {
          es: 'La plaza principal de Santa Ana, rodeada de los edificios históricos más importantes de la ciudad.',
          en: 'The main square of Santa Ana, surrounded by the city’s most important historic buildings.',
          fr: 'La place principale de Santa Ana, entourée des bâtiments historiques les plus importants de la ville.',
          pt: 'A praça principal de Santa Ana, cercada pelos edifícios históricos mais importantes da cidade.',
        },
        story: {
          es: 'El Parque Libertad nació como la plaza central de Santa Ana en la época colonial: fue mercado, lugar de fiestas y escenario de la vida política de la ciudad. El 8 de junio de 1886, el presidente Francisco Menéndez decretó que en la plaza se construyera un parque. Hoy lo rodean la Catedral, el Teatro y el Palacio Municipal, y es el punto de encuentro de familias, vendedores y eventos.',
          en: 'Parque Libertad began as the central square of Santa Ana in colonial times: it was a market, a place for festivities and the stage of the city’s political life. On June 8, 1886, President Francisco Menéndez decreed that a park be built in the square. Today it is surrounded by the Cathedral, the Theater and the Municipal Palace, and it is the meeting point for families, vendors and events.',
          fr: 'Le Parc Libertad est né comme place centrale de Santa Ana à l’époque coloniale : marché, lieu de fêtes et scène de la vie politique de la ville. Le 8 juin 1886, le président Francisco Menéndez décréta la création d’un parc sur la place. Aujourd’hui, il est entouré par la Cathédrale, le Théâtre et le Palais municipal, et reste le lieu de rencontre des familles, des vendeurs et des événements.',
          pt: 'O Parque Libertad nasceu como a praça central de Santa Ana na época colonial: foi mercado, lugar de festas e palco da vida política da cidade. Em 8 de junho de 1886, o presidente Francisco Menéndez decretou a construção de um parque na praça. Hoje está cercado pela Catedral, pelo Teatro e pelo Palácio Municipal, e é o ponto de encontro de famílias, vendedores e eventos.',
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
        lat: 13.99498, lng: -89.55547,
        name: { es: 'Catedral de Santa Ana', en: 'Santa Ana Cathedral', fr: 'Cathédrale de Santa Ana', pt: 'Catedral de Santa Ana' },
        category: { es: 'Iglesia', en: 'Church', fr: 'Église', pt: 'Igreja' },
        short: {
          es: 'Una catedral neogótica de fachada blanca, uno de los edificios más fotografiados del país.',
          en: 'A neo-Gothic cathedral with a white façade, one of the most photographed buildings in the country.',
          fr: 'Une cathédrale néogothique à la façade blanche, l’un des bâtiments les plus photographiés du pays.',
          pt: 'Uma catedral neogótica de fachada branca, um dos edifícios mais fotografados do país.',
        },
        story: {
          es: 'La Catedral de Nuestra Señora Santa Ana se construyó entre 1906 y 1913 en estilo neogótico, algo poco común en El Salvador, donde la mayoría de iglesias antiguas son de estilo colonial. En 1913 el papa Pío X creó la diócesis de Santa Ana. Es el centro espiritual de la ciudad y el escenario de las Fiestas Julias en honor a Santa Ana, su patrona.',
          en: 'The Cathedral of Our Lady Saint Anne was built between 1906 and 1913 in neo-Gothic style — unusual in El Salvador, where most old churches are colonial. In 1913 Pope Pius X created the Diocese of Santa Ana. It is the spiritual center of the city and the setting of the July festivities (Fiestas Julias) in honor of Saint Anne, its patron saint.',
          fr: 'La Cathédrale Notre-Dame-Sainte-Anne a été construite entre 1906 et 1913 dans un style néogothique, rare au Salvador où la plupart des églises anciennes sont coloniales. En 1913, le pape Pie X créa le diocèse de Santa Ana. C’est le centre spirituel de la ville et le cadre des fêtes de juillet (Fiestas Julias) en l’honneur de sainte Anne, sa patronne.',
          pt: 'A Catedral de Nossa Senhora Sant’Ana foi construída entre 1906 e 1913 em estilo neogótico, algo raro em El Salvador, onde a maioria das igrejas antigas é colonial. Em 1913 o papa Pio X criou a diocese de Santa Ana. É o centro espiritual da cidade e o cenário das festas de julho (Fiestas Julias) em honra a Sant’Ana, sua padroeira.',
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
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/ES_Santa_Ana_06_2011_2535.jpg?width=1200',
        credit: 'Mariordo · CC BY-SA 3.0 · Wikimedia Commons',
        lat: 13.99545, lng: -89.55663,
        name: { es: 'Teatro de Santa Ana', en: 'Santa Ana Theater', fr: 'Théâtre de Santa Ana', pt: 'Teatro de Santa Ana' },
        category: { es: 'Cultura', en: 'Culture', fr: 'Culture', pt: 'Cultura' },
        short: {
          es: 'Un teatro neoclásico inaugurado a inicios del siglo XX, símbolo de la prosperidad de la época del café.',
          en: 'A neoclassical theater opened in the early 1900s, symbol of the city’s coffee-era prosperity.',
          fr: 'Un théâtre néoclassique inauguré au début du XXe siècle, symbole de la prospérité de l’époque du café.',
          pt: 'Um teatro neoclássico inaugurado no início do século XX, símbolo da prosperidade da era do café.',
        },
        story: {
          es: 'La primera piedra del Teatro de Santa Ana se colocó el 9 de febrero de 1902 y el edificio se inauguró en 1910. Los planos fueron del ingeniero Domingo Call, y los arquitectos italianos Francisco Durini y Cristóbal Molinari dirigieron su decoración junto a artistas italianos y salvadoreños. Su gran telón fue pintado en Milán. En 1982 fue declarado Monumento Nacional.',
          en: 'The first stone of the Santa Ana Theater was laid on February 9, 1902, and the building opened in 1910. The plans were drawn by engineer Domingo Call, and Italian architects Francisco Durini and Cristóbal Molinari led its decoration together with Italian and Salvadoran artists. Its great stage curtain was painted in Milan. In 1982 it was declared a National Monument.',
          fr: 'La première pierre du Théâtre de Santa Ana a été posée le 9 février 1902 et le bâtiment a été inauguré en 1910. Les plans sont de l’ingénieur Domingo Call, et les architectes italiens Francisco Durini et Cristóbal Molinari ont dirigé sa décoration avec des artistes italiens et salvadoriens. Son grand rideau de scène a été peint à Milan. Il a été déclaré Monument national en 1982.',
          pt: 'A pedra fundamental do Teatro de Santa Ana foi colocada em 9 de fevereiro de 1902, e o edifício foi inaugurado em 1910. Os planos foram do engenheiro Domingo Call, e os arquitetos italianos Francisco Durini e Cristóbal Molinari dirigiram a decoração com artistas italianos e salvadorenhos. Sua grande cortina de palco foi pintada em Milão. Em 1982 foi declarado Monumento Nacional.',
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
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/ES_Santa_Ana_06_2011_2482.jpg?width=1200',
        credit: 'Mariordo · CC BY-SA 3.0 · Wikimedia Commons',
        lat: 13.99480, lng: -89.55780,
        name: { es: 'Palacio Municipal', en: 'Municipal Palace', fr: 'Palais municipal', pt: 'Palácio Municipal' },
        category: { es: 'Historia', en: 'History', fr: 'Histoire', pt: 'História' },
        short: {
          es: 'La alcaldía histórica de Santa Ana, un edificio neoclásico con patio interior.',
          en: 'The historic city hall of Santa Ana, a neoclassical building with an interior courtyard.',
          fr: 'L’hôtel de ville historique de Santa Ana, un bâtiment néoclassique avec une cour intérieure.',
          pt: 'A prefeitura histórica de Santa Ana, um edifício neoclássico com pátio interno.',
        },
        story: {
          es: 'El Palacio Municipal de Santa Ana, sede de la alcaldía, empezó a construirse en 1874. Sus arcadas, columnas y patio interior son un ejemplo de la arquitectura del siglo XIX, y un siglo después fue declarado monumento nacional. Junto con la Catedral y el Teatro, forma el conjunto histórico alrededor del Parque Libertad.',
          en: 'Construction of the Santa Ana Municipal Palace, home of the city government, began in 1874. Its arcades, columns and interior courtyard are an example of 19th-century architecture, and a century later it was declared a national monument. Together with the Cathedral and the Theater, it forms the historic ensemble around Parque Libertad.',
          fr: 'La construction du Palais municipal de Santa Ana, siège de la mairie, a commencé en 1874. Ses arcades, ses colonnes et sa cour intérieure illustrent l’architecture du XIXe siècle, et un siècle plus tard il fut déclaré monument national. Avec la Cathédrale et le Théâtre, il forme l’ensemble historique autour du Parc Libertad.',
          pt: 'A construção do Palácio Municipal de Santa Ana, sede da prefeitura, começou em 1874. Suas arcadas, colunas e pátio interno são um exemplo da arquitetura do século XIX, e um século depois foi declarado monumento nacional. Junto com a Catedral e o Teatro, forma o conjunto histórico ao redor do Parque Libertad.',
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
        lat: 13.99415, lng: -89.55760, // ⚠️ aproximada: 2.ª Calle Poniente y Av. Independencia Sur
        name: { es: 'Casino Santaneco', en: 'Casino Santaneco', fr: 'Casino Santaneco', pt: 'Casino Santaneco' },
        category: { es: 'Historia', en: 'History', fr: 'Histoire', pt: 'História' },
        short: {
          es: 'Un edificio histórico y ornamentado junto a la plaza, club social de las familias tradicionales de Santa Ana.',
          en: 'An ornate historic building next to the square, a social club of Santa Ana’s traditional families.',
          fr: 'Un bâtiment historique orné près de la place, club social des familles traditionnelles de Santa Ana.',
          pt: 'Um edifício histórico ornamentado junto à praça, clube social das famílias tradicionais de Santa Ana.',
        },
        story: {
          es: 'El Casino Santaneco es un club social del Centro Histórico de Santa Ana, cuyo edificio se construyó en 1896. Durante generaciones ha sido punto de encuentro de la sociedad santaneca, y hoy sus salones se usan para fiestas, congresos y eventos. Su fachada es otro ejemplo de la arquitectura que floreció en Santa Ana gracias al café.',
          en: 'The Casino Santaneco is a social club in the Historic Center of Santa Ana, whose building was built in 1896. For generations it has been a meeting point of Santa Ana society, and today its halls host parties, conferences and events. Its façade is another example of the architecture that flourished in Santa Ana thanks to coffee.',
          fr: 'Le Casino Santaneco est un club social du centre historique de Santa Ana, dont le bâtiment a été construit en 1896. Pendant des générations, il a été un lieu de rencontre de la société de Santa Ana, et ses salons accueillent aujourd’hui fêtes, congrès et événements. Sa façade illustre l’architecture qui a fleuri à Santa Ana grâce au café.',
          pt: 'O Casino Santaneco é um clube social do Centro Histórico de Santa Ana, cujo edifício foi construído em 1896. Por gerações foi ponto de encontro da sociedade de Santa Ana, e hoje seus salões recebem festas, congressos e eventos. Sua fachada é mais um exemplo da arquitetura que floresceu em Santa Ana graças ao café.',
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
        lat: 13.99380, lng: -89.55740, // ⚠️ aproximada: Av. Independencia Sur n.º 8
        name: { es: 'Museo Regional de Occidente', en: 'Western Regional Museum', fr: 'Musée régional de l’Ouest', pt: 'Museu Regional do Ocidente' },
        category: { es: 'Museo', en: 'Museum', fr: 'Musée', pt: 'Museu' },
        short: {
          es: 'Un museo sobre la historia y la arqueología del occidente de El Salvador, a pocos pasos de la plaza.',
          en: 'A museum about the history and archaeology of western El Salvador, a short walk from the square.',
          fr: 'Un musée sur l’histoire et l’archéologie de l’ouest du Salvador, à quelques pas de la place.',
          pt: 'Um museu sobre a história e a arqueologia do ocidente de El Salvador, a poucos passos da praça.',
        },
        story: {
          es: 'El Museo Regional de Occidente funciona en el antiguo edificio del Banco Central de Reserva y abrió al público en 1999. Guarda piezas arqueológicas de Santa Ana, Ahuachapán y Sonsonate, cuenta la historia reciente del occidente del país y tiene una colección de monedas salvadoreñas en la antigua bóveda del banco.',
          en: 'The Western Regional Museum is housed in the former Central Reserve Bank building and opened to the public in 1999. It holds archaeological pieces from Santa Ana, Ahuachapán and Sonsonate, tells the recent history of western El Salvador and has a collection of Salvadoran coins in the bank’s old vault.',
          fr: 'Le Musée régional de l’Ouest occupe l’ancien bâtiment de la Banque centrale de réserve et a ouvert au public en 1999. Il conserve des pièces archéologiques de Santa Ana, Ahuachapán et Sonsonate, raconte l’histoire récente de l’ouest du pays et présente une collection de monnaies salvadoriennes dans l’ancien coffre de la banque.',
          pt: 'O Museu Regional do Ocidente funciona no antigo edifício do Banco Central de Reserva e abriu ao público em 1999. Guarda peças arqueológicas de Santa Ana, Ahuachapán e Sonsonate, conta a história recente do ocidente do país e tem uma coleção de moedas salvadorenhas no antigo cofre do banco.',
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
