-- =====================================================================
-- Talapo.SV — Nombre de usuario único (@usuario) para el Stand
--   · profiles.username: único, minúsculas, 3 a 24 caracteres (letras, números, punto y guion bajo)
--   · stand_submit(): ahora busca a la persona por su NOMBRE DE USUARIO
-- =====================================================================

alter table public.profiles add column if not exists username text;

do $$ begin
  alter table public.profiles add constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9._]{3,24}$');
exception when duplicate_object then null; end $$;

create unique index if not exists profiles_username_unique on public.profiles (lower(username));

-- Rellenar con el usuario que ya se guardó al registrarse (si existe y no está repetido)
do $$
declare r record;
begin
  for r in
    select u.id, lower(regexp_replace(u.profile->>'username', '[^a-zA-Z0-9._]', '', 'g')) as uname
    from auth.users u
    where coalesce(u.profile->>'username', '') <> ''
  loop
    begin
      update public.profiles set username = r.uname
      where id = r.id and username is null and r.uname ~ '^[a-z0-9._]{3,24}$';
    exception when unique_violation then null;
    end;
  end loop;
exception when others then
  raise notice 'No se pudo copiar el usuario desde auth.users: %', sqlerrm;
end $$;

-- ¿Está libre este usuario? (para avisar al registrarse o al editar el pasaporte)
create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(both '@' from trim(p_username)))
      and id is distinct from public.talapo_uid()
  );
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- Perfil público: ahora también muestra el @usuario
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
  (select count(*) from public.follows f where f.follower_id  = p.id)::int as following_count,
  p.username
from public.profiles p
where p.is_public and coalesce(p.display_name, '') <> '';
grant select on public.public_profiles to anon, authenticated;

-- stand_submit: el segundo dato ahora es el NOMBRE DE USUARIO (con o sin @).
-- (Por compatibilidad también acepta un número de pasaporte.)
create or replace function public.stand_submit(
  p_stand     text,
  p_passport  text,
  p_zone      text,
  p_has_trash boolean,
  p_trash     text[],
  p_urgency   text,
  p_comment   text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stand   public.stands;
  v_profile public.profiles;
  v_stamp   public.passport_stamps;
  v_already boolean := false;
  v_trash   text[];
  v_who     text := lower(trim(both '@' from trim(coalesce(p_passport, ''))));
begin
  select * into v_stand from public.stands where id = p_stand;
  if not found then raise exception 'Unknown stand'; end if;

  select coalesce(array_agg(t), '{}') into v_trash
  from unnest(coalesce(p_trash, '{}')) t
  where t in ('plastic', 'paper', 'glass', 'metal', 'organic', 'bulky', 'other');

  if v_who <> '' then
    select * into v_profile from public.profiles where lower(username) = v_who limit 1;
    if v_profile.id is null then
      select * into v_profile from public.profiles
      where lower(replace(passport_number, ' ', '')) = replace(v_who, ' ', '')
      limit 1;
    end if;
  end if;

  insert into public.stand_reports (stand_id, profile_id, zone_status, has_trash, trash_types, urgency, comment)
  values (v_stand.id, v_profile.id, p_zone, coalesce(p_has_trash, false),
          case when coalesce(p_has_trash, false) then v_trash else '{}' end,
          p_urgency, nullif(left(trim(coalesce(p_comment, '')), 500), ''));

  if v_profile.id is not null then
    select * into v_stamp from public.passport_stamps
    where user_id = v_profile.id and place_name = v_stand.stamp_name
    limit 1;
    if found then
      v_already := v_stamp.visited_at is not null;
      update public.passport_stamps
        set visited_at = now(), photo_url = coalesce(photo_url, v_stand.stamp_photo)
        where id = v_stamp.id;
    else
      insert into public.passport_stamps (user_id, place_name, photo_url, visited_at)
      values (v_profile.id, v_stand.stamp_name, v_stand.stamp_photo, now());
    end if;
  end if;

  return json_build_object(
    'passport_found', v_profile.id is not null,
    'first_name', split_part(coalesce(v_profile.display_name, ''), ' ', 1),
    'already_stamped', v_already,
    'stamp_name', v_stand.stamp_name
  );
end $$;

revoke all on function public.stand_submit(text, text, text, boolean, text[], text, text) from public;
grant execute on function public.stand_submit(text, text, text, boolean, text[], text, text) to anon, authenticated;
