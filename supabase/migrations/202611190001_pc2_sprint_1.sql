begin;

create table if not exists public.pc2_perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 2 and 100),
  rol text not null check (rol in ('hogar', 'negocio', 'recolector'))
);

alter table public.pc2_perfiles enable row level security;
revoke all on public.pc2_perfiles from public, anon, authenticated;
grant select on public.pc2_perfiles to authenticated;
drop policy if exists pc2_leer_propio_perfil on public.pc2_perfiles;
create policy pc2_leer_propio_perfil on public.pc2_perfiles for select to authenticated
  using ((select auth.uid()) = id);

create or replace function public.pc2_crear_perfil_participante()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nombre_nuevo text := btrim(coalesce(new.raw_user_meta_data ->> 'pc2_nombre', ''));
  rol_nuevo text := coalesce(new.raw_user_meta_data ->> 'pc2_rol', '');
begin
  if rol_nuevo in ('hogar', 'negocio', 'recolector')
    and char_length(nombre_nuevo) between 2 and 100 then
    insert into public.pc2_perfiles (id, nombre, rol)
    values (new.id, nombre_nuevo, rol_nuevo)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.pc2_crear_perfil_participante() from public, anon, authenticated;
drop trigger if exists pc2_al_registrar_participante on auth.users;
create trigger pc2_al_registrar_participante
  after insert on auth.users
  for each row execute function public.pc2_crear_perfil_participante();

create table if not exists public.pc2_puntos_acopio (
  slug text primary key check (char_length(slug) <= 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre text not null,
  distrito text not null,
  direccion text not null,
  horario text not null,
  materiales text[] not null check (cardinality(materiales) > 0),
  activo boolean not null default true,
  es_demostracion boolean not null default false
);

alter table public.pc2_puntos_acopio enable row level security;
revoke all on public.pc2_puntos_acopio from public, anon, authenticated;
grant select on public.pc2_puntos_acopio to anon, authenticated;
drop policy if exists pc2_leer_puntos_activos on public.pc2_puntos_acopio;
create policy pc2_leer_puntos_activos on public.pc2_puntos_acopio for select to anon, authenticated
  using (activo = true);

commit;

