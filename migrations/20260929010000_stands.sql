-- =====================================================================
-- Talapo.SV — Stands (quioscos con tablet) conectados a Talapo
--   · stands            lugares donde hay un stand (Parque Libertad, Santa Ana…)
--   · municipal_news    noticias municipales (se reciben por correo y el equipo las publica)
--   · stand_reports     formulario del estado de la zona (basura, urgencia)
--   · stand_submit()    guarda el reporte y SELLA el pasaporte automáticamente
-- =====================================================================

create table if not exists public.stands (
  id          text primary key check (id ~ '^[a-z0-9-]{3,40}$'),
  name        text not null,
  city        text not null,
  stamp_name  text not null,          -- nombre del sello que aparece en el pasaporte
  stamp_photo text,
  lat         double precision,
  lng         double precision,
  created_at  timestamptz not null default now()
);

insert into public.stands (id, name, city, stamp_name, stamp_photo, lat, lng)
values ('parque-libertad', 'Parque Libertad', 'Santa Ana', 'Parque Libertad, Santa Ana',
        '/assets/img/stand/parksantaana.jpg', 13.9943, -89.5596)
on conflict (id) do nothing;

alter table public.stands enable row level security;
grant select on public.stands to anon, authenticated;
drop policy if exists "stands: public read" on public.stands;
create policy "stands: public read" on public.stands for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- Noticias municipales: las personas las mandan por CORREO; el equipo
-- las revisa y las publica desde el Dashboard (published = true).
-- ---------------------------------------------------------------------
create table if not exists public.municipal_news (
  id           uuid primary key default gen_random_uuid(),
  stand_id     text not null references public.stands (id) on delete cascade,
  title        text not null check (char_length(title) between 3 and 160),
  body         text not null check (char_length(body) between 3 and 4000),
  author       text,
  image_url    text,
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists municipal_news_stand_idx on public.municipal_news (stand_id, published_at desc);

alter table public.municipal_news enable row level security;
grant select on public.municipal_news to anon, authenticated;
drop policy if exists "municipal_news: read published" on public.municipal_news;
create policy "municipal_news: read published" on public.municipal_news
  for select to anon, authenticated using (published);

-- Al publicar, se guarda la fecha de publicación automáticamente
create or replace function public.municipal_news_publish_date()
returns trigger language plpgsql as $$
begin
  if new.published and (old is null or not old.published) and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;
drop trigger if exists municipal_news_publish_date on public.municipal_news;
create trigger municipal_news_publish_date before insert or update on public.municipal_news
  for each row execute function public.municipal_news_publish_date();

-- ---------------------------------------------------------------------
-- Reportes del formulario del stand (solo se escriben con stand_submit)
-- ---------------------------------------------------------------------
create table if not exists public.stand_reports (
  id          uuid primary key default gen_random_uuid(),
  stand_id    text not null references public.stands (id) on delete cascade,
  profile_id  uuid references public.profiles (id) on delete set null,
  zone_status text not null check (zone_status in ('clean', 'dirty', 'very_dirty')),
  has_trash   boolean not null default false,
  trash_types text[] not null default '{}',
  urgency     text not null check (urgency in ('low', 'medium', 'high')),
  comment     text check (char_length(comment) <= 500),
  created_at  timestamptz not null default now()
);
create index if not exists stand_reports_stand_idx on public.stand_reports (stand_id, created_at desc);
alter table public.stand_reports enable row level security;
-- Sin políticas públicas: nadie lee ni escribe directo. El equipo los ve en el Dashboard.

-- ---------------------------------------------------------------------
-- stand_submit: guarda el reporte y, si el número de pasaporte existe,
-- agrega (o renueva) el sello del stand en ese pasaporte.
-- ---------------------------------------------------------------------
create or replace function public.stand_submit(
  p_stand     text,
  p_passport  text,
  p_zone      text,
  p_has_trash boolean,
  p_trash     text[],
  p_urgency   text,
  p_comment   text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stand   public.stands;
  v_profile public.profiles;
  v_stamp   public.passport_stamps;
  v_already boolean := false;
  v_trash   text[];
begin
  select * into v_stand from public.stands where id = p_stand;
  if not found then raise exception 'Unknown stand'; end if;

  -- solo tipos de basura conocidos
  select coalesce(array_agg(t), '{}') into v_trash
  from unnest(coalesce(p_trash, '{}')) t
  where t in ('plastic', 'paper', 'glass', 'metal', 'organic', 'bulky', 'other');

  if nullif(trim(coalesce(p_passport, '')), '') is not null then
    select * into v_profile from public.profiles
    where upper(replace(passport_number, ' ', '')) = upper(replace(p_passport, ' ', ''))
    limit 1;
  end if;

  insert into public.stand_reports (stand_id, profile_id, zone_status, has_trash, trash_types, urgency, comment)
  values (v_stand.id, v_profile.id, p_zone, coalesce(p_has_trash, false),
          case when coalesce(p_has_trash, false) then v_trash else '{}' end,
          p_urgency, nullif(left(trim(coalesce(p_comment, '')), 500), ''));

  if v_profile.id is not null then
    select * into v_stamp from public.passport_stamps
    where user_id = v_profile.id and place_name = v_stand.stamp_name
    limit 1;
    if found then
      v_already := v_stamp.visited_at is not null;
      update public.passport_stamps
        set visited_at = now(), photo_url = coalesce(photo_url, v_stand.stamp_photo)
        where id = v_stamp.id;
    else
      insert into public.passport_stamps (user_id, place_name, photo_url, visited_at)
      values (v_profile.id, v_stand.stamp_name, v_stand.stamp_photo, now());
    end if;
  end if;

  return json_build_object(
    'passport_found', v_profile.id is not null,
    'first_name', split_part(coalesce(v_profile.display_name, ''), ' ', 1),
    'already_stamped', v_already,
    'stamp_name', v_stand.stamp_name
  );
end $$;

revoke all on function public.stand_submit(text, text, text, boolean, text[], text, text) from public;
grant execute on function public.stand_submit(text, text, text, boolean, text[], text, text) to anon, authenticated;
