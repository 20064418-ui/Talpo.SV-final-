-- ---------------------------------------------------------------------
-- 1) REGISTRO DE ACTIVIDAD
-- ---------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.profiles (id) on delete set null,
  admin_name  text,
  action      text not null check (char_length(action) between 2 and 60),
  target_type text,
  target_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;
-- Sin políticas: solo se lee y escribe con las funciones de abajo.

-- Uso interno (no se expone): escribe una fila a nombre de quien llama
create or replace function public._admin_log(p_action text, p_type text, p_target text, p_details jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  select coalesce('@' || username, display_name) into v_name from public.profiles where id = public.talapo_uid();
  insert into public.admin_audit_log (admin_id, admin_name, action, target_type, target_id, details)
  values (public.talapo_uid(), v_name, p_action, p_type, p_target, coalesce(p_details, '{}'::jsonb));
end $$;
revoke all on function public._admin_log(text, text, text, jsonb) from public, anon, authenticated;

-- Para que la página registre acciones hechas directamente sobre tablas (noticias, foro, concursos…)
create or replace function public.admin_log(p_action text, p_type text default null, p_target text default null, p_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  perform public._admin_log(left(p_action, 60), left(p_type, 40), left(p_target, 80), p_details);
end $$;
grant execute on function public.admin_log(text, text, text, jsonb) to authenticated;

create or replace function public.admin_activity(p_limit integer default 300, p_action text default null)
returns table (id uuid, admin_name text, action text, target_type text, target_id text, details jsonb, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  return query
    select l.id, l.admin_name, l.action, l.target_type, l.target_id, l.details, l.created_at
    from public.admin_audit_log l
    where p_action is null or l.action = p_action
    order by l.created_at desc
    limit least(greatest(p_limit, 1), 1000);
end $$;
grant execute on function public.admin_activity(integer, text) to authenticated;

-- Las funciones de la parte 1 ahora también dejan registro
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
  perform public._admin_log(case when p_resolved then 'report.resolve' else 'report.reopen' end, 'stand_report', p_id::text,
                            jsonb_build_object('note', nullif(trim(coalesce(p_note, '')), '')));
end $$;

create or replace function public.admin_delete_report(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  delete from public.stand_reports where id = p_id;
  perform public._admin_log('report.delete', 'stand_report', p_id::text, '{}'::jsonb);
end $$;

create or replace function public.admin_set_public(p_user uuid, p_value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  update public.profiles set is_public = p_value where id = p_user;
  perform public._admin_log(case when p_value then 'user.show' else 'user.hide' end, 'user', p_user::text, '{}'::jsonb);
end $$;

create or replace function public.admin_set_admin(p_user uuid, p_value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.talapo_is_owner() then raise exception 'Only the owner can change administrators'; end if;
  if p_user = public.talapo_uid() then raise exception 'You cannot change your own access'; end if;
  update public.profiles set is_admin = p_value where id = p_user;
  perform public._admin_log(case when p_value then 'admin.grant' else 'admin.revoke' end, 'user', p_user::text, '{}'::jsonb);
end $$;

-- ---------------------------------------------------------------------
-- 2) ANUNCIOS PARA TODO EL SITIO
-- ---------------------------------------------------------------------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  message    text not null check (char_length(message) between 3 and 300),
  level      text not null default 'info' check (level in ('info', 'success', 'warning', 'urgent')),
  link_url   text check (char_length(link_url) <= 300),
  link_label text check (char_length(link_label) <= 40),
  active     boolean not null default true,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
drop policy if exists "announcements: public read"  on public.announcements;
drop policy if exists "announcements: admin read"   on public.announcements;
drop policy if exists "announcements: admin insert" on public.announcements;
drop policy if exists "announcements: admin update" on public.announcements;
drop policy if exists "announcements: admin delete" on public.announcements;
-- Cualquiera ve solo los anuncios activos y vigentes
create policy "announcements: public read" on public.announcements for select to anon, authenticated
  using (active and starts_at <= now() and (ends_at is null or ends_at > now()));
create policy "announcements: admin read"   on public.announcements for select to authenticated using ((select public.talapo_is_admin()));
create policy "announcements: admin insert" on public.announcements for insert to authenticated with check ((select public.talapo_is_admin()));
create policy "announcements: admin update" on public.announcements for update to authenticated using ((select public.talapo_is_admin()));
create policy "announcements: admin delete" on public.announcements for delete to authenticated using ((select public.talapo_is_admin()));

-- ---------------------------------------------------------------------
-- 3) NOTAS INTERNAS + DETALLE DE USUARIO
-- ---------------------------------------------------------------------
create table if not exists public.admin_user_notes (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  note       text not null check (char_length(note) <= 1000),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.admin_user_notes enable row level security;

create or replace function public.admin_user_detail(p_user uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare r json;
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  select json_build_object(
    'note',    (select note from public.admin_user_notes where user_id = p_user),
    'stamps',  coalesce((select json_agg(json_build_object('id', s.id, 'place_name', s.place_name, 'visited_at', s.visited_at) order by s.created_at)
                         from public.passport_stamps s where s.user_id = p_user), '[]'::json),
    'posts',    (select count(*) from public.forum_posts    where user_id = p_user),
    'contests', (select count(*) from public.contest_entries where user_id = p_user),
    'reports',  (select count(*) from public.stand_reports  where profile_id = p_user),
    'active_days', (select count(*) from public.activity_log where user_id = p_user),
    'longest_streak', (select longest_streak from public.profiles where id = p_user)
  ) into r;
  return r;
end $$;
grant execute on function public.admin_user_detail(uuid) to authenticated;

create or replace function public.admin_save_user_note(p_user uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  if nullif(trim(coalesce(p_note, '')), '') is null then
    delete from public.admin_user_notes where user_id = p_user;
  else
    insert into public.admin_user_notes (user_id, note, updated_by, updated_at)
    values (p_user, left(trim(p_note), 1000), public.talapo_uid(), now())
    on conflict (user_id) do update set note = excluded.note, updated_by = excluded.updated_by, updated_at = now();
  end if;
  perform public._admin_log('user.note', 'user', p_user::text, '{}'::jsonb);
end $$;
grant execute on function public.admin_save_user_note(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4) SELLOS MANUALES (por ejemplo, si la tablet falló ese día)
-- ---------------------------------------------------------------------
create or replace function public.admin_add_stamp(p_user uuid, p_stand text)
returns void language plpgsql security definer set search_path = public as $$
declare v_stand public.stands;
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  select * into v_stand from public.stands where id = p_stand;
  if not found then raise exception 'Unknown stand'; end if;
  insert into public.passport_stamps (user_id, place_name, photo_url, visited_at)
  values (p_user, v_stand.stamp_name, v_stand.stamp_photo, now())
  on conflict (user_id, place_name) do update set visited_at = coalesce(public.passport_stamps.visited_at, now());
  perform public._admin_log('stamp.add', 'user', p_user::text, jsonb_build_object('stand', p_stand));
end $$;
grant execute on function public.admin_add_stamp(uuid, text) to authenticated;

create or replace function public.admin_remove_stamp(p_stamp uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_place text;
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  delete from public.passport_stamps where id = p_stamp returning user_id, place_name into v_user, v_place;
  perform public._admin_log('stamp.remove', 'user', v_user::text, jsonb_build_object('place', v_place));
end $$;
grant execute on function public.admin_remove_stamp(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5) ESTADÍSTICAS DEL PANEL
-- ---------------------------------------------------------------------
create or replace function public.admin_analytics(p_days integer default 30)
returns json language plpgsql stable security definer set search_path = public as $$
declare v_days integer := least(greatest(coalesce(p_days, 30), 7), 90);
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  return json_build_object(
    'signups', (select coalesce(json_agg(json_build_object('d', to_char(d, 'YYYY-MM-DD'), 'n', coalesce(c.n, 0)) order by d), '[]'::json)
                from generate_series(current_date - (v_days - 1), current_date, interval '1 day') d
                left join (select joined_at::date as day, count(*) n from public.profiles group by 1) c on c.day = d::date),
    'reports', (select coalesce(json_agg(json_build_object('d', to_char(d, 'YYYY-MM-DD'), 'n', coalesce(c.n, 0)) order by d), '[]'::json)
                from generate_series(current_date - (v_days - 1), current_date, interval '1 day') d
                left join (select created_at::date as day, count(*) n from public.stand_reports group by 1) c on c.day = d::date),
    'zone',    (select coalesce(json_object_agg(zone_status, n), '{}'::json) from (select zone_status, count(*) n from public.stand_reports group by 1) z),
    'urgency', (select coalesce(json_object_agg(urgency, n), '{}'::json) from (select urgency, count(*) n from public.stand_reports group by 1) u),
    'by_stand',(select coalesce(json_agg(json_build_object('stand_id', stand_id, 'n', n) order by n desc), '[]'::json) from (select stand_id, count(*) n from public.stand_reports group by 1) s),
    'trash',   (select coalesce(json_agg(json_build_object('type', t, 'n', n) order by n desc), '[]'::json)
                from (select unnest(trash_types) t, count(*) n from public.stand_reports group by 1) x),
    'top_travelers', (select coalesce(json_agg(json_build_object('username', username, 'name', display_name, 'stamps', st, 'streak', current_streak) order by st desc, current_streak desc), '[]'::json)
                from (select p.username, p.display_name, p.current_streak,
                             (select count(*) from public.passport_stamps s where s.user_id = p.id and s.visited_at is not null) st
                      from public.profiles p order by st desc, p.current_streak desc limit 5) t)
  );
end $$;
grant execute on function public.admin_analytics(integer) to authenticated;

-- Panel general: ahora cuenta como "por calificar" las participaciones enviadas
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
    'contest_to_review',  (select count(*) from contest_entries where status = 'submitted'),
    'announcements',      (select count(*) from announcements where active and starts_at <= now() and (ends_at is null or ends_at > now()))
  );
end $$;
