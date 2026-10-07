// Tipos de actividad del itinerario armado por Talapo (editor del admin y My trips)
export const KINDS = [
  { id: 'hotel', label: 'Hotel', emoji: '🏨', color: '#6d5bd0' },
  { id: 'tour', label: 'Tour', emoji: '🧭', color: '#1C6E6B' },
  { id: 'food', label: 'Food', emoji: '🍽️', color: '#E46D5C' },
  { id: 'transport', label: 'Transport', emoji: '🚐', color: '#0284c7' },
  { id: 'flight', label: 'Flight', emoji: '✈️', color: '#0A2F44' },
  { id: 'activity', label: 'Activity', emoji: '⭐', color: '#E2B13C' },
  { id: 'free', label: 'Free time', emoji: '☀️', color: '#8aa0ab' },
];
export const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[5];

/** Fecha del día N a partir de la fecha de inicio ("Sat, Nov 14") */
export function dayDate(start, i) {
  if (!start) return '';
  const d = new Date(`${String(start).slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + i);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "14:30" → "2:30 PM" */
export function niceTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
