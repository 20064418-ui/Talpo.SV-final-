-- =====================================================================
-- Talapo.SV — Alertas urgentes, moderación del foro, panel de concursos e insignias
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ALERTAS URGENTES: marca de "ya se avisó al equipo"
-- ---------------------------------------------------------------------
alter table public.stand_reports add column if not exists notified_at timestamptz;
create index if not exists stand_reports_pending_alert_idx
  on public.stand_reports (created_at) where urgency = 'high' and notified_at is null;

-- ---------------------------------------------------------------------
-- 2) MODERACIÓN DEL FORO
--    · Cualquier usuario puede reportar una publicación o comentario.
--    · Con 3 reportes de personas distintas se oculta sola hasta que un admin la revise.
--    · Los administradores pueden ocultar, mostrar y borrar cualquier publicación.
-- ---------------------------------------------------------------------
alter table public.forum_posts    add column if not exists hidden boolean not null default false;
alter table public.forum_comments add column if not exists hidden boolean not null default false;

create table if not exists public.forum_reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.forum_posts (id) on delete cascade,
  comment_id  uuid references public.forum_comments (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null check (reason in ('spam', 'offensive', 'false', 'inappropriate', 'other')),
  details     text check (char_length(details) <= 300),
  resolved    boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint forum_reports_target check ((post_id is null) <> (comment_id is null))
);
create unique index if not exists forum_reports_one_per_post    on public.forum_reports (reporter_id, post_id)    where post_id is not null;
create unique index if not exists forum_reports_one_per_comment on public.forum_reports (reporter_id, comment_id) where comment_id is not null;

alter table public.forum_reports enable row level security;
grant select, insert on public.forum_reports to authenticated;
grant update, delete on public.forum_reports to authenticated;
drop policy if exists "forum_reports: report as me" on public.forum_reports;
drop policy if exists "forum_reports: admin read"   on public.forum_reports;
drop policy if exists "forum_reports: admin update" on public.forum_reports;
drop policy if exists "forum_reports: admin delete" on public.forum_reports;
create policy "forum_reports: report as me" on public.forum_reports for insert to authenticated
  with check (reporter_id = (select public.talapo_uid()));
create policy "forum_reports: admin read"   on public.forum_reports for select to authenticated using ((select public.talapo_is_admin()));
create policy "forum_reports: admin update" on public.forum_reports for update to authenticated using ((select public.talapo_is_admin()));
create policy "forum_reports: admin delete" on public.forum_reports for delete to authenticated using ((select public.talapo_is_admin()));

-- Ocultar automáticamente con 3 reportes distintos
create or replace function public.forum_auto_hide()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.post_id is not null and
     (select count(distinct reporter_id) from public.forum_reports where post_id = new.post_id and not resolved) >= 3 then
    update public.forum_posts set hidden = true where id = new.post_id;
  end if;
  if new.comment_id is not null and
     (select count(distinct reporter_id) from public.forum_reports where comment_id = new.comment_id and not resolved) >= 3 then
    update public.forum_comments set hidden = true where id = new.comment_id;
  end if;
  return new;
end $$;
drop trigger if exists forum_auto_hide on public.forum_reports;
create trigger forum_auto_hide after insert on public.forum_reports
  for each row execute function public.forum_auto_hide();

-- Lo oculto no lo ve el público (sí su autor y los admins)
drop policy if exists "forum_posts: public read"    on public.forum_posts;
drop policy if exists "forum_comments: public read" on public.forum_comments;
create policy "forum_posts: public read" on public.forum_posts for select to anon, authenticated
  using (not hidden or user_id = (select public.talapo_uid()) or (select public.talapo_is_admin()));
create policy "forum_comments: public read" on public.forum_comments for select to anon, authenticated
  using (not hidden or user_id = (select public.talapo_uid()) or (select public.talapo_is_admin()));

-- Los usuarios no pueden "desocultarse" solos
create or replace function public.forum_protect_hidden()
returns trigger language plpgsql as $$
begin
  if new.hidden is distinct from old.hidden and current_user in ('authenticated', 'anon')
     and not public.talapo_is_admin() then
    new.hidden := old.hidden;
  end if;
  return new;
end $$;
drop trigger if exists forum_posts_protect_hidden on public.forum_posts;
create trigger forum_posts_protect_hidden before update on public.forum_posts
  for each row execute function public.forum_protect_hidden();
drop trigger if exists forum_comments_protect_hidden on public.forum_comments;
create trigger forum_comments_protect_hidden before update on public.forum_comments
  for each row execute function public.forum_protect_hidden();

-- Poderes de moderación para admins
drop policy if exists "forum_posts: admin update"    on public.forum_posts;
drop policy if exists "forum_posts: admin delete"    on public.forum_posts;
drop policy if exists "forum_comments: admin update" on public.forum_comments;
drop policy if exists "forum_comments: admin delete" on public.forum_comments;
create policy "forum_posts: admin update"    on public.forum_posts    for update to authenticated using ((select public.talapo_is_admin()));
create policy "forum_posts: admin delete"    on public.forum_posts    for delete to authenticated using ((select public.talapo_is_admin()));
create policy "forum_comments: admin update" on public.forum_comments for update to authenticated using ((select public.talapo_is_admin()));
create policy "forum_comments: admin delete" on public.forum_comments for delete to authenticated using ((select public.talapo_is_admin()));

-- ---------------------------------------------------------------------
-- 3) PANEL DE CONCURSOS: los administradores califican (puntos, estado y nota)
-- ---------------------------------------------------------------------
alter table public.contest_entries add column if not exists review_note text check (char_length(review_note) <= 500);

create or replace function public.contest_guard()
returns trigger language plpgsql as $$
begin
  -- Un participante normal no puede ponerse puntos ni cambiar su estado; un admin sí.
  if current_setting('request.jwt.claims', true)::json ->> 'role' = 'authenticated'
     and not public.talapo_is_admin() then
    if tg_op = 'INSERT' then
      new.score := 0; new.status := 'registered'; new.review_note := null;
    else
      new.score := old.score; new.status := old.status; new.review_note := old.review_note;
    end if;
  end if;
  if new.score < 0 or new.score > 1000 then raise exception 'Score must be between 0 and 1000'; end if;
  return new;
end $$;

drop policy if exists "contests: admin read"   on public.contest_entries;
drop policy if exists "contests: admin update" on public.contest_entries;
create policy "contests: admin read"   on public.contest_entries for select to authenticated using ((select public.talapo_is_admin()));
create policy "contests: admin update" on public.contest_entries for update to authenticated using ((select public.talapo_is_admin()));

-- ---------------------------------------------------------------------
-- 4) INSIGNIAS: datos para calcularlas (del usuario que pregunta)
-- ---------------------------------------------------------------------
create or replace function public.my_badge_stats()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'stamps',         (select count(*) from passport_stamps where user_id = u.id and visited_at is not null),
    'streak',         coalesce(p.current_streak, 0),
    'longest_streak', coalesce(p.longest_streak, 0),
    'active_days',    (select count(*) from activity_log where user_id = u.id),
    'contests',       (select count(*) from contest_entries where user_id = u.id),
    'wins',           (select count(*) from contest_entries where user_id = u.id and status = 'winner'),
    'tours_routes',   (select count(*) from itineraries where user_id = u.id and source = 'tours'),
    'plans',          (select count(*) from itineraries where user_id = u.id and source = 'planner'),
    'followers',      (select count(*) from follows where following_id = u.id),
    'following',      (select count(*) from follows where follower_id = u.id),
    'reports',        (select count(*) from stand_reports where profile_id = u.id),
    'posts',          (select count(*) from forum_posts where user_id = u.id)
  )
  from (select public.talapo_uid() as id) u
  left join profiles p on p.id = u.id;
$$;
grant execute on function public.my_badge_stats() to authenticated;
