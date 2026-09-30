-- =====================================================================
-- Talapo.SV — Administradores de noticias (con fotos)
--   · profiles.is_admin: solo se cambia desde el Dashboard (SQL Editor)
--   · municipal_news.images: varias fotos por noticia
--   · Los administradores pueden crear, editar, publicar y borrar noticias
--
-- Para hacer administrador a alguien (en el SQL Editor del Dashboard):
--   update public.profiles set is_admin = true where username = 'rocio.calderon';
-- =====================================================================

alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Nadie puede darse permisos de administrador a sí mismo desde la página
create or replace function public.profiles_protect_admin()
returns trigger language plpgsql as $$
begin
  if new.is_admin is distinct from old.is_admin and current_user in ('authenticated', 'anon') then
    new.is_admin := old.is_admin;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_admin on public.profiles;
create trigger profiles_protect_admin before update on public.profiles
  for each row execute function public.profiles_protect_admin();

create or replace function public.talapo_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = public.talapo_uid()), false);
$$;
grant execute on function public.talapo_is_admin() to anon, authenticated;

-- Varias fotos por noticia (image_url sigue siendo la portada)
alter table public.municipal_news add column if not exists images text[] not null default '{}';

-- Permisos de administrador sobre las noticias
grant insert, update, delete on public.municipal_news to authenticated;
drop policy if exists "municipal_news: admin read all" on public.municipal_news;
drop policy if exists "municipal_news: admin insert"   on public.municipal_news;
drop policy if exists "municipal_news: admin update"   on public.municipal_news;
drop policy if exists "municipal_news: admin delete"   on public.municipal_news;
create policy "municipal_news: admin read all" on public.municipal_news for select to authenticated using ((select public.talapo_is_admin()));
create policy "municipal_news: admin insert"   on public.municipal_news for insert to authenticated with check ((select public.talapo_is_admin()));
create policy "municipal_news: admin update"   on public.municipal_news for update to authenticated using ((select public.talapo_is_admin())) with check ((select public.talapo_is_admin()));
create policy "municipal_news: admin delete"   on public.municipal_news for delete to authenticated using ((select public.talapo_is_admin()));
