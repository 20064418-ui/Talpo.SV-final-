-- =====================================================================
-- Talapo.SV — Herramientas extra para administradores
--   · Panel general (estadísticas)
--   · Reportes del Stand: ver, filtrar, marcar como resueltos, nota interna
--   · Usuarios: buscar, ocultar/mostrar en la comunidad, dar/quitar admin
--
-- Todo se hace con funciones SECURITY DEFINER que comprueban que quien
-- llama es administrador. Las tablas siguen sin políticas nuevas, así que
-- nadie puede saltarse la revisión desde el navegador.
--
-- Cómo aplicarla: InsForge Dashboard → SQL Editor → pegar y ejecutar.
-- =====================================================================

-- 1) Quién es el "dueño" (puede dar y quitar permisos de administrador)
create or replace function public.talapo_is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_admin and username = 'rocio.calderon' from public.profiles where id = public.talapo_uid()),
    false);
$$;
grant execute on function public.talapo_is_owner() to authenticated;

-- rocio.calderon queda como administradora (si ya existe su perfil)
update public.profiles set is_admin = true where username in ('rocio.calderon', 'daniel6310') and is_admin = true;

-- 2) Reportes del stand: estado de revisión
alter table public.stand_reports add column if not exists resolved    boolean not null default false;
alter table public.stand_reports add column if not exists resolved_at timestamptz;
alter table public.stand_reports add column if not exists resolved_by uuid references public.profiles (id) on delete set null;
alter table public.stand_reports add column if not exists admin_note  text check (char_length(admin_note) <= 500);
create index if not exists stand_reports_pending_idx on public.stand_reports (created_at desc) where not resolved;

-- 3) Panel general
create or replace function public.admin_overview()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  return json_build_object(
    'users',              (select count(*) from profiles),
    'users_7d',           (select count(*) from profiles where joined_at >= now() - interval '7 days'),
    'passports',          (select count(*) from profiles where passport_number is not null),
    'public_profiles',    (select count(*) from profiles where is_public),
    'admins',             (select count(*) from profiles where is_admin),
    'active_today',       (select count(*) from activity_log where active_date = current_date),
    'stamps',             (select count(*) from passport_stamps where visited_at is not null),
    'reports',            (select count(*) from stand_reports),
    'reports_pending',    (select count(*) from stand_reports where not resolved),
    'reports_urgent',     (select count(*) from stand_reports where not resolved and urgency = 'high'),
    'news_published',     (select count(*) from municipal_news where published),
    'news_drafts',        (select count(*) from municipal_news where not published),
    'forum_posts',        (select count(*) from forum_posts),
    'forum_hidden',       (select count(*) from forum_posts where hidden) + (select count(*) from forum_comments where hidden),
    'forum_reports',      (select count(*) from forum_reports where not resolved),
    'contest_entries',    (select count(*) from contest_entries),
    'contest_to_review',  (select count(*) from contest_entries where status = 'registered')
  );
end $$;
grant execute on function public.admin_overview() to authenticated;

-- 4) Reportes del stand (con el usuario que los envió, si usó su pasaporte)
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
           p.username, p.display_name, p.passport_number
    from public.stand_reports r
    left join public.profiles p on p.id = r.profile_id
    order by r.resolved asc, r.created_at desc
    limit least(greatest(p_limit, 1), 1000);
end $$;
grant execute on function public.admin_stand_reports(integer) to authenticated;

create or replace function public.admin_resolve_report(p_id uuid, p_resolved boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  update public.stand_reports
     set resolved = p_resolved,
         resolved_at = case when p_resolved then now() else null end,
         resolved_by = case when p_resolved then public.talapo_uid() else null end,
         admin_note = nullif(trim(coalesce(p_note, '')), '')
   where id = p_id;
end $$;
grant execute on function public.admin_resolve_report(uuid, boolean, text) to authenticated;

create or replace function public.admin_delete_report(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  delete from public.stand_reports where id = p_id;
end $$;
grant execute on function public.admin_delete_report(uuid) to authenticated;

-- 5) Usuarios
create or replace function public.admin_list_users(p_search text default null, p_limit integer default 200)
returns table (
  id uuid, username text, display_name text, nationality text, passport_number text,
  is_public boolean, is_admin boolean, joined_at timestamptz,
  current_streak integer, last_active_date date, stamps bigint, reports bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  return query
    select p.id, p.username, p.display_name, p.nationality, p.passport_number,
           p.is_public, p.is_admin, p.joined_at,
           p.current_streak, p.last_active_date,
           (select count(*) from public.passport_stamps s where s.user_id = p.id and s.visited_at is not null),
           (select count(*) from public.stand_reports r where r.profile_id = p.id)
    from public.profiles p
    where p_search is null or trim(p_search) = ''
       or p.username ilike '%' || trim(p_search) || '%'
       or p.display_name ilike '%' || trim(p_search) || '%'
       or p.passport_number ilike '%' || trim(p_search) || '%'
    order by p.joined_at desc
    limit least(greatest(p_limit, 1), 500);
end $$;
grant execute on function public.admin_list_users(text, integer) to authenticated;

-- Ocultar / mostrar un perfil en la comunidad de viajeros (cualquier admin)
create or replace function public.admin_set_public(p_user uuid, p_value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  update public.profiles set is_public = p_value where id = p_user;
end $$;
grant execute on function public.admin_set_public(uuid, boolean) to authenticated;

-- Dar o quitar permisos de administrador: SOLO el dueño (rocio.calderon)
create or replace function public.admin_set_admin(p_user uuid, p_value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.talapo_is_owner() then raise exception 'Only the owner can change administrators'; end if;
  if p_user = public.talapo_uid() then raise exception 'You cannot change your own access'; end if;
  update public.profiles set is_admin = p_value where id = p_user;
end $$;
grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;
