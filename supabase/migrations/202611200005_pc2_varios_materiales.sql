begin;

alter table public.pc2_ofertas
  add column if not exists materiales_adicionales jsonb not null default '[]'::jsonb;

create or replace function public.pc2_lista_materiales(
  material text, cantidad numeric, unidad text, adicionales jsonb
)
returns jsonb
language sql immutable
set search_path = ''
as $$
  select jsonb_build_array(jsonb_build_object('material', material, 'cantidad', cantidad, 'unidad', unidad)) || adicionales;
$$;

create or replace function public.pc2_materiales_validos(lista jsonb)
returns boolean
language plpgsql immutable
set search_path = ''
as $$
declare
  item jsonb;
  cantidad numeric;
begin
  if jsonb_typeof(lista) is distinct from 'array' then return false; end if;
  if jsonb_array_length(lista) not between 1 and 12 then return false; end if;

  for item in select value from jsonb_array_elements(lista) loop
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if (item - array['material', 'cantidad', 'unidad']) <> '{}'::jsonb
       or ((item ->> 'material') in ('Papel', 'Cartón', 'Plástico', 'Vidrio', 'Metal', 'Aparatos electrónicos')) is not true
       or ((item ->> 'unidad') in ('kg', 'unidades')) is not true
       or jsonb_typeof(item -> 'cantidad') is distinct from 'number' then
      return false;
    end if;
    cantidad := (item ->> 'cantidad')::numeric;
    if cantidad <= 0 or cantidad > 9999999.99 or cantidad <> round(cantidad, 2)
       or (item ->> 'unidad' = 'unidades' and cantidad <> trunc(cantidad)) then
      return false;
    end if;
  end loop;

  return not exists (
    select 1 from jsonb_array_elements(lista) i
    group by i ->> 'material', i ->> 'unidad'
    having count(*) > 1
  );
end;
$$;

alter table public.pc2_ofertas drop constraint if exists pc2_ofertas_materiales_validos;
alter table public.pc2_ofertas add constraint pc2_ofertas_materiales_validos check (
  jsonb_typeof(materiales_adicionales) = 'array'
  and public.pc2_materiales_validos(public.pc2_lista_materiales(material, cantidad, unidad, materiales_adicionales))
);

-- La lista se guarda en una fila y conserva el identificador de publicación y recojo.
create or replace function public.pc2_publicar_materiales(
  p_distrito text, p_direccion text, p_materiales jsonb
)
returns uuid
language plpgsql security invoker
set search_path = ''
as $$
declare
  nuevo_id uuid;
begin
  if not public.pc2_materiales_validos(p_materiales) then
    raise exception 'Los materiales de la publicación no son válidos' using errcode = '22023';
  end if;

  insert into public.pc2_ofertas (distrito, direccion, material, cantidad, unidad, materiales_adicionales)
  values (btrim(p_distrito), btrim(p_direccion), p_materiales -> 0 ->> 'material',
    (p_materiales -> 0 ->> 'cantidad')::numeric, p_materiales -> 0 ->> 'unidad', p_materiales - 0)
  returning id into nuevo_id;
  return nuevo_id;
end;
$$;
grant insert (materiales_adicionales) on public.pc2_ofertas to authenticated;

create or replace function public.pc2_editar_materiales(
  p_id uuid, p_distrito text, p_direccion text, p_materiales jsonb
)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
begin
  if not exists (select 1 from public.pc2_perfiles p where p.id = usuario and p.rol in ('hogar', 'negocio')) then
    raise exception 'Se requiere un perfil generador' using errcode = '42501';
  end if;
  if not public.pc2_materiales_validos(p_materiales) then
    raise exception 'Los materiales de la publicación no son válidos' using errcode = '22023';
  end if;

  update public.pc2_ofertas
  set distrito = btrim(p_distrito), direccion = btrim(p_direccion),
    material = p_materiales -> 0 ->> 'material',
    cantidad = (p_materiales -> 0 ->> 'cantidad')::numeric,
    unidad = p_materiales -> 0 ->> 'unidad',
    materiales_adicionales = p_materiales - 0
  where id = p_id and generador_id = usuario and estado = 'disponible';
  return found;
end;
$$;

create or replace function public.pc2_buscar_ofertas_materiales(
  p_distrito text default null, p_material text default null, p_pagina integer default 1
)
returns table (id uuid, distrito text, materiales jsonb)
language plpgsql stable security definer
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
  select o.id, o.distrito, public.pc2_lista_materiales(o.material, o.cantidad, o.unidad, o.materiales_adicionales)
  from public.pc2_ofertas o
  where o.estado = 'disponible'
    and (nullif(btrim(p_distrito), '') is null or lower(o.distrito) = lower(btrim(p_distrito)))
    and (nullif(p_material, '') is null or o.material = p_material
         or o.materiales_adicionales @> jsonb_build_array(jsonb_build_object('material', p_material)))
  order by o.creado_en desc, o.id desc
  limit 21 offset ((greatest(1, least(coalesce(p_pagina, 1), 100000)) - 1) * 20);
end;
$$;

create or replace function public.pc2_mis_recojos_materiales()
returns table (
  id uuid, distrito text, direccion text, materiales jsonb,
  estado text, aceptado_en timestamptz, finalizado_en timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select r.id, r.distrito, r.direccion, public.pc2_lista_materiales(r.material, r.cantidad, r.unidad, o.materiales_adicionales),
    r.estado, r.aceptado_en, r.finalizado_en
  from public.pc2_mis_recojos() r
  join public.pc2_ofertas o on o.id = r.id;
$$;

revoke all on function public.pc2_publicar_materiales(text,text,jsonb),
  public.pc2_editar_materiales(uuid,text,text,jsonb), public.pc2_buscar_ofertas_materiales(text,text,integer),
  public.pc2_mis_recojos_materiales() from public, anon, authenticated;
grant execute on function public.pc2_publicar_materiales(text,text,jsonb),
  public.pc2_editar_materiales(uuid,text,text,jsonb), public.pc2_buscar_ofertas_materiales(text,text,integer),
  public.pc2_mis_recojos_materiales() to authenticated;

create or replace function public.pc2_reporte_reciclaje(
  p_desde date default null, p_hasta date default null, p_distrito text default null,
  p_pagina integer default 1
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  zona constant text := 'America/Lima';
  resultado jsonb;
begin
  if not exists (
    select 1 from public.pc2_admins_acopio where id = (select auth.uid())
  ) then
    raise exception 'Se requiere permiso de administración' using errcode = '42501';
  end if;

  if p_desde > p_hasta then
    raise exception 'El periodo es inválido' using errcode = '22023';
  end if;

  with filtrados as materialized (
    select o.id, o.distrito, o.material, o.cantidad, o.unidad, o.finalizado_en,
      public.pc2_lista_materiales(o.material, o.cantidad, o.unidad, o.materiales_adicionales) as materiales
    from public.pc2_ofertas o
    where o.estado = 'recogido' and o.finalizado_en is not null
      and (p_desde is null or o.finalizado_en >= (p_desde::timestamp at time zone zona))
      and (p_hasta is null or o.finalizado_en < ((p_hasta::timestamp + interval '1 day') at time zone zona))
      and (nullif(btrim(p_distrito), '') is null or lower(o.distrito) = lower(btrim(p_distrito)))
  ), pagina as (
    select * from filtrados
    order by finalizado_en desc, id desc
    limit 20 offset ((greatest(1, least(coalesce(p_pagina, 1), 100000)) - 1) * 20)
  ), recuperado as (
    select i.material, i.unidad, sum(i.cantidad) as cantidad
    from filtrados f cross join lateral jsonb_to_recordset(f.materiales) i(material text, unidad text, cantidad numeric)
    group by i.material, i.unidad
  )
  select jsonb_build_object(
    'total', (select count(*) from filtrados),
    'recojos', coalesce((select jsonb_agg(to_jsonb(p) order by p.finalizado_en desc, p.id desc) from pagina p), '[]'::jsonb),
    'recuperado', coalesce((select jsonb_agg(to_jsonb(r) order by r.material, r.unidad) from recuperado r), '[]'::jsonb)
  )
  into resultado;

  return resultado;
end;
$$;

commit;

