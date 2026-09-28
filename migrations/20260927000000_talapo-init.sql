-- =====================================================================
-- Talapo.SV — esquema inicial para InsForge (PostgreSQL 15 + PostgREST)
-- Aplicar con:  npx @insforge/cli db migrations up --all
-- (o pegar en Dashboard → Database → SQL Editor)
-- =====================================================================

-- Id del usuario autenticado, leído del JWT (claim "sub") que PostgREST expone.
create or replace function public.talapo_uid()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$$;

-- ---------------------------------------------------------------------
-- 1. Perfil / Pasaporte Talapo  (una fila por usuario)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  display_name        text,
  avatar_url          text,
  nationality         text,
  passport_number     text,
  birth_date          date,
  photo_url           text,
  passport_created_at timestamptz,
  joined_at           timestamptz not null default now(),   -- "tiempo en la Familia Talapo"
  current_streak      integer not null default 0,
  longest_streak      integer not null default 0,
  last_active_date    date,
  updated_at          timestamptz not null default now()
);

-- Días activos (para la racha diaria/semanal y el calendario de 12 semanas)
create table if not exists public.activity_log (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  active_date date not null,
  primary key (user_id, active_date)
);

-- Sellos del pasaporte (lugares que el usuario quiere visitar / ya visitó)
create table if not exists public.passport_stamps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  place_name  text not null check (char_length(place_name) between 1 and 60),
  photo_url   text,
  visited_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists passport_stamps_user_idx on public.passport_stamps (user_id);

-- ---------------------------------------------------------------------
-- 2. Itinerarios guardados (desde la página Tours)
-- ---------------------------------------------------------------------
create table if not exists public.itineraries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 80),
  start_lat    double precision not null,
  start_lng    double precision not null,
  stops        jsonb not null default '[]'::jsonb,   -- [{id,name,lat,lng,place,img}]
  distance_km  numeric(8,2),
  duration_min integer,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists itineraries_user_idx on public.itineraries (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. Concursos Talapo
-- ---------------------------------------------------------------------
create table if not exists public.contest_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  challenge        text not null check (challenge in
                     ('tiktok-guanaco','meme-patrio','ruta-sonada','bendicion-mama','doblaje')),
  participant_name text not null check (char_length(participant_name) between 1 and 80),
  institution      text not null,
  grade            text not null,
  status           text not null default 'registered'
                     check (status in ('registered','submitted','reviewed','winner')),
  score            integer not null default 0,     -- lo asigna el equipo Talapo (admin)
  created_at       timestamptz not null default now(),
  unique (user_id, challenge)
);

-- Ranking público: solo nombre, institución y puntos (sin correos ni ids)
create or replace view public.ranking_talapo as
  select participant_name,
         max(institution)  as institution,
         sum(score)::int   as total_score,
         count(*)::int     as challenges
  from public.contest_entries
  group by participant_name
  order by total_score desc, challenges desc, participant_name;

-- ---------------------------------------------------------------------
-- 4. Racha Talapo: registra hoy y recalcula (zona horaria de El Salvador)
-- ---------------------------------------------------------------------
create or replace function public.touch_streak()
returns setof public.profiles
language plpgsql security invoker as $$
declare
  uid   uuid := public.talapo_uid();
  today date := (now() at time zone 'America/El_Salvador')::date;
  prof  public.profiles;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into prof from public.profiles where id = uid for update;
  if not found then
    insert into public.profiles (id) values (uid) returning * into prof;
  end if;

  insert into public.activity_log (user_id, active_date) values (uid, today)
  on conflict do nothing;

  if prof.last_active_date is distinct from today then
    update public.profiles set
      current_streak   = case when last_active_date = today - 1 then current_streak + 1 else 1 end,
      longest_streak   = greatest(longest_streak,
                           case when last_active_date = today - 1 then current_streak + 1 else 1 end),
      last_active_date = today,
      updated_at       = now()
    where id = uid;
  end if;

  return query select * from public.profiles where id = uid;
end $$;

-- Mantener updated_at y proteger campos que el usuario no debe tocar
create or replace function public.profiles_guard()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if current_setting('request.jwt.claims', true)::json ->> 'role' = 'authenticated' then
    new.joined_at := old.joined_at;   -- la antigüedad en la Familia Talapo no se puede editar
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- El usuario no puede subirse la puntuación ni declararse ganador
create or replace function public.contest_guard()
returns trigger language plpgsql as $$
begin
  if current_setting('request.jwt.claims', true)::json ->> 'role' = 'authenticated' then
    if tg_op = 'INSERT' then
      new.score := 0; new.status := 'registered';
    else
      new.score := old.score; new.status := old.status;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists contest_guard on public.contest_entries;
create trigger contest_guard before insert or update on public.contest_entries
  for each row execute function public.contest_guard();

-- ---------------------------------------------------------------------
-- 5. Permisos + Row Level Security (cada usuario solo ve lo suyo)
-- ---------------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.activity_log to authenticated;
grant select, insert, update, delete on public.passport_stamps, public.itineraries to authenticated;
grant select, insert, update on public.contest_entries to authenticated;
grant select on public.ranking_talapo to anon, authenticated;
grant execute on function public.touch_streak(), public.talapo_uid() to authenticated;

alter table public.profiles        enable row level security;
alter table public.activity_log    enable row level security;
alter table public.passport_stamps enable row level security;
alter table public.itineraries     enable row level security;
alter table public.contest_entries enable row level security;

-- profiles
drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read own"   on public.profiles for select to authenticated using (id = (select public.talapo_uid()));
create policy "profiles: insert own" on public.profiles for insert to authenticated with check (id = (select public.talapo_uid()));
create policy "profiles: update own" on public.profiles for update to authenticated using (id = (select public.talapo_uid())) with check (id = (select public.talapo_uid()));

-- activity_log
drop policy if exists "activity: read own"   on public.activity_log;
drop policy if exists "activity: insert own" on public.activity_log;
create policy "activity: read own"   on public.activity_log for select to authenticated using (user_id = (select public.talapo_uid()));
create policy "activity: insert own" on public.activity_log for insert to authenticated with check (user_id = (select public.talapo_uid()));

-- passport_stamps, itineraries: CRUD propio
do $$
declare t text;
begin
  foreach t in array array['passport_stamps', 'itineraries'] loop
    execute format('drop policy if exists "%1$s: read own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s: insert own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s: update own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s: delete own" on public.%1$s', t);
    execute format('create policy "%1$s: read own" on public.%1$s for select to authenticated using (user_id = (select public.talapo_uid()))', t);
    execute format('create policy "%1$s: insert own" on public.%1$s for insert to authenticated with check (user_id = (select public.talapo_uid()))', t);
    execute format('create policy "%1$s: update own" on public.%1$s for update to authenticated using (user_id = (select public.talapo_uid())) with check (user_id = (select public.talapo_uid()))', t);
    execute format('create policy "%1$s: delete own" on public.%1$s for delete to authenticated using (user_id = (select public.talapo_uid()))', t);
  end loop;
end $$;

-- contest_entries: leer/crear/editar las propias (el ranking va por la vista)
drop policy if exists "contests: read own"   on public.contest_entries;
drop policy if exists "contests: insert own" on public.contest_entries;
drop policy if exists "contests: update own" on public.contest_entries;
create policy "contests: read own"   on public.contest_entries for select to authenticated using (user_id = (select public.talapo_uid()));
create policy "contests: insert own" on public.contest_entries for insert to authenticated with check (user_id = (select public.talapo_uid()));
create policy "contests: update own" on public.contest_entries for update to authenticated using (user_id = (select public.talapo_uid())) with check (user_id = (select public.talapo_uid()));
