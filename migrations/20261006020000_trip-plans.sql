-- =====================================================================
-- Talapo.SV — Itinerarios armados por el equipo Talapo (opción B)
--   El admin arma el viaje día por día para una solicitud de pase.
--   Mientras es borrador solo lo ve el admin; al "enviarlo", el cliente
--   lo ve en My trips → From Talapo.
--
-- REQUIERE: 20261006000000_plans-sales.sql
-- Cómo aplicarla: InsForge Dashboard → SQL Editor → pegar y ejecutar.
-- Se puede ejecutar más de una vez sin problema.
-- =====================================================================

create table if not exists public.trip_plans (
  id               uuid primary key default gen_random_uuid(),
  plan_request_id  uuid unique references public.plan_requests (id) on delete set null,
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  title            text not null check (char_length(title) between 2 and 100),
  summary          text check (char_length(summary) <= 1500),
  start_date       date,
  travelers        integer not null default 1 check (travelers between 1 and 50),
  included         text[] not null default '{}',
  days             jsonb not null default '[]'::jsonb,   -- [{title, items:[{time, kind, title, place, notes}]}]
  status           text not null default 'draft' check (status in ('draft', 'sent')),
  sent_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists trip_plans_profile_idx on public.trip_plans (profile_id, updated_at desc);

alter table public.trip_plans enable row level security;
grant select, insert, update, delete on public.trip_plans to authenticated;
drop policy if exists "trip_plans: own read sent" on public.trip_plans;
drop policy if exists "trip_plans: admin all"     on public.trip_plans;
-- El cliente solo ve los suyos y solo cuando ya fueron enviados
create policy "trip_plans: own read sent" on public.trip_plans for select to authenticated
  using (profile_id = (select public.talapo_uid()) and status = 'sent');
-- El admin arma, edita y borra
create policy "trip_plans: admin all" on public.trip_plans for all to authenticated
  using ((select public.talapo_is_admin())) with check ((select public.talapo_is_admin()));

-- El dueño del itinerario es siempre el de la solicitud; fechas automáticas
create or replace function public.trip_plans_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  if new.plan_request_id is not null then
    select profile_id into v_owner from public.plan_requests where id = new.plan_request_id;
    if v_owner is not null then new.profile_id := v_owner; end if;
  end if;
  if jsonb_typeof(new.days) <> 'array' then raise exception 'days must be a list'; end if;
  if jsonb_array_length(new.days) > 30 then raise exception 'Max 30 days'; end if;
  if new.status = 'sent' and (tg_op = 'INSERT' or old.status is distinct from 'sent') then new.sent_at := now(); end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trip_plans_guard on public.trip_plans;
create trigger trip_plans_guard before insert or update on public.trip_plans
  for each row execute function public.trip_plans_guard();
