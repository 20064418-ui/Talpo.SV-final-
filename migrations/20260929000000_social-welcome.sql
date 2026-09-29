-- =====================================================================
-- Talapo.SV — Perfiles públicos, seguidores y correo de bienvenida
-- =====================================================================

-- 1) Perfil público opcional (activado por defecto) y marca del correo de bienvenida
alter table public.profiles add column if not exists is_public       boolean not null default true;
alter table public.profiles add column if not exists welcome_sent_at timestamptz;

-- 2) Seguidores: follower_id sigue a following_id
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);

alter table public.follows enable row level security;
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;

drop policy if exists "follows: public read" on public.follows;
drop policy if exists "follows: follow as me" on public.follows;
drop policy if exists "follows: unfollow as me" on public.follows;
create policy "follows: public read" on public.follows for select to anon, authenticated using (true);
create policy "follows: follow as me" on public.follows for insert to authenticated
  with check (follower_id = (select public.talapo_uid()));
create policy "follows: unfollow as me" on public.follows for delete to authenticated
  using (follower_id = (select public.talapo_uid()));

-- 3) Vista pública: SOLO datos seguros (nunca número de pasaporte ni fecha de nacimiento).
--    La vista corre con permisos de su dueño, así que muestra perfiles de otros aunque
--    la tabla profiles tenga RLS de "cada quien ve lo suyo".
create or replace view public.public_profiles as
select
  p.id,
  p.display_name,
  p.photo_url,
  p.nationality,
  p.current_streak,
  p.longest_streak,
  p.joined_at,
  (select count(*) from public.passport_stamps s where s.user_id = p.id and s.visited_at is not null)::int as stamps_visited,
  (select count(*) from public.follows f where f.following_id = p.id)::int as followers_count,
  (select count(*) from public.follows f where f.follower_id  = p.id)::int as following_count
from public.profiles p
where p.is_public and coalesce(p.display_name, '') <> '';

-- Sellos visitados de perfiles públicos (lugar + foto), para la galería del perfil
create or replace view public.public_stamps as
select s.id, s.user_id, s.place_name, s.photo_url, s.visited_at
from public.passport_stamps s
join public.profiles p on p.id = s.user_id
where p.is_public and s.visited_at is not null;

grant select on public.public_profiles, public.public_stamps to anon, authenticated;
