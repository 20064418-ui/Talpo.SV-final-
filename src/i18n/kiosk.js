/**
 * Idiomas de la página del Stand. Para agregar un idioma: añádelo a `languages`
 * y copia el bloque de `en` con las traducciones (y las de cada lugar en data/stands.js).
 */
import { ref, computed } from 'vue';

export const languages = [
  { code: 'es', label: 'Español', flag: '🇸🇻' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];
export const DEFAULT_LANG = 'es';

const messages = {
  es: {
    offline: 'Sin conexión', offlineText: 'Los formularios se guardan en la tablet y se enviarán solos cuando vuelva el internet.', pendingForms: '{n} pendiente(s)', savedOffline: '¡Guardado! 📶', savedOfflineText: 'No hay internet en este momento. Tu reporte quedó guardado en la tablet y se enviará automáticamente; el sello llegará a tu pasaporte cuando se envíe.', newsOffline: 'Mostrando las últimas noticias guardadas (sin conexión).',
    back: 'Atrás', home: 'Inicio', standOf: 'Stand', notFound: 'Stand no encontrado', goTalapo: 'Ir a Talapo.SV',
    badge: '✦ STAND TALAPO ✦', welcome: 'Bienvenido a {name}', tagline: 'El corazón del Santa Ana histórico', country: 'El Salvador',
    touch: '👆 Toca un botón para empezar', chooseLang: 'Idioma',
    btnNews: 'Noticias municipales', btnNewsText: 'Lo que está pasando en la ciudad',
    btnHistory: 'Historia', btnHistoryText: 'Escanea los códigos QR y descubre los lugares a tu alrededor',
    btnMap: 'Mapa', btnMapText: 'Lugares cercanos y cómo llegar',
    btnForm: 'Llena el formulario', btnFormText: 'Sella tu Pasaporte Talapo y reporta la zona',
    newsTitle: 'Noticias municipales', newsSub: 'Noticias y eventos de {city}, revisados por el equipo de Talapo.',
    loadingNews: 'Cargando noticias…', noNews: 'Todavía no hay noticias', noNewsText: '¡Sé el primero! Envía tu noticia municipal por correo con el código QR.',
    readMore: 'Leer más', showLess: 'Ver menos',
    shareTitle: '📩 Comparte tu noticia', shareText: '¿Tienes una noticia o un evento de tu comunidad? <b>Escanea este código</b> con la cámara de tu celular: se abrirá un correo listo para enviar.',
    step1: 'Escanea el código QR.', step2: 'Escribe tu noticia y adjunta tus fotos 📷.', step3: 'Envíalo: nuestro equipo la revisa y la publica aquí.',
    mailSubject: 'Noticia municipal — Parque Libertad, Santa Ana',
    mailBody: 'Título de la noticia:\n\n¿Qué pasó o qué va a pasar?:\n\nFecha y lugar:\n\nTu nombre y teléfono (opcional):\n\n📷 Adjunta tus fotos a este correo.\n',
    historyTitle: 'Historia', historySub: 'Escanea un código con la cámara de tu celular para llevarte la historia, o toca una tarjeta para leerla aquí.',
    youAreHere: 'Estás aquí', walking: '{dist} · {min} min caminando', fromStand: '{walk} desde el stand',
    tipLabel: 'Consejo Talapo:', howToGet: 'Cómo llegar', takeIt: '📱 Llévatelo', takeItText: 'Escanea para abrir la ruta a pie en tu celular.',
    discoverMore: 'Descubre más de El Salvador en', placeNotFound: 'Lugar no encontrado',
    mapTitle: 'Mapa', mapSub: 'Lugares alrededor de {name}. Toca uno para ver cómo llegar.', mapAria: 'Mapa de lugares cercanos',
    youAreHerePin: '📍 Estás aquí', readStory: 'Leer su historia', allPlaces: 'Todos los lugares', scanRoute: '📱 Escanea para abrir la ruta a pie en tu celular',
    formStamp: 'Sella tu Pasaporte Talapo', formStampText: 'Escribe tu <b>nombre de usuario de Talapo</b> y pondremos el sello de <b>{name}</b> en tu pasaporte automáticamente.',
    formUserHint: 'Lo puedes ver en tu Pasaporte Talapo, debajo de tu nombre.', noAccount: 'No tengo cuenta', continue: 'Continuar', backBtn: 'Atrás',
    zoneQ: '¿Cómo está la zona ahora?', zClean: 'Limpia', zCleanT: 'La zona se ve bien', zDirty: 'Un poco sucia', zDirtyT: 'Hay algo de basura', zVery: 'Muy sucia', zVeryT: 'Hay mucha basura',
    trashQ: '¿Hay basura en la zona?', yes: 'Sí', no: 'No', trashTypeQ: '¿Qué tipo de basura?', chooseAll: '(elige todos los que apliquen)',
    tPlastic: 'Plástico', tPaper: 'Papel / cartón', tGlass: 'Vidrio', tMetal: 'Latas / metal', tOrganic: 'Orgánica / comida', tBulky: 'Objetos grandes', tOther: 'Otro',
    urgQ: '¿Necesita que alguien llegue rápido?', uLow: 'No es urgente', uLowT: 'Puede esperar', uMed: 'Pronto', uMedT: 'Debería limpiarse hoy', uHigh: 'Urgente', uHighT: 'Alguien debe venir rápido',
    commentQ: '¿Algo más?', optional: '(opcional)', commentPh: 'Ej.: Hay basura junto a la fuente…', noTrash: 'Sin basura',
    send: 'Enviar', sending: 'Enviando…', stamped: '¡Sellado, {name}! 🎉', welcomeBack: '¡Bienvenido de nuevo, {name}! 🎉', traveler: 'viajero',
    stampedText: 'El sello <b>{stamp}</b> ya está en tu Pasaporte Talapo. ¡Gracias por reportar la zona!',
    thanks: '¡Gracias por ayudar!', userNotFound: 'No encontramos el usuario <b>@{user}</b>, pero tu reporte se guardó. Revísalo en tu Pasaporte Talapo e inténtalo la próxima vez.',
    reportSaved: 'Tu reporte se guardó y el equipo de la ciudad lo revisará.', createPassport: 'Crea tu Pasaporte Talapo', createPassportText: 'Escanea para unirte y coleccionar sellos de cada lugar que visites.',
    newReport: 'Nuevo reporte', backHome: 'Volver al inicio', autoHome: 'Esta pantalla vuelve al inicio en unos segundos.',
    notConnected: 'Talapo no está conectado (falta .env.local).', genericError: 'Algo salió mal. Intenta de nuevo.',
  },
  en: {
    offline: 'Offline', offlineText: 'Forms are saved on the tablet and will be sent automatically when the internet is back.', pendingForms: '{n} pending', savedOffline: 'Saved! 📶', savedOfflineText: 'There is no internet right now. Your report was saved on the tablet and will be sent automatically; the stamp will reach your passport once it is sent.', newsOffline: 'Showing the last saved news (offline).',
    back: 'Back', home: 'Home', standOf: 'Stand', notFound: 'Stand not found', goTalapo: 'Go to Talapo.SV',
    badge: '✦ TALAPO STAND ✦', welcome: 'Welcome to {name}', tagline: 'The heart of historic Santa Ana', country: 'El Salvador',
    touch: '👆 Touch a button to start', chooseLang: 'Language',
    btnNews: 'Municipal News', btnNewsText: 'What is happening in the city',
    btnHistory: 'History', btnHistoryText: 'Scan the QR codes and discover the places around you',
    btnMap: 'Map', btnMapText: 'Nearby places and how to get there',
    btnForm: 'Fill the form', btnFormText: 'Stamp your Talapo Passport and report the area',
    newsTitle: 'Municipal News', newsSub: 'News and events of {city}, reviewed by the Talapo team.',
    loadingNews: 'Loading news…', noNews: 'No news yet', noNewsText: 'Be the first! Send your municipal news by email using the QR code.',
    readMore: 'Read more', showLess: 'Show less',
    shareTitle: '📩 Share your news', shareText: 'Do you have news or an event from your community? <b>Scan this code</b> with your phone camera: it opens an email ready to send.',
    step1: 'Scan the QR code.', step2: 'Write your news and attach your photos 📷.', step3: 'Send it — our team reviews it and publishes it here.',
    mailSubject: 'Municipal news — Parque Libertad, Santa Ana',
    mailBody: 'Title of the news:\n\nWhat happened / what will happen:\n\nDate and place:\n\nYour name and phone (optional):\n\n📷 Attach your photos to this email.\n',
    historyTitle: 'History', historySub: 'Scan a code with your phone camera to take the story with you — or touch a card to read it here.',
    youAreHere: 'You are here', walking: '{dist} · {min} min walking', fromStand: '{walk} from the stand',
    tipLabel: 'Talapo tip:', howToGet: 'How to get there', takeIt: '📱 Take it with you', takeItText: 'Scan to open the walking route on your phone.',
    discoverMore: 'Discover more of El Salvador at', placeNotFound: 'Place not found',
    mapTitle: 'Map', mapSub: 'Places around {name}. Touch one to see how to get there.', mapAria: 'Map of nearby places',
    youAreHerePin: '📍 You are here', readStory: 'Read its story', allPlaces: 'All places', scanRoute: '📱 Scan to open the walking route on your phone',
    formStamp: 'Stamp your Talapo Passport', formStampText: 'Type your <b>Talapo username</b> and we will add the <b>{name}</b> stamp to your passport automatically.',
    formUserHint: 'You can see it in your Talapo Passport, below your name.', noAccount: "I don't have an account", continue: 'Continue', backBtn: 'Back',
    zoneQ: 'How is the area right now?', zClean: 'Clean', zCleanT: 'The area looks good', zDirty: 'A little dirty', zDirtyT: 'Some trash here and there', zVery: 'Very dirty', zVeryT: 'A lot of trash',
    trashQ: 'Is there trash in the area?', yes: 'Yes', no: 'No', trashTypeQ: 'What type of trash?', chooseAll: '(choose all that apply)',
    tPlastic: 'Plastic', tPaper: 'Paper / cardboard', tGlass: 'Glass', tMetal: 'Cans / metal', tOrganic: 'Organic / food', tBulky: 'Large objects', tOther: 'Other',
    urgQ: 'Does someone need to come quickly?', uLow: 'Not urgent', uLowT: 'It can wait', uMed: 'Soon', uMedT: 'Should be cleaned today', uHigh: 'Urgent', uHighT: 'Someone needs to come quickly',
    commentQ: 'Anything else?', optional: '(optional)', commentPh: 'e.g. There is trash next to the fountain…', noTrash: 'No trash',
    send: 'Send', sending: 'Sending…', stamped: 'Stamped, {name}! 🎉', welcomeBack: 'Welcome back, {name}! 🎉', traveler: 'traveler',
    stampedText: 'The <b>{stamp}</b> stamp is in your Talapo Passport. Thank you for reporting the area!',
    thanks: 'Thank you for helping!', userNotFound: "We couldn't find the username <b>@{user}</b>, but your report was saved. Check it in your Talapo Passport and try again next time.",
    reportSaved: 'Your report was saved and the city team will review it.', createPassport: 'Create your Talapo Passport', createPassportText: 'Scan to join and collect stamps from every place you visit.',
    newReport: 'New report', backHome: 'Back to home', autoHome: 'This screen returns to the home page in a few seconds.',
    notConnected: 'Talapo is not connected (missing .env.local).', genericError: 'Something went wrong. Please try again.',
  },
  fr: {
    offline: 'Hors ligne', offlineText: 'Les formulaires sont enregistrés sur la tablette et seront envoyés automatiquement au retour d’internet.', pendingForms: '{n} en attente', savedOffline: 'Enregistré ! 📶', savedOfflineText: 'Pas d’internet pour le moment. Votre signalement est enregistré sur la tablette et sera envoyé automatiquement ; le tampon arrivera dans votre passeport à l’envoi.', newsOffline: 'Dernières actualités enregistrées (hors ligne).',
    back: 'Retour', home: 'Accueil', standOf: 'Stand', notFound: 'Stand introuvable', goTalapo: 'Aller sur Talapo.SV',
    badge: '✦ STAND TALAPO ✦', welcome: 'Bienvenue au {name}', tagline: 'Le cœur historique de Santa Ana', country: 'Salvador',
    touch: '👆 Touchez un bouton pour commencer', chooseLang: 'Langue',
    btnNews: 'Actualités municipales', btnNewsText: 'Ce qui se passe en ville',
    btnHistory: 'Histoire', btnHistoryText: 'Scannez les codes QR et découvrez les lieux autour de vous',
    btnMap: 'Carte', btnMapText: 'Lieux proches et comment y aller',
    btnForm: 'Remplir le formulaire', btnFormText: 'Tamponnez votre Passeport Talapo et signalez l’état de la zone',
    newsTitle: 'Actualités municipales', newsSub: 'Actualités et événements de {city}, vérifiés par l’équipe Talapo.',
    loadingNews: 'Chargement des actualités…', noNews: 'Pas encore d’actualités', noNewsText: 'Soyez le premier ! Envoyez votre actualité par e-mail grâce au code QR.',
    readMore: 'Lire la suite', showLess: 'Réduire',
    shareTitle: '📩 Partagez votre actualité', shareText: 'Vous avez une nouvelle ou un événement de votre communauté ? <b>Scannez ce code</b> avec votre téléphone : un e-mail prêt à envoyer s’ouvrira.',
    step1: 'Scannez le code QR.', step2: 'Écrivez votre actualité et joignez vos photos 📷.', step3: 'Envoyez-le : notre équipe le vérifie et le publie ici.',
    mailSubject: 'Actualité municipale — Parque Libertad, Santa Ana',
    mailBody: 'Titre de l’actualité :\n\nCe qui s’est passé / va se passer :\n\nDate et lieu :\n\nVotre nom et téléphone (facultatif) :\n\n📷 Joignez vos photos à cet e-mail.\n',
    historyTitle: 'Histoire', historySub: 'Scannez un code avec votre téléphone pour emporter l’histoire, ou touchez une carte pour la lire ici.',
    youAreHere: 'Vous êtes ici', walking: '{dist} · {min} min à pied', fromStand: '{walk} du stand',
    tipLabel: 'Conseil Talapo :', howToGet: 'Comment y aller', takeIt: '📱 Emportez-le', takeItText: 'Scannez pour ouvrir l’itinéraire à pied sur votre téléphone.',
    discoverMore: 'Découvrez plus du Salvador sur', placeNotFound: 'Lieu introuvable',
    mapTitle: 'Carte', mapSub: 'Lieux autour du {name}. Touchez-en un pour voir comment y aller.', mapAria: 'Carte des lieux proches',
    youAreHerePin: '📍 Vous êtes ici', readStory: 'Lire son histoire', allPlaces: 'Tous les lieux', scanRoute: '📱 Scannez pour ouvrir l’itinéraire à pied',
    formStamp: 'Tamponnez votre Passeport Talapo', formStampText: 'Saisissez votre <b>nom d’utilisateur Talapo</b> et nous ajouterons automatiquement le tampon <b>{name}</b> à votre passeport.',
    formUserHint: 'Vous le trouverez dans votre Passeport Talapo, sous votre nom.', noAccount: 'Je n’ai pas de compte', continue: 'Continuer', backBtn: 'Retour',
    zoneQ: 'Dans quel état est la zone ?', zClean: 'Propre', zCleanT: 'La zone est en bon état', zDirty: 'Un peu sale', zDirtyT: 'Quelques déchets çà et là', zVery: 'Très sale', zVeryT: 'Beaucoup de déchets',
    trashQ: 'Y a-t-il des déchets dans la zone ?', yes: 'Oui', no: 'Non', trashTypeQ: 'Quel type de déchets ?', chooseAll: '(choisissez tout ce qui s’applique)',
    tPlastic: 'Plastique', tPaper: 'Papier / carton', tGlass: 'Verre', tMetal: 'Canettes / métal', tOrganic: 'Organique / nourriture', tBulky: 'Objets encombrants', tOther: 'Autre',
    urgQ: 'Faut-il que quelqu’un vienne rapidement ?', uLow: 'Pas urgent', uLowT: 'Cela peut attendre', uMed: 'Bientôt', uMedT: 'À nettoyer aujourd’hui', uHigh: 'Urgent', uHighT: 'Quelqu’un doit venir vite',
    commentQ: 'Autre chose ?', optional: '(facultatif)', commentPh: 'Ex. : Il y a des déchets près de la fontaine…', noTrash: 'Pas de déchets',
    send: 'Envoyer', sending: 'Envoi…', stamped: 'Tamponné, {name} ! 🎉', welcomeBack: 'Bon retour, {name} ! 🎉', traveler: 'voyageur',
    stampedText: 'Le tampon <b>{stamp}</b> est dans votre Passeport Talapo. Merci d’avoir signalé l’état de la zone !',
    thanks: 'Merci pour votre aide !', userNotFound: 'Nous n’avons pas trouvé l’utilisateur <b>@{user}</b>, mais votre signalement a été enregistré. Vérifiez-le dans votre Passeport Talapo.',
    reportSaved: 'Votre signalement a été enregistré et l’équipe de la ville l’examinera.', createPassport: 'Créez votre Passeport Talapo', createPassportText: 'Scannez pour vous inscrire et collectionner les tampons des lieux visités.',
    newReport: 'Nouveau signalement', backHome: 'Retour à l’accueil', autoHome: 'Cet écran revient à l’accueil dans quelques secondes.',
    notConnected: 'Talapo n’est pas connecté (.env.local manquant).', genericError: 'Une erreur s’est produite. Réessayez.',
  },
  pt: {
    offline: 'Sem conexão', offlineText: 'Os formulários ficam salvos no tablet e serão enviados sozinhos quando a internet voltar.', pendingForms: '{n} pendente(s)', savedOffline: 'Salvo! 📶', savedOfflineText: 'Sem internet no momento. Seu relato ficou salvo no tablet e será enviado automaticamente; o carimbo chegará ao seu passaporte quando for enviado.', newsOffline: 'Mostrando as últimas notícias salvas (sem conexão).',
    back: 'Voltar', home: 'Início', standOf: 'Stand', notFound: 'Stand não encontrado', goTalapo: 'Ir para Talapo.SV',
    badge: '✦ STAND TALAPO ✦', welcome: 'Bem-vindo ao {name}', tagline: 'O coração histórico de Santa Ana', country: 'El Salvador',
    touch: '👆 Toque em um botão para começar', chooseLang: 'Idioma',
    btnNews: 'Notícias municipais', btnNewsText: 'O que está acontecendo na cidade',
    btnHistory: 'História', btnHistoryText: 'Escaneie os códigos QR e descubra os lugares ao seu redor',
    btnMap: 'Mapa', btnMapText: 'Lugares próximos e como chegar',
    btnForm: 'Preencha o formulário', btnFormText: 'Carimbe seu Passaporte Talapo e informe como está a área',
    newsTitle: 'Notícias municipais', newsSub: 'Notícias e eventos de {city}, revisados pela equipe Talapo.',
    loadingNews: 'Carregando notícias…', noNews: 'Ainda não há notícias', noNewsText: 'Seja o primeiro! Envie sua notícia por e-mail usando o código QR.',
    readMore: 'Ler mais', showLess: 'Ver menos',
    shareTitle: '📩 Compartilhe sua notícia', shareText: 'Tem uma notícia ou um evento da sua comunidade? <b>Escaneie este código</b> com a câmera do celular: abrirá um e-mail pronto para enviar.',
    step1: 'Escaneie o código QR.', step2: 'Escreva sua notícia e anexe suas fotos 📷.', step3: 'Envie: nossa equipe revisa e publica aqui.',
    mailSubject: 'Notícia municipal — Parque Libertad, Santa Ana',
    mailBody: 'Título da notícia:\n\nO que aconteceu / o que vai acontecer:\n\nData e local:\n\nSeu nome e telefone (opcional):\n\n📷 Anexe suas fotos a este e-mail.\n',
    historyTitle: 'História', historySub: 'Escaneie um código com o celular para levar a história com você, ou toque em um cartão para ler aqui.',
    youAreHere: 'Você está aqui', walking: '{dist} · {min} min a pé', fromStand: '{walk} do stand',
    tipLabel: 'Dica Talapo:', howToGet: 'Como chegar', takeIt: '📱 Leve com você', takeItText: 'Escaneie para abrir a rota a pé no seu celular.',
    discoverMore: 'Descubra mais de El Salvador em', placeNotFound: 'Lugar não encontrado',
    mapTitle: 'Mapa', mapSub: 'Lugares ao redor do {name}. Toque em um para ver como chegar.', mapAria: 'Mapa de lugares próximos',
    youAreHerePin: '📍 Você está aqui', readStory: 'Ler a história', allPlaces: 'Todos os lugares', scanRoute: '📱 Escaneie para abrir a rota a pé no celular',
    formStamp: 'Carimbe seu Passaporte Talapo', formStampText: 'Digite seu <b>nome de usuário Talapo</b> e colocaremos o carimbo <b>{name}</b> no seu passaporte automaticamente.',
    formUserHint: 'Você pode vê-lo no seu Passaporte Talapo, abaixo do seu nome.', noAccount: 'Não tenho conta', continue: 'Continuar', backBtn: 'Voltar',
    zoneQ: 'Como está a área agora?', zClean: 'Limpa', zCleanT: 'A área está boa', zDirty: 'Um pouco suja', zDirtyT: 'Um pouco de lixo aqui e ali', zVery: 'Muito suja', zVeryT: 'Muito lixo',
    trashQ: 'Há lixo na área?', yes: 'Sim', no: 'Não', trashTypeQ: 'Que tipo de lixo?', chooseAll: '(escolha todos os que se aplicam)',
    tPlastic: 'Plástico', tPaper: 'Papel / papelão', tGlass: 'Vidro', tMetal: 'Latas / metal', tOrganic: 'Orgânico / comida', tBulky: 'Objetos grandes', tOther: 'Outro',
    urgQ: 'Alguém precisa vir rapidamente?', uLow: 'Não é urgente', uLowT: 'Pode esperar', uMed: 'Em breve', uMedT: 'Deve ser limpo hoje', uHigh: 'Urgente', uHighT: 'Alguém precisa vir rápido',
    commentQ: 'Algo mais?', optional: '(opcional)', commentPh: 'Ex.: Há lixo perto da fonte…', noTrash: 'Sem lixo',
    send: 'Enviar', sending: 'Enviando…', stamped: 'Carimbado, {name}! 🎉', welcomeBack: 'Bem-vindo de volta, {name}! 🎉', traveler: 'viajante',
    stampedText: 'O carimbo <b>{stamp}</b> já está no seu Passaporte Talapo. Obrigado por informar sobre a área!',
    thanks: 'Obrigado por ajudar!', userNotFound: 'Não encontramos o usuário <b>@{user}</b>, mas seu relato foi salvo. Confira no seu Passaporte Talapo e tente na próxima vez.',
    reportSaved: 'Seu relato foi salvo e a equipe da cidade vai analisá-lo.', createPassport: 'Crie seu Passaporte Talapo', createPassportText: 'Escaneie para participar e colecionar carimbos de cada lugar que visitar.',
    newReport: 'Novo relato', backHome: 'Voltar ao início', autoHome: 'Esta tela volta ao início em alguns segundos.',
    notConnected: 'Talapo não está conectado (falta .env.local).', genericError: 'Algo deu errado. Tente novamente.',
  },
};

const KEY = 'talapo_kiosk_lang';
const initial = (() => {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && messages[q]) return q;
  try { const s = sessionStorage.getItem(KEY); if (s && messages[s]) return s; } catch { /* sin almacenamiento */ }
  return DEFAULT_LANG;
})();

/** Idioma actual (compartido por todas las pantallas del stand). */
export const lang = ref(initial);
export function setLang(code) {
  if (!messages[code]) return;
  lang.value = code;
  try { sessionStorage.setItem(KEY, code); } catch { /* sin almacenamiento */ }
  document.documentElement.lang = code;
}

/** t('welcome', { name: 'Parque Libertad' }) */
export function t(key, params = {}) {
  const str = messages[lang.value]?.[key] ?? messages.en[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
}

/** Texto de un lugar en el idioma actual: loc(place.story) */
export function loc(value) {
  if (value == null || typeof value === 'string') return value ?? '';
  return value[lang.value] ?? value.en ?? value.es ?? '';
}

export const locale = computed(() => ({ es: 'es-SV', en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' }[lang.value] || 'es-SV'));

export function useKioskI18n() {
  return { lang, setLang, t, loc, languages, locale };
}
