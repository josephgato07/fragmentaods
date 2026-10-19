-- =============================================================================
-- FRAGMENTADOS · Migración 4 · Funciones del panel editorial
-- =============================================================================
-- Agrega tres funciones. No modifica tablas, políticas ni datos existentes.
--
--  1. guardar_portada(...)  Reemplaza el orden de la portada de una sola vez
--                           (apertura, hasta 3 secundarias y hasta 6 destacados).
--                           Se ejecuta con los permisos de quien la llama: RLS aplica.
--  2. listar_equipo()       Perfiles con su correo, solo para administradores.
--  3. resumen_panel()       Cantidades por estado para el inicio del panel.
--                           Con permisos de quien llama: cada rol ve sus números.
--
-- Requiere las migraciones 1, 2 y 3.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Portada
-- -----------------------------------------------------------------------------
create function public.guardar_portada(
  p_apertura uuid,
  p_secundarias uuid[] default '{}',
  p_destacados uuid[] default '{}'
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_notas uuid[];
  i int;
begin
  if not privado.puede_publicar() then
    raise exception 'Solo un editor o un administrador puede organizar la portada.' using errcode = '42501';
  end if;

  p_secundarias := array_remove(coalesce(p_secundarias, '{}'), null);
  p_destacados := array_remove(coalesce(p_destacados, '{}'), null);

  if cardinality(p_secundarias) > 3 then
    raise exception 'La portada admite hasta 3 notas secundarias.' using errcode = '22023';
  end if;
  if cardinality(p_destacados) > 6 then
    raise exception 'La portada admite hasta 6 destacados.' using errcode = '22023';
  end if;

  v_notas := case when p_apertura is null then p_secundarias else p_apertura || p_secundarias end;
  if (select count(distinct x) from unnest(v_notas) x) <> cardinality(v_notas) then
    raise exception 'Una nota no puede ocupar dos lugares de la portada.' using errcode = '22023';
  end if;
  if (select count(distinct x) from unnest(p_destacados) x) <> cardinality(p_destacados) then
    raise exception 'Un destacado no puede repetirse en la portada.' using errcode = '22023';
  end if;

  if exists (
    select 1 from unnest(v_notas) x
    where not exists (select 1 from public.notas n where n.id = x and n.estado = 'publicado')
  ) then
    raise exception 'Solo se pueden ubicar notas publicadas o programadas.' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(p_destacados) x
    where not exists (select 1 from public.destacados d where d.id = x and d.estado = 'publicado')
  ) then
    raise exception 'Solo se pueden ubicar destacados publicados o programados.' using errcode = '22023';
  end if;

  delete from public.ubicaciones_portada where zona is not null;

  if p_apertura is not null then
    insert into public.ubicaciones_portada (zona, posicion, nota_id) values ('apertura', 1, p_apertura);
  end if;
  for i in 1 .. cardinality(p_secundarias) loop
    insert into public.ubicaciones_portada (zona, posicion, nota_id) values ('secundaria', i, p_secundarias[i]);
  end loop;
  for i in 1 .. cardinality(p_destacados) loop
    insert into public.ubicaciones_portada (zona, posicion, destacado_id) values ('destacado', i, p_destacados[i]);
  end loop;
end;
$$;

revoke all on function public.guardar_portada(uuid, uuid[], uuid[]) from public, anon;
grant execute on function public.guardar_portada(uuid, uuid[], uuid[]) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Equipo (solo administradores): el correo vive en auth.users
-- -----------------------------------------------------------------------------
create function public.listar_equipo()
returns table (
  id uuid,
  email text,
  nombre_visible text,
  rol public.rol_usuario,
  activo boolean,
  creado_en timestamptz,
  ultimo_ingreso timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not privado.es_admin() then
    raise exception 'Solo un administrador puede ver el equipo.' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.nombre_visible, p.rol, p.activo, p.creado_en, u.last_sign_in_at
    from public.perfiles p
    join auth.users u on u.id = p.id
    order by p.activo desc, p.rol, lower(p.nombre_visible);
end;
$$;

revoke all on function public.listar_equipo() from public, anon;
grant execute on function public.listar_equipo() to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Resumen del panel (RLS aplica: un redactor solo cuenta sus borradores)
-- -----------------------------------------------------------------------------
create function public.resumen_panel()
returns table (tipo text, estado text, total bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select 'nota',
         case when n.estado = 'publicado' and n.publicado_en > now() then 'programado' else n.estado::text end,
         count(*)
  from public.notas n
  group by 1, 2
  union all
  select 'fragmento',
         case when f.estado = 'publicado' and f.publicado_en > now() then 'programado' else f.estado::text end,
         count(*)
  from public.fragmentos f
  group by 1, 2;
$$;

revoke all on function public.resumen_panel() from public, anon;
grant execute on function public.resumen_panel() to authenticated;

commit;
