begin;

create table if not exists public.pc2_admins_acopio (
  id uuid primary key references auth.users(id) on delete cascade
);
alter table public.pc2_admins_acopio enable row level security;
revoke all on public.pc2_admins_acopio from public, anon, authenticated;
grant select on public.pc2_admins_acopio to authenticated;
drop policy if exists pc2_leer_permiso_propio on public.pc2_admins_acopio;
create policy pc2_leer_permiso_propio on public.pc2_admins_acopio
  for select to authenticated using (id = (select auth.uid()));

grant insert (slug, nombre, distrito, direccion, horario, materiales, activo),
      update (nombre, distrito, direccion, horario, materiales, activo)
  on public.pc2_puntos_acopio to authenticated;

drop policy if exists pc2_admin_leer_puntos on public.pc2_puntos_acopio;
create policy pc2_admin_leer_puntos on public.pc2_puntos_acopio for select to authenticated
  using (exists (select 1 from public.pc2_admins_acopio where id = (select auth.uid())));
drop policy if exists pc2_admin_crear_puntos on public.pc2_puntos_acopio;
create policy pc2_admin_crear_puntos on public.pc2_puntos_acopio for insert to authenticated
  with check (exists (select 1 from public.pc2_admins_acopio where id = (select auth.uid())));
drop policy if exists pc2_admin_editar_puntos on public.pc2_puntos_acopio;
create policy pc2_admin_editar_puntos on public.pc2_puntos_acopio for update to authenticated
  using (exists (select 1 from public.pc2_admins_acopio where id = (select auth.uid())))
  with check (exists (select 1 from public.pc2_admins_acopio where id = (select auth.uid())));

create table if not exists public.pc2_ofertas (
  id uuid primary key default gen_random_uuid(),
  generador_id uuid not null default auth.uid() references public.pc2_perfiles(id) on delete cascade,
  distrito text not null check (char_length(btrim(distrito)) between 2 and 80),
  direccion text not null check (char_length(btrim(direccion)) between 5 and 200),
  material text not null check (material in ('Papel', 'Cartón', 'Plástico', 'Vidrio', 'Metal', 'Aparatos electrónicos')),
  cantidad numeric(9,2) not null check (cantidad > 0 and cantidad <= 9999999.99),
  unidad text not null check (unidad in ('kg', 'unidades')),
  estado text not null default 'disponible'
    check (estado in ('disponible', 'en_coordinacion', 'recogido', 'cancelado')),
  creado_en timestamptz not null default now(),
  check (unidad <> 'unidades' or trunc(cantidad) = cantidad)
);

alter table public.pc2_ofertas enable row level security;
revoke all on public.pc2_ofertas from public, anon, authenticated;
grant select on public.pc2_ofertas to authenticated;
grant insert (distrito, direccion, material, cantidad, unidad) on public.pc2_ofertas to authenticated;
drop policy if exists pc2_generador_lee_sus_ofertas on public.pc2_ofertas;
create policy pc2_generador_lee_sus_ofertas on public.pc2_ofertas for select to authenticated
  using (generador_id = (select auth.uid()));
drop policy if exists pc2_generador_publica on public.pc2_ofertas;
create policy pc2_generador_publica on public.pc2_ofertas for insert to authenticated
  with check (
    generador_id = (select auth.uid()) and estado = 'disponible'
    and exists (
      select 1 from public.pc2_perfiles
      where id = (select auth.uid()) and rol in ('hogar', 'negocio')
    )
  );

create index if not exists pc2_ofertas_generador_fecha
  on public.pc2_ofertas (generador_id, creado_en desc);
create index if not exists pc2_ofertas_disponibles_fecha
  on public.pc2_ofertas (creado_en desc, id desc) where estado = 'disponible';

create or replace function public.pc2_buscar_ofertas(
  p_distrito text default null,
  p_material text default null,
  p_pagina integer default 1
)
returns table (id uuid, distrito text, material text, cantidad numeric, unidad text, creado_en timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.pc2_perfiles p
    where p.id = (select auth.uid()) and p.rol = 'recolector'
  ) then
    raise exception 'Esta consulta requiere un perfil de recolector' using errcode = '42501';
  end if;

  return query
  select o.id, o.distrito, o.material, o.cantidad, o.unidad, o.creado_en
  from public.pc2_ofertas o
  where o.estado = 'disponible'
    and (nullif(btrim(p_distrito), '') is null or lower(o.distrito) = lower(btrim(p_distrito)))
    and (nullif(p_material, '') is null or o.material = p_material)
  order by o.creado_en desc, o.id desc
  limit 21 offset ((greatest(1, least(coalesce(p_pagina, 1), 100000)) - 1) * 20);
end;
$$;
revoke all on function public.pc2_buscar_ofertas(text, text, integer) from public, anon, authenticated;
grant execute on function public.pc2_buscar_ofertas(text, text, integer) to authenticated;

commit;

