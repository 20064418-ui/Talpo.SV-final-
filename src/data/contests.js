/** Las 5 dinámicas de los Concursos Talapo. `slug` debe coincidir con el CHECK de la tabla contest_entries. */
export const challenges = [
  {
    slug: 'tiktok-guanaco', emoji: '🎬', title: 'TikTok / Reel Guanaco', color: '#e46d5c',
    challenge: 'Record a short 15–30 second video showing Salvadoran slang or everyday situations that “only happen in El Salvador”.',
    submit: 'Video file or link (TikTok / Instagram / Google Drive).',
  },
  {
    slug: 'meme-patrio', emoji: '🎨', title: 'Meme Guanaco Patrio', color: '#1c6e6b',
    challenge: 'Create an original meme that mixes school life with Salvadoran tourism.',
    submit: 'Meme image in JPG or PNG format.',
  },
  {
    slug: 'ruta-sonada', emoji: '🗺️', title: 'La Ruta Soñada', color: '#3d7f4a',
    challenge: 'Plan an express 1-day itinerary for a tourist with a $20 budget — transport, food and destination included.',
    submit: 'Text or image with the detailed itinerary. Tip: build it in Tours and screenshot it.',
  },
  {
    slug: 'bendicion-mama', emoji: '👵⚡', title: 'Bendición de Mamá', color: '#f2a93b',
    challenge: 'Record a mini video or take a funny photo recreating a classic Salvadoran family trip scene — pan con pollo wrapped in foil, or wearing a sweater at the beach.',
    submit: 'Funny photo or video.',
  },
  {
    slug: 'doblaje', emoji: '🗣️🎬', title: 'Movie Dub', color: '#0a2f44',
    challenge: 'Take a 15-second clip from a famous movie and dub the voices as if the characters were lost in El Salvador or hunting for pupusas.',
    submit: 'Video with your voice dub.',
  },
];

export const SUBMIT_EMAIL = 'avisos.talapo@gmail.com';
export const SUBJECT_TEMPLATE = 'Talapo Challenge - [Team/Student Name] + [Institution] + [Grade]';
