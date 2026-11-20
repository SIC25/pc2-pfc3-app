begin;

alter table public.pc2_ofertas
  add column if not exists recolector_id uuid references public.pc2_perfiles(id),
  add column if not exists aceptado_en timestamptz,
  add column if not exists finalizado_en timestamptz;

create index if not exists pc2_ofertas_recolector_fecha
  on public.pc2_ofertas (recolector_id, aceptado_en desc, id desc)
  where recolector_id is not null;

create or replace function public.pc2_aceptar_recojo(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
begin
  if not exists (
    select 1 from public.pc2_perfiles p
    where p.id = usuario and p.rol = 'recolector'
  ) then
    raise exception 'Se requiere un perfil de recolector' using errcode = '42501';
  end if;

  update public.pc2_ofertas
  set estado = 'en_coordinacion', recolector_id = usuario, aceptado_en = clock_timestamp()
  where id = p_id and estado = 'disponible' and recolector_id is null;
  return found;
end;
$$;

create or replace function public.pc2_finalizar_recojo(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
begin
  if not exists (
    select 1 from public.pc2_perfiles p
    where p.id = usuario and p.rol = 'recolector'
  ) then
    raise exception 'Se requiere un perfil de recolector' using errcode = '42501';
  end if;

  update public.pc2_ofertas
  set estado = 'recogido', finalizado_en = clock_timestamp()
  where id = p_id and recolector_id = usuario and estado = 'en_coordinacion'
    and finalizado_en is null;
  return found;
end;
$$;

create or replace function public.pc2_mis_recojos()
returns table (
  id uuid, distrito text, direccion text, material text, cantidad numeric,
  unidad text, estado text, aceptado_en timestamptz, finalizado_en timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
begin
  if not exists (
    select 1 from public.pc2_perfiles p
    where p.id = usuario and p.rol = 'recolector'
  ) then
    raise exception 'Se requiere un perfil de recolector' using errcode = '42501';
  end if;

  return query
  select o.id, o.distrito, o.direccion, o.material, o.cantidad, o.unidad,
         o.estado, o.aceptado_en, o.finalizado_en
  from public.pc2_ofertas o
  where o.recolector_id = usuario and o.estado in ('en_coordinacion', 'recogido');
end;
$$;

revoke all on function public.pc2_aceptar_recojo(uuid),
  public.pc2_finalizar_recojo(uuid), public.pc2_mis_recojos()
  from public, anon, authenticated;
grant execute on function public.pc2_aceptar_recojo(uuid),
  public.pc2_finalizar_recojo(uuid), public.pc2_mis_recojos()
  to authenticated;

commit;

