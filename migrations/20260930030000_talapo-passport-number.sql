-- =====================================================================
-- Talapo.SV — El N° de pasaporte lo asigna TALAPO (fijo, no se escribe)
--   · Formato: TL + 7 números  →  TL0000001, TL0000002, …
--   · Se genera solo, la primera vez que la persona crea su pasaporte.
--   · Después nadie puede cambiarlo (ni desde la página).
--
-- Cómo aplicarla: InsForge Dashboard → SQL Editor → pegar el CONTENIDO y Run.
-- Esta migración NO toca los pasaportes que ya existen (para eso hay un
-- archivo opcional aparte: 20260930031000_reissue-passport-numbers.sql).
-- =====================================================================

create sequence if not exists public.talapo_passport_seq start 1;

create or replace function public._next_passport_number()
returns text language plpgsql security definer set search_path = public as $$
declare v text;
begin
  loop
    v := 'TL' || lpad(nextval('public.talapo_passport_seq')::text, 7, '0');
    exit when not exists (select 1 from public.profiles where passport_number = v);
  end loop;
  return v;
end $$;
revoke all on function public._next_passport_number() from public, anon, authenticated;

create or replace function public.profiles_passport_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.passport_number is not null then
    -- ya tiene número: es fijo
    new.passport_number := old.passport_number;
  elsif coalesce(btrim(new.passport_number), '') <> '' then
    -- está creando su pasaporte: Talapo asigna el número (ignora lo que venga del navegador)
    new.passport_number := public._next_passport_number();
  else
    new.passport_number := null;
  end if;
  return new;
end $$;

drop trigger if exists profiles_passport_guard on public.profiles;
create trigger profiles_passport_guard
  before insert or update on public.profiles
  for each row execute function public.profiles_passport_guard();

-- Que no se repita nunca (si ya hay repetidos antiguos, se omite sin error)
do $$ begin
  create unique index if not exists profiles_passport_number_key
    on public.profiles (passport_number) where passport_number is not null;
exception when others then
  raise notice 'No se creó el índice único: hay números repetidos de antes. Corre el archivo opcional de re-emisión.';
end $$;
