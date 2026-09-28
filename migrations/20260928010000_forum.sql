-- =====================================================================
-- Talapo.SV — Foro de la comunidad (antes eran datos de prueba en memoria)
-- Lectura pública; escribir, reaccionar, guardar y comentar requiere sesión.
-- =====================================================================

create table if not exists public.forum_posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  author_name    text not null check (char_length(author_name) between 1 and 80),
  author_avatar  text,
  destination_id integer not null check (destination_id between 1 and 100),
  title          text not null check (char_length(title) between 1 and 120),
  body           text not null check (char_length(body) between 1 and 4000),
  image_url      text,
  created_at     timestamptz not null default now()
);
create index if not exists forum_posts_created_idx on public.forum_posts (created_at desc);

create table if not exists public.forum_comments (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.forum_posts (id) on delete cascade,
  parent_id     uuid references public.forum_comments (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  author_name   text not null,
  author_avatar text,
  body          text not null check (char_length(body) between 1 and 1000),
  created_at    timestamptz not null default now()
);
create index if not exists forum_comments_post_idx on public.forum_comments (post_id);

create table if not exists public.forum_reactions (
  post_id    uuid not null references public.forum_posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null check (type in ('like', 'love')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.forum_saves (
  post_id    uuid not null references public.forum_posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Permisos: todos leen, cada usuario escribe/borra solo lo suyo
grant select on public.forum_posts, public.forum_comments, public.forum_reactions, public.forum_saves to anon, authenticated;
grant insert, update, delete on public.forum_posts, public.forum_comments, public.forum_reactions, public.forum_saves to authenticated;

do $$
declare t text;
begin
  foreach t in array array['forum_posts', 'forum_comments', 'forum_reactions', 'forum_saves'] loop
    execute format('alter table public.%1$s enable row level security', t);
    execute format('drop policy if exists "%1$s: public read" on public.%1$s', t);
    execute format('drop policy if exists "%1$s: insert own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s: update own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s: delete own" on public.%1$s', t);
    execute format('create policy "%1$s: public read" on public.%1$s for select to anon, authenticated using (true)', t);
    execute format('create policy "%1$s: insert own" on public.%1$s for insert to authenticated with check (user_id = (select public.talapo_uid()))', t);
    execute format('create policy "%1$s: update own" on public.%1$s for update to authenticated using (user_id = (select public.talapo_uid())) with check (user_id = (select public.talapo_uid()))', t);
    execute format('create policy "%1$s: delete own" on public.%1$s for delete to authenticated using (user_id = (select public.talapo_uid()))', t);
  end loop;
end $$;

-- Quién ve qué "guardados": las filas de forum_saves son públicas solo como conteo;
-- si prefieres que sean privadas, cambia la política "public read" de forum_saves por
-- using (user_id = (select public.talapo_uid())).
