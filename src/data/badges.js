/**
 * Insignias del Pasaporte Talapo. Se ganan con datos verificados de la base de datos
 * (función my_badge_stats): sellos puestos por un Stand, racha, concursos, rutas, etc.
 * `value(s)` devuelve el progreso actual; `goal` es lo necesario para ganarla.
 */
export const badges = [
  { id: 'first-stamp', emoji: '🛂', name: 'First Stamp', desc: 'Get your first stamp at a Talapo Stand', value: (s) => s.stamps, goal: 1, tier: 'bronze' },
  { id: 'west-explorer', emoji: '🧭', name: 'Western Explorer', desc: 'Collect 3 stamps at Talapo Stands', value: (s) => s.stamps, goal: 3, tier: 'silver' },
  { id: 'globetrotter', emoji: '🌎', name: 'Salvadoran Globetrotter', desc: 'Collect 10 stamps across El Salvador', value: (s) => s.stamps, goal: 10, tier: 'gold' },
  { id: 'streak-7', emoji: '🔥', name: 'On Fire', desc: 'Reach a 7-day Talapo streak', value: (s) => s.longest_streak, goal: 7, tier: 'bronze' },
  { id: 'streak-30', emoji: '☄️', name: 'Unstoppable', desc: 'Reach a 30-day Talapo streak', value: (s) => s.longest_streak, goal: 30, tier: 'gold' },
  { id: 'route-maker', emoji: '🗺️', name: 'Route Maker', desc: 'Save your first Tours route', value: (s) => s.tours_routes, goal: 1, tier: 'bronze' },
  { id: 'trip-planner', emoji: '🗓️', name: 'Trip Planner', desc: 'Save a day-by-day itinerary', value: (s) => s.plans, goal: 1, tier: 'bronze' },
  { id: 'contestant', emoji: '🎬', name: 'Contestant', desc: 'Join a Talapo Contest', value: (s) => s.contests, goal: 1, tier: 'bronze' },
  { id: 'champion', emoji: '🏆', name: 'Talapo Champion', desc: 'Win a Talapo Contest', value: (s) => s.wins, goal: 1, tier: 'gold' },
  { id: 'eco-guardian', emoji: '🌳', name: 'Eco Guardian', desc: 'Report the state of an area 3 times at a Stand', value: (s) => s.reports, goal: 3, tier: 'silver' },
  { id: 'storyteller', emoji: '✍️', name: 'Storyteller', desc: 'Share a post in the Forum', value: (s) => s.posts, goal: 1, tier: 'bronze' },
  { id: 'social', emoji: '🤝', name: 'Talapo Friend', desc: 'Get 5 followers', value: (s) => s.followers, goal: 5, tier: 'silver' },
];

export const tierColors = {
  bronze: ['#f6d7b8', '#9a5b2a'],
  silver: ['#e2e8f0', '#475569'],
  gold: ['#fde68a', '#92400e'],
};

/** Insignias ganadas con los datos públicos de un perfil (para el perfil de otros viajeros). */
export function publicBadges(p) {
  const s = { stamps: p.stamps_visited || 0, longest_streak: Math.max(p.longest_streak || 0, p.current_streak || 0), followers: p.followers_count || 0 };
  return badges.filter((b) => ['first-stamp', 'west-explorer', 'globetrotter', 'streak-7', 'streak-30', 'social'].includes(b.id) && b.value(s) >= b.goal);
}
