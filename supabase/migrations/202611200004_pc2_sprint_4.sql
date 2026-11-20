begin;

create or replace function public.pc2_editar_oferta(
  p_id uuid, p_distrito text, p_direccion text, p_material text,
  p_cantidad numeric, p_unidad text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
begin
  if not exists (
    select 1 from public.pc2_perfiles
    where id = usuario and rol in ('hogar', 'negocio')
  ) then
    raise exception 'Se requiere un perfil generador' using errcode = '42501';
  end if;

  if p_cantidad is null or p_cantidad <> round(p_cantidad, 2) then
    raise exception 'Cantidad inválida' using errcode = '22023';
  end if;

  update public.pc2_ofertas
  set distrito = btrim(p_distrito), direccion = btrim(p_direccion),
      material = p_material, cantidad = p_cantidad, unidad = p_unidad
  where id = p_id and generador_id = usuario and estado = 'disponible';
  return found;
end;
$$;

create or replace function public.pc2_cancelar_oferta(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
begin
  if not exists (
    select 1 from public.pc2_perfiles
    where id = usuario and rol in ('hogar', 'negocio')
  ) then
    raise exception 'Se requiere un perfil generador' using errcode = '42501';
  end if;

  update public.pc2_ofertas
  set estado = 'cancelado'
  where id = p_id and generador_id = usuario and estado = 'disponible';
  return found;
end;
$$;

create index if not exists pc2_ofertas_reporte_fecha
  on public.pc2_ofertas (finalizado_en desc, id desc)
  where estado = 'recogido' and finalizado_en is not null;

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
    select o.id, o.distrito, o.material, o.cantidad, o.unidad, o.finalizado_en
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
    select material, unidad, sum(cantidad) as cantidad
    from filtrados group by material, unidad
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

revoke all on function public.pc2_editar_oferta(uuid, text, text, text, numeric, text),
  public.pc2_cancelar_oferta(uuid), public.pc2_reporte_reciclaje(date, date, text, integer)
  from public, anon, authenticated;
grant execute on function public.pc2_editar_oferta(uuid, text, text, text, numeric, text),
  public.pc2_cancelar_oferta(uuid), public.pc2_reporte_reciclaje(date, date, text, integer)
  to authenticated;

commit;

