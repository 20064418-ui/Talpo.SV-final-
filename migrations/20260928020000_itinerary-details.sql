-- Talapo.SV — Itinerarios del generador "talapo-itinerario" (plan completo por días)
-- source: 'tours' (armador de rutas) o 'planner' (generador de itinerarios por días)
-- details: el itinerario completo (datos del formulario + días + paradas + presupuesto)
alter table public.itineraries add column if not exists source  text  not null default 'tours';
alter table public.itineraries add column if not exists details jsonb;

do $$ begin
  alter table public.itineraries add constraint itineraries_source_check check (source in ('tours', 'planner'));
exception when duplicate_object then null; end $$;

-- El plan por días puede no tener coordenadas de partida
alter table public.itineraries alter column start_lat drop not null;
alter table public.itineraries alter column start_lng drop not null;
