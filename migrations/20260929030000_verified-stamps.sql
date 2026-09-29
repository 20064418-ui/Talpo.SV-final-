-- =====================================================================
-- Talapo.SV — Sellos verificados (anti-trampa)
-- El usuario ya NO puede crear, editar, poner fotos ni borrar sus sellos.
-- Los sellos solo los agrega stand_submit(), cuando la persona llena el
-- formulario en un Stand Talapo (es decir, cuando de verdad estuvo ahí).
-- =====================================================================

-- 1) Solo lectura para el dueño
drop policy if exists "passport_stamps: insert own" on public.passport_stamps;
drop policy if exists "passport_stamps: update own" on public.passport_stamps;
drop policy if exists "passport_stamps: delete own" on public.passport_stamps;
revoke insert, update, delete on public.passport_stamps from authenticated, anon;
grant select on public.passport_stamps to authenticated;

-- 2) Limpiar sellos que no vienen de un stand (los de ejemplo y los que se
--    marcaron a mano con una foto propia antes de este cambio)
delete from public.passport_stamps s
where not exists (select 1 from public.stands st where st.stamp_name = s.place_name);

-- 3) Un solo sello por lugar y por persona
create unique index if not exists passport_stamps_one_per_place
  on public.passport_stamps (user_id, place_name);
