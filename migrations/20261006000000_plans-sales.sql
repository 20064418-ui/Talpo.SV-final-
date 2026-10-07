-- =====================================================================
-- Talapo.SV — Planes (Travel Passes) y solicitudes de compra
--   · travel_plans:   los planes que se ven en /planes (el admin los edita)
--   · plan_requests:  cuando un usuario toca "Get pass" se crea una solicitud
--                     que el admin sigue: nueva → contactado → confirmado → pagado
--
-- Cómo aplicarla: InsForge Dashboard → SQL Editor → pegar y ejecutar.
-- Se puede ejecutar más de una vez sin problema.
-- =====================================================================

-- 1) Planes ----------------------------------------------------------
create table if not exists public.travel_plans (
  id          text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  tier        text not null default 'bronce' check (tier in ('bronce', 'plata', 'oro')),
  name        text not null check (char_length(name) between 2 and 60),
  tagline     text check (char_length(tagline) <= 160),
  price       numeric(10, 2) not null default 0 check (price >= 0),
  period      text not null default '/ trip' check (char_length(period) <= 20),
  features    text[] not null default '{}',
  cta_label   text check (char_length(cta_label) <= 40),
  featured    boolean not null default false,
  active      boolean not null default true,
  sort        integer not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.travel_plans enable row level security;
grant select on public.travel_plans to anon, authenticated;
grant insert, update, delete on public.travel_plans to authenticated;
drop policy if exists "travel_plans: public read"  on public.travel_plans;
drop policy if exists "travel_plans: admin read"   on public.travel_plans;
drop policy if exists "travel_plans: admin insert" on public.travel_plans;
drop policy if exists "travel_plans: admin update" on public.travel_plans;
drop policy if exists "travel_plans: admin delete" on public.travel_plans;
create policy "travel_plans: public read"  on public.travel_plans for select to anon, authenticated using (active);
create policy "travel_plans: admin read"   on public.travel_plans for select to authenticated using ((select public.talapo_is_admin()));
create policy "travel_plans: admin insert" on public.travel_plans for insert to authenticated with check ((select public.talapo_is_admin()));
create policy "travel_plans: admin update" on public.travel_plans for update to authenticated using ((select public.talapo_is_admin()));
create policy "travel_plans: admin delete" on public.travel_plans for delete to authenticated using ((select public.talapo_is_admin()));

-- Los 3 planes que ya estaban en la página (solo si la tabla está vacía)
insert into public.travel_plans (id, tier, name, tagline, price, features, cta_label, featured, sort)
select * from (values
  ('standard', 'bronce', 'Standard Pass', 'Essential travel management for short independent trips.', 49::numeric,
    array['Complete routes, fares & transport schedule guide', 'Self-guided interactive tourist attraction maps',
          'Live currency converter and translation tools', 'AI Chatbot assistance for trip planning'],
    'Get Standard Pass', false, 1),
  ('premium', 'plata', 'Premium Traveler', 'Comprehensive booking coordination and dedicated agent support.', 149::numeric,
    array['All Standard Pass features', 'Guaranteed hotel & resort reservations with member rates',
          'Offline GPS-enabled interactive maps', 'Direct WhatsApp travel agent assistance',
          'Comprehensive digital welcome kit & itinerary guides'],
    'Choose Premium', false, 2),
  ('vip', 'oro', 'VIP Concierge', 'Full-service luxury trip orchestration and 24/7 personal support.', 299::numeric,
    array['All Premium Traveler features', 'VIP reservations for private tours, fine dining & shuttles',
          'Up to 25% exclusive discounts on luxury partner stays', '24/7 Priority Emergency & Personal Concierge line',
          'Fully personalized AI-driven & human-verified daily itinerary'],
    'Choose VIP Concierge', true, 3)
) as v(id, tier, name, tagline, price, features, cta_label, featured, sort)
where not exists (select 1 from public.travel_plans);

-- 2) Solicitudes -----------------------------------------------------
create table if not exists public.plan_requests (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null default public.talapo_uid() references public.profiles (id) on delete cascade,
  plan_id     text references public.travel_plans (id) on delete set null,
  plan_name   text not null check (char_length(plan_name) <= 60),
  price       numeric(10, 2) not null default 0,
  travelers   integer not null default 1 check (travelers between 1 and 50),
  trip_date   date,
  phone       text check (char_length(phone) <= 30),
  notes       text check (char_length(notes) <= 600),
  status      text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'paid', 'cancelled')),
  admin_note  text check (char_length(admin_note) <= 600),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists plan_requests_status_idx  on public.plan_requests (status, created_at desc);
create index if not exists plan_requests_profile_idx on public.plan_requests (profile_id, created_at desc);

alter table public.plan_requests enable row level security;
grant select, insert, update, delete on public.plan_requests to authenticated;
drop policy if exists "plan_requests: own read"     on public.plan_requests;
drop policy if exists "plan_requests: own insert"   on public.plan_requests;
drop policy if exists "plan_requests: own cancel"   on public.plan_requests;
drop policy if exists "plan_requests: admin read"   on public.plan_requests;
drop policy if exists "plan_requests: admin update" on public.plan_requests;
drop policy if exists "plan_requests: admin delete" on public.plan_requests;
-- El usuario ve y crea solo las suyas (siempre en estado "new")
create policy "plan_requests: own read"   on public.plan_requests for select to authenticated using (profile_id = (select public.talapo_uid()));
create policy "plan_requests: own insert" on public.plan_requests for insert to authenticated
  with check (profile_id = (select public.talapo_uid()) and status = 'new' and admin_note is null);
-- …y puede cancelar una suya mientras no esté pagada
create policy "plan_requests: own cancel" on public.plan_requests for update to authenticated
  using (profile_id = (select public.talapo_uid()) and status in ('new', 'contacted'))
  with check (profile_id = (select public.talapo_uid()) and status = 'cancelled');
-- El admin ve y gestiona todas
create policy "plan_requests: admin read"   on public.plan_requests for select to authenticated using ((select public.talapo_is_admin()));
create policy "plan_requests: admin update" on public.plan_requests for update to authenticated using ((select public.talapo_is_admin()));
create policy "plan_requests: admin delete" on public.plan_requests for delete to authenticated using ((select public.talapo_is_admin()));

-- El precio se copia del plan en el servidor (el navegador no puede inventarlo)
-- y updated_at se actualiza solo.
create or replace function public.plan_requests_fill()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    select p.name, p.price into new.plan_name, new.price from public.travel_plans p where p.id = new.plan_id and p.active;
    if new.plan_name is null then raise exception 'This plan is not available'; end if;
  else
    -- nadie cambia de qué usuario/plan/precio era la solicitud, salvo el admin el precio
    new.profile_id := old.profile_id;
    new.plan_id := old.plan_id;
    new.plan_name := old.plan_name;
    if not public.talapo_is_admin() then
      new.price := old.price;
      new.admin_note := old.admin_note;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists plan_requests_fill on public.plan_requests;
create trigger plan_requests_fill before insert or update on public.plan_requests
  for each row execute function public.plan_requests_fill();

-- 3) Lista para el admin (con el nombre y pasaporte del usuario) -------------
create or replace function public.admin_plan_requests(p_limit integer default 500)
returns table (
  id uuid, plan_id text, plan_name text, price numeric, travelers integer, trip_date date,
  phone text, notes text, status text, admin_note text, created_at timestamptz, updated_at timestamptz,
  profile_id uuid, username text, display_name text, passport_number text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.talapo_is_admin() then raise exception 'Admins only'; end if;
  return query
    select r.id, r.plan_id, r.plan_name, r.price, r.travelers, r.trip_date,
           r.phone, r.notes, r.status, r.admin_note, r.created_at, r.updated_at,
           r.profile_id, p.username, p.display_name, p.passport_number
    from public.plan_requests r
    left join public.profiles p on p.id = r.profile_id
    order by (r.status = 'new') desc, r.created_at desc
    limit least(greatest(p_limit, 1), 2000);
end $$;
grant execute on function public.admin_plan_requests(integer) to authenticated;
