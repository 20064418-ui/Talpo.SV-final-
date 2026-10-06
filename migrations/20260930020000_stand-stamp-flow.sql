-- =====================================================================
-- Talapo.SV — Nuevo flujo del Stand
--   1) El formulario se llena SIEMPRE, sin cuenta.
--   2) Al final, la persona escribe su @usuario y recibe el sello.
--   3) Cada reporte guarda el N° de pasaporte para saber quién lo envió.
--   4) Si se equivocó al escribir el usuario, puede corregirlo (30 min).
--
-- Cómo aplicarla: InsForge Dashboard → SQL Editor → pegar el CONTENIDO y Run.
-- (Si aún no corriste 20260930000000_admin-tools.sql, córrelo antes.)
-- =====================================================================

alter table public.stand_reports add column if not exists passport_number text;

-- Oculta casi todo el número (se muestra en la tablet del stand): ••••••123
create or replace function public._mask_passport(p text)
returns text language sql immutable as $$
  select case when p is null or btrim(p) = '' then null
              when length(p) <= 3 then repeat('•', length(p))
              else repeat('•', length(p) - 3) || right(p, 3) end;
$$;

-- Busca a una persona por @usuario (o por N° de pasaporte)
create or replace function public._find_profile(p_who text)
returns public.profiles language plpgsql stable security definer set search_path = public as $$
declare v_who text := lower(trim(both '@' from trim(coalesce(p_who, ''))));
        v public.profiles;
begin
  if v_who = '' then return null; end if;
  select * into v from public.profiles where lower(username) = v_who limit 1;
  if v.id is null then
    select * into v from public.profiles
    where lower(replace(passport_number, ' ', '')) = replace(v_who, ' ', '') limit 1;
  end if;
  return v;
end $$;

-- Pone (o renueva) el sello. Devuelve true si ya lo tenía.
create or replace function public._stand_stamp(p_user uuid, p_place text, p_photo text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_stamp public.passport_stamps; v_already boolean := false;
begin
  select * into v_stamp from public.passport_stamps where user_id = p_user and place_name = p_place limit 1;
  if found then
    v_already := v_stamp.visited_at is not null;
    update public.passport_stamps set visited_at = now(), photo_url = coalesce(photo_url, p_photo) where id = v_stamp.id;
  else
    insert into public.passport_stamps (user_id, place_name, photo_url, visited_at) values (p_user, p_place, p_photo, now());
  end if;
  return v_already;
end $$;
revoke all on function public._find_profile(text) from public, anon, authenticated;
revoke all on function public._stand_stamp(uuid, text, text) from public, anon, authenticated;

-- 1) Guardar el reporte (con o sin usuario) --------------------------
create or replace function public.stand_submit(
  p_stand text, p_passport text, p_zone text, p_has_trash boolean,
  p_trash text[], p_urgency text, p_comment text
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_stand public.stands; v_profile public.profiles; v_already boolean := false;
  v_trash text[]; v_id uuid;
begin
  select * into v_stand from public.stands where id = p_stand;
  if not found then raise exception 'Unknown stand'; end if;

  select coalesce(array_agg(t), '{}') into v_trash
  from unnest(coalesce(p_trash, '{}')) t
  where t in ('plastic', 'paper', 'glass', 'metal', 'organic', 'bulky', 'other');

  v_profile := public._find_profile(p_passport);

  insert into public.stand_reports (stand_id, profile_id, passport_number, zone_status, has_trash, trash_types, urgency, comment)
  values (v_stand.id, v_profile.id, v_profile.passport_number, p_zone, coalesce(p_has_trash, false),
          case when coalesce(p_has_trash, false) then v_trash else '{}' end,
          p_urgency, nullif(left(trim(coalesce(p_comment, '')), 500), ''))
  returning id into v_id;

  if v_profile.id is not null then
    v_already := public._stand_stamp(v_profile.id, v_stand.stamp_name, v_stand.stamp_photo);
  end if;

  return json_build_object(
    'report_id', v_id,
    'passport_found', v_profile.id is not null,
    'first_name', split_part(coalesce(v_profile.display_name, ''), ' ', 1),
    'passport_masked', public._mask_passport(v_profile.passport_number),
    'already_stamped', v_already,
    'stamp_name', v_stand.stamp_name
  );
end $$;
revoke all on function public.stand_submit(text, text, text, boolean, text[], text, text) from public;
grant execute on function public.stand_submit(text, text, text, boolean, text[], text, text) to anon, authenticated;

-- 2) Confirmar quién es mientras escribe (nombre + pasaporte oculto) --
create or replace function public.stand_lookup_user(p_user text)
returns json language plpgsql stable security definer set search_path = public as $$
declare v public.profiles;
begin
  v := public._find_profile(p_user);
  if v.id is null then return json_build_object('found', false); end if;
  return json_build_object('found', true,
    'first_name', split_part(coalesce(v.display_name, ''), ' ', 1),
    'passport_masked', public._mask_passport(v.passport_number));
end $$;
revoke all on function public.stand_lookup_user(text) from public;
grant execute on function public.stand_lookup_user(text) to anon, authenticated;

-- 3) Corregir el usuario después de enviar (solo con el id del reporte, 30 min) --
create or replace function public.stand_claim_stamp(p_report uuid, p_user text)
returns json language plpgsql security definer set search_path = public as $$
declare v_report public.stand_reports; v_stand public.stands; v_profile public.profiles; v_already boolean;
begin
  select * into v_report from public.stand_reports where id = p_report;
  if not found then raise exception 'Report not found'; end if;
  if v_report.profile_id is not null then raise exception 'This report already has a passport'; end if;
  if v_report.created_at < now() - interval '30 minutes' then raise exception 'This report is too old to add a stamp'; end if;

  v_profile := public._find_profile(p_user);
  if v_profile.id is null then return json_build_object('passport_found', false); end if;

  select * into v_stand from public.stands where id = v_report.stand_id;
  update public.stand_reports set profile_id = v_profile.id, passport_number = v_profile.passport_number where id = v_report.id;
  v_already := public._stand_stamp(v_profile.id, v_stand.stamp_name, v_stand.stamp_photo);

  return json_build_object(
    'report_id', v_report.id, 'passport_found', true,
    'first_name', split_part(coalesce(v_profile.display_name, ''), ' ', 1),
    'passport_masked', public._mask_passport(v_profile.passport_number),
    'already_stamped', v_already, 'stamp_name', v_stand.stamp_name);
end $$;
revoke all on function public.stand_claim_stamp(uuid, text) from public;
grant execute on function public.stand_claim_stamp(uuid, text) to anon, authenticated;

-- 4) El panel de administración ve el N° de pasaporte guardado en el reporte
create or replace function public.admin_stand_reports(p_limit integer default 300)
returns table (
  id uuid, stand_id text, zone_status text, has_trash boolean, trash_types text[],
  urgency text, comment text, created_at timestamptz,
  resolved boolean, resolved_at timestamptz, admin_note text,
  username text, display_name text, passport_number text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  return query
    select r.id, r.stand_id, r.zone_status, r.has_trash, r.trash_types,
           r.urgency, r.comment, r.created_at,
           r.resolved, r.resolved_at, r.admin_note,
           p.username, p.display_name, coalesce(r.passport_number, p.passport_number)
    from public.stand_reports r
    left join public.profiles p on p.id = r.profile_id
    order by r.resolved asc, r.created_at desc
    limit least(greatest(p_limit, 1), 1000);
end $$;
