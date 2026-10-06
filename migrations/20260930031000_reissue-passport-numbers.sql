-- =====================================================================
-- OPCIONAL — Cambiar los pasaportes que YA existen al formato de Talapo
-- Los números que la gente escribió a mano (por ejemplo SV9876543, que pudo
-- ser su pasaporte real) se reemplazan por uno de Talapo (TL0000001…).
-- ⚠️ Los números anteriores NO se guardan: no se pueden recuperar después.
-- Ejecútalo solo si quieres hacerlo, DESPUÉS de 20260930030000_talapo-passport-number.sql.
-- =====================================================================
alter table public.profiles disable trigger profiles_passport_guard;

update public.profiles
   set passport_number = public._next_passport_number()
 where passport_number is not null
   and passport_number !~ '^TL[0-9]{7}$';

alter table public.profiles enable trigger profiles_passport_guard;

do $$ begin
  create unique index if not exists profiles_passport_number_key
    on public.profiles (passport_number) where passport_number is not null;
exception when others then null;
end $$;
