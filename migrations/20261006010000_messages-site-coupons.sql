-- =====================================================================
-- Talapo.SV — Mensajes en el sitio, contenido del inicio y cupones
--   · support_threads / support_messages: el usuario escribe a Talapo
--     desde /messages (o desde su solicitud de pase) y el admin responde
--     en /admin/messages. Sin WhatsApp.
--   · site_content: lo que el admin edita del inicio (destinos, reseñas,
--     números) y los ajustes del sitio (solicitudes abiertas/cerradas…).
--   · plan_coupons: cupones de descuento para los Travel Passes.
--
-- REQUIERE haber ejecutado antes 20261006000000_plans-sales.sql
-- Cómo aplicarla: InsForge Dashboard → SQL Editor → pegar y ejecutar.
-- Se puede ejecutar más de una vez sin problema.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) MENSAJES
-- ---------------------------------------------------------------------
create table if not exists public.support_threads (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null default public.talapo_uid() references public.profiles (id) on delete cascade,
  subject          text not null check (char_length(subject) between 2 and 120),
  topic            text not null default 'general' check (topic in ('general', 'plans', 'tours', 'account', 'report', 'other')),
  plan_request_id  uuid references public.plan_requests (id) on delete set null,
  status           text not null default 'open' check (status in ('open', 'closed')),
  last_message_at  timestamptz not null default now(),
  last_from_admin  boolean not null default false,
  user_unread      integer not null default 0,
  admin_unread     integer not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists support_threads_profile_idx on public.support_threads (profile_id, last_message_at desc);
create index if not exists support_threads_inbox_idx   on public.support_threads (status, last_message_at desc);

create table if not exists public.support_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.support_threads (id) on delete cascade,
  sender_id   uuid default public.talapo_uid() references public.profiles (id) on delete set null,
  from_admin  boolean not null default false,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index if not exists support_messages_thread_idx on public.support_messages (thread_id, created_at);

alter table public.support_threads  enable row level security;
alter table public.support_messages enable row level security;
grant select, insert, update, delete on public.support_threads  to authenticated;
grant select, insert, delete         on public.support_messages to authenticated;

drop policy if exists "support_threads: own read"     on public.support_threads;
drop policy if exists "support_threads: own insert"   on public.support_threads;
drop policy if exists "support_threads: admin read"   on public.support_threads;
drop policy if exists "support_threads: admin insert" on public.support_threads;
drop policy if exists "support_threads: admin update" on public.support_threads;
drop policy if exists "support_threads: admin delete" on public.support_threads;
create policy "support_threads: own read"     on public.support_threads for select to authenticated using (profile_id = (select public.talapo_uid()));
create policy "support_threads: own insert"   on public.support_threads for insert to authenticated with check (profile_id = (select public.talapo_uid()));
create policy "support_threads: admin read"   on public.support_threads for select to authenticated using ((select public.talapo_is_admin()));
-- el admin puede iniciar una conversación con un usuario (p. ej. sobre su solicitud de pase)
create policy "support_threads: admin insert" on public.support_threads for insert to authenticated with check ((select public.talapo_is_admin()));
create policy "support_threads: admin update" on public.support_threads for update to authenticated using ((select public.talapo_is_admin()));
create policy "support_threads: admin delete" on public.support_threads for delete to authenticated using ((select public.talapo_is_admin()));

drop policy if exists "support_messages: read"         on public.support_messages;
drop policy if exists "support_messages: insert"       on public.support_messages;
drop policy if exists "support_messages: admin delete" on public.support_messages;
create policy "support_messages: read" on public.support_messages for select to authenticated using (
  (select public.talapo_is_admin())
  or exists (select 1 from public.support_threads t where t.id = thread_id and t.profile_id = (select public.talapo_uid())));
create policy "support_messages: insert" on public.support_messages for insert to authenticated with check (
  (select public.talapo_is_admin())
  or exists (select 1 from public.support_threads t where t.id = thread_id and t.profile_id = (select public.talapo_uid())));
create policy "support_messages: admin delete" on public.support_messages for delete to authenticated using ((select public.talapo_is_admin()));

-- Al crear una conversación: el servidor decide los contadores y valida la solicitud ligada
create or replace function public.support_thread_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then
    new.profile_id := public.talapo_uid();
    new.status := 'open';
  end if;
  new.user_unread := 0; new.admin_unread := 0; new.last_from_admin := false;
  new.last_message_at := now(); new.created_at := now();
  if new.plan_request_id is not null and not exists (
    select 1 from public.plan_requests r where r.id = new.plan_request_id and r.profile_id = new.profile_id) then
    new.plan_request_id := null;
  end if;
  return new;
end $$;
drop trigger if exists support_thread_guard on public.support_threads;
create trigger support_thread_guard before insert on public.support_threads
  for each row execute function public.support_thread_guard();

-- Cada mensaje: quién lo manda lo decide el servidor (nadie puede hacerse pasar por Talapo)
create or replace function public.support_message_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select profile_id into v_owner from public.support_threads where id = new.thread_id;
  new.sender_id := public.talapo_uid();
  new.from_admin := public.talapo_is_admin() and new.sender_id is distinct from v_owner;
  new.created_at := now();
  new.body := btrim(new.body);
  return new;
end $$;
drop trigger if exists support_message_guard on public.support_messages;
create trigger support_message_guard before insert on public.support_messages
  for each row execute function public.support_message_guard();

create or replace function public.support_message_after()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.support_threads set
    last_message_at = new.created_at,
    last_from_admin = new.from_admin,
    user_unread  = case when new.from_admin then user_unread + 1 else user_unread end,
    admin_unread = case when new.from_admin then admin_unread else admin_unread + 1 end,
    status = case when new.from_admin then status else 'open' end   -- si el usuario vuelve a escribir, se reabre
  where id = new.thread_id;
  return null;
end $$;
drop trigger if exists support_message_after on public.support_messages;
create trigger support_message_after after insert on public.support_messages
  for each row execute function public.support_message_after();

-- Marcar como leída (el usuario sus conversaciones; el admin cualquiera)
create or replace function public.support_mark_read(p_thread uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select profile_id into v_owner from public.support_threads where id = p_thread;
  if v_owner is null then return; end if;
  if v_owner = public.talapo_uid() then
    update public.support_threads set user_unread = 0 where id = p_thread;
  elsif public.talapo_is_admin() then
    update public.support_threads set admin_unread = 0 where id = p_thread;
  end if;
end $$;
grant execute on function public.support_mark_read(uuid) to authenticated;

-- Bandeja del admin (con nombre y foto del usuario)
create or replace function public.admin_support_threads(p_limit integer default 300)
returns table (
  id uuid, subject text, topic text, status text, plan_request_id uuid,
  last_message_at timestamptz, last_from_admin boolean, admin_unread integer, created_at timestamptz,
  profile_id uuid, username text, display_name text, photo_url text, passport_number text, preview text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  return query
    select t.id, t.subject, t.topic, t.status, t.plan_request_id,
           t.last_message_at, t.last_from_admin, t.admin_unread, t.created_at,
           t.profile_id, p.username, p.display_name, p.photo_url, p.passport_number,
           (select left(m.body, 140) from public.support_messages m where m.thread_id = t.id order by m.created_at desc limit 1)
    from public.support_threads t
    left join public.profiles p on p.id = t.profile_id
    order by (t.admin_unread > 0) desc, t.last_message_at desc
    limit least(greatest(p_limit, 1), 1000);
end $$;
grant execute on function public.admin_support_threads(integer) to authenticated;

-- ---------------------------------------------------------------------
-- 2) CONTENIDO DEL INICIO Y AJUSTES DEL SITIO
-- ---------------------------------------------------------------------
create table if not exists public.site_content (
  key         text primary key check (key ~ '^[a-z0-9_-]{2,40}$'),
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);
alter table public.site_content enable row level security;
grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
drop policy if exists "site_content: public read"  on public.site_content;
drop policy if exists "site_content: admin insert" on public.site_content;
drop policy if exists "site_content: admin update" on public.site_content;
drop policy if exists "site_content: admin delete" on public.site_content;
create policy "site_content: public read"  on public.site_content for select to anon, authenticated using (true);
create policy "site_content: admin insert" on public.site_content for insert to authenticated with check ((select public.talapo_is_admin()));
create policy "site_content: admin update" on public.site_content for update to authenticated using ((select public.talapo_is_admin()));
create policy "site_content: admin delete" on public.site_content for delete to authenticated using ((select public.talapo_is_admin()));

insert into public.site_content (key, value) values
  ('settings', '{"plan_requests_open": true, "messages_open": true, "auto_reply": "Thanks for writing to Talapo! We usually answer within a few hours."}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 3) CUPONES
-- ---------------------------------------------------------------------
create table if not exists public.plan_coupons (
  code        text primary key check (code ~ '^[A-Z0-9_-]{3,24}$'),
  percent     integer not null check (percent between 1 and 100),
  plan_id     text references public.travel_plans (id) on delete cascade,   -- null = sirve para todos
  max_uses    integer check (max_uses is null or max_uses > 0),
  used        integer not null default 0,
  expires_at  timestamptz,
  active      boolean not null default true,
  note        text check (char_length(note) <= 120),
  created_at  timestamptz not null default now()
);
alter table public.plan_coupons enable row level security;
grant select, insert, update, delete on public.plan_coupons to authenticated;
drop policy if exists "plan_coupons: admin all" on public.plan_coupons;
-- Solo el admin ve la lista (así nadie puede adivinar cupones viendo la tabla)
create policy "plan_coupons: admin all" on public.plan_coupons for all to authenticated
  using ((select public.talapo_is_admin())) with check ((select public.talapo_is_admin()));

alter table public.plan_requests add column if not exists list_price    numeric(10, 2);
alter table public.plan_requests add column if not exists coupon_code   text;
alter table public.plan_requests add column if not exists discount_pct  integer not null default 0;

-- ¿Sirve este cupón? (para mostrar el descuento antes de enviar)
create or replace function public.check_coupon(p_code text, p_plan text)
returns integer language plpgsql stable security definer set search_path = public as $$
declare c public.plan_coupons;
begin
  select * into c from public.plan_coupons where code = upper(btrim(p_code));
  if c.code is null or not c.active
     or (c.expires_at is not null and c.expires_at < now())
     or (c.max_uses is not null and c.used >= c.max_uses)
     or (c.plan_id is not null and c.plan_id <> p_plan) then
    return 0;
  end if;
  return c.percent;
end $$;
grant execute on function public.check_coupon(text, text) to authenticated;

-- Solicitudes: precio y cupón SIEMPRE calculados en el servidor
create or replace function public.plan_requests_fill()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_pct integer := 0; v_open boolean;
begin
  if tg_op = 'INSERT' then
    if not public.talapo_is_admin() then
      select coalesce((value ->> 'plan_requests_open')::boolean, true) into v_open from public.site_content where key = 'settings';
      if v_open is false then raise exception 'Plan requests are closed right now'; end if;
    end if;
    select p.name, p.price into new.plan_name, new.list_price from public.travel_plans p where p.id = new.plan_id and p.active;
    if new.plan_name is null then raise exception 'This plan is not available'; end if;
    new.discount_pct := 0;
    if coalesce(btrim(new.coupon_code), '') <> '' then
      new.coupon_code := upper(btrim(new.coupon_code));
      v_pct := public.check_coupon(new.coupon_code, new.plan_id);
      if v_pct = 0 then raise exception 'This coupon is not valid'; end if;
      update public.plan_coupons set used = used + 1 where code = new.coupon_code;
      new.discount_pct := v_pct;
    else
      new.coupon_code := null;
    end if;
    new.price := round(new.list_price * (100 - new.discount_pct) / 100.0, 2);
  else
    new.profile_id := old.profile_id;
    new.plan_id := old.plan_id;
    new.plan_name := old.plan_name;
    new.list_price := old.list_price;
    new.coupon_code := old.coupon_code;
    new.discount_pct := old.discount_pct;
    if not public.talapo_is_admin() then
      new.price := old.price;
      new.admin_note := old.admin_note;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

-- La lista del admin ahora incluye el cupón (cambia lo que devuelve: se vuelve a crear)
drop function if exists public.admin_plan_requests(integer);
create or replace function public.admin_plan_requests(p_limit integer default 500)
returns table (
  id uuid, plan_id text, plan_name text, price numeric, list_price numeric, coupon_code text, discount_pct integer,
  travelers integer, trip_date date, phone text, notes text, status text, admin_note text,
  created_at timestamptz, updated_at timestamptz,
  profile_id uuid, username text, display_name text, passport_number text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  return query
    select r.id, r.plan_id, r.plan_name, r.price, r.list_price, r.coupon_code, r.discount_pct,
           r.travelers, r.trip_date, r.phone, r.notes, r.status, r.admin_note,
           r.created_at, r.updated_at,
           r.profile_id, p.username, p.display_name, p.passport_number
    from public.plan_requests r
    left join public.profiles p on p.id = r.profile_id
    order by (r.status = 'new') desc, r.created_at desc
    limit least(greatest(p_limit, 1), 2000);
end $$;
grant execute on function public.admin_plan_requests(integer) to authenticated;
