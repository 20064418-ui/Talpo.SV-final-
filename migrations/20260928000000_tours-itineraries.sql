-- Talapo.SV — campos extra de itinerarios usados por la página Tours
-- (nombre del punto de partida y si la ruta vino de OSRM o es estimación en línea recta)
alter table public.itineraries add column if not exists start_label    text;
alter table public.itineraries add column if not exists is_exact_route boolean not null default true;
