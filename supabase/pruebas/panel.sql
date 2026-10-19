-- =============================================================================
-- FRAGMENTADOS · Pruebas de la migración 4 (funciones del panel editorial)
-- =============================================================================
-- Simula al público y a cada rol contra guardar_portada, listar_equipo y
-- resumen_panel, y repite las reglas de perfiles que usa la pantalla Usuarios.
-- Todo ocurre dentro de una transacción que se deshace al final: NO deja
-- usuarios, contenidos ni cambios en la portada.
--
-- Requisitos: las 4 migraciones y el script de datos de muestra (demo_kit.sql).
-- Uso: pegar completo en el SQL Editor de Supabase y ejecutar.
-- =============================================================================

begin;

create temp table resultados (n serial primary key, prueba text, ok boolean, detalle text);
grant all on resultados to anon, authenticated;
grant usage on sequence resultados_n_seq to anon, authenticated;

create function pg_temp.como(usuario uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', usuario, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.como_publico() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end $$;

create function pg_temp.como_sistema() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create function pg_temp.anotar(prueba text, ok boolean, detalle text) returns void language sql as $$
  insert into resultados (prueba, ok, detalle) values (prueba, ok, detalle);
$$;

-- La consulta debe fallar con uno de los códigos indicados
create function pg_temp.debe_fallar(prueba text, consulta text, codigos text[] default '{42501,23514,P0001}') returns void language plpgsql as $$
begin
  execute consulta;
  perform pg_temp.anotar(prueba, false, 'se ejecutó y debía fallar');
exception when others then
  perform pg_temp.anotar(prueba, sqlstate = any (codigos), sqlstate || ': ' || left(sqlerrm, 110));
end $$;

create function pg_temp.debe_funcionar(prueba text, consulta text) returns void language plpgsql as $$
begin
  execute consulta;
  perform pg_temp.anotar(prueba, true, 'ejecutada');
exception when others then
  perform pg_temp.anotar(prueba, false, sqlstate || ': ' || left(sqlerrm, 110));
end $$;

create function pg_temp.debe_contar(prueba text, consulta text, esperado int) returns void language plpgsql as $$
declare total int;
begin
  execute consulta into total;
  perform pg_temp.anotar(prueba, total = esperado, format('resultado: %s (esperado %s)', total, esperado));
exception when others then
  perform pg_temp.anotar(prueba, false, sqlstate || ': ' || left(sqlerrm, 110));
end $$;

-- Usuarios de prueba (se deshacen al final) ----------------------------------
insert into auth.users (id, instance_id, aud, role, email) values
  ('a0000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prueba-admin@fragmentados.invalid'),
  ('a0000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prueba-editor@fragmentados.invalid'),
  ('a0000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prueba-redactor@fragmentados.invalid'),
  ('a0000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prueba-inactivo@fragmentados.invalid');
update public.perfiles set rol = 'administrador', activo = true where id = 'a0000000-0000-4000-8000-000000000001';
update public.perfiles set rol = 'editor', activo = true where id = 'a0000000-0000-4000-8000-000000000002';
update public.perfiles set activo = true where id = 'a0000000-0000-4000-8000-000000000003';

-- Un borrador de la redactora (para resumen y para la portada)
insert into public.notas (id, slug, titulo, categoria_id, estado, autor_id)
select 'b0000000-0000-4000-8000-000000000001', 'prueba-panel-borrador', 'Borrador de prueba', id, 'borrador',
       'a0000000-0000-4000-8000-000000000003'
from public.categorias where slug = 'politica';

-- Tres notas publicadas del seed para armar portadas
create temp table publicadas as
  select id, row_number() over (order by publicado_en desc) as n
  from public.notas where estado = 'publicado' and publicado_en <= now() limit 5;
grant select on publicadas to anon, authenticated;

-- =============================================================================
-- 1. Público (anon): ninguna función del panel
-- =============================================================================
select pg_temp.como_publico();
select pg_temp.debe_fallar('Público: no puede ejecutar guardar_portada',
  $q$select public.guardar_portada(null)$q$);
select pg_temp.debe_fallar('Público: no puede ejecutar listar_equipo',
  $q$select * from public.listar_equipo()$q$);
select pg_temp.debe_fallar('Público: no puede ejecutar resumen_panel',
  $q$select * from public.resumen_panel()$q$);

-- =============================================================================
-- 2. Redactor
-- =============================================================================
select pg_temp.como('a0000000-0000-4000-8000-000000000003');
select pg_temp.debe_fallar('Redactor: no puede organizar la portada',
  $q$select public.guardar_portada((select id from publicadas where n = 1))$q$);
select pg_temp.debe_fallar('Redactor: no puede ver el equipo',
  $q$select * from public.listar_equipo()$q$);
select pg_temp.debe_contar('Redactor: el resumen cuenta sus borradores (1 nota)',
  $q$select coalesce(sum(total), 0)::int from public.resumen_panel() where tipo = 'nota' and estado = 'borrador'$q$, 1);
select pg_temp.debe_fallar('Redactor: no puede cambiarse el rol',
  $q$update public.perfiles set rol = 'editor' where id = 'a0000000-0000-4000-8000-000000000003'$q$);
select pg_temp.debe_contar('Redactor: no puede cambiar el rol de otro (0 filas)',
  $q$with x as (update public.perfiles set rol = 'redactor' where id = 'a0000000-0000-4000-8000-000000000002' returning 1) select count(*)::int from x$q$, 0);

-- =============================================================================
-- 3. Editor: portada
-- =============================================================================
select pg_temp.como('a0000000-0000-4000-8000-000000000002');
select pg_temp.debe_fallar('Editor: no puede poner un borrador en portada',
  $q$select public.guardar_portada('b0000000-0000-4000-8000-000000000001')$q$, '{22023}');
select pg_temp.debe_fallar('Editor: máximo 3 secundarias',
  $q$select public.guardar_portada(null, array(select id from publicadas where n <= 4))$q$, '{22023}');
select pg_temp.debe_fallar('Editor: una nota no puede ocupar dos lugares',
  $q$select public.guardar_portada((select id from publicadas where n = 1), array(select id from publicadas where n = 1))$q$, '{22023}');
select pg_temp.debe_funcionar('Editor: guarda apertura y 2 secundarias',
  $q$select public.guardar_portada((select id from publicadas where n = 1), array(select id from publicadas where n in (2, 3) order by n))$q$);
select pg_temp.debe_contar('Editor: la portada quedó con 3 lugares en orden',
  $q$select count(*)::int from public.ubicaciones_portada u
     where (u.zona = 'apertura' and u.posicion = 1 and u.nota_id = (select id from publicadas where n = 1))
        or (u.zona = 'secundaria' and u.posicion = 1 and u.nota_id = (select id from publicadas where n = 2))
        or (u.zona = 'secundaria' and u.posicion = 2 and u.nota_id = (select id from publicadas where n = 3))$q$, 3);
select pg_temp.debe_contar('Editor: no quedan ubicaciones viejas',
  $q$select count(*)::int from public.ubicaciones_portada$q$, 3);
select pg_temp.debe_fallar('Editor: no puede ver el equipo',
  $q$select * from public.listar_equipo()$q$);

-- =============================================================================
-- 4. Administrador
-- =============================================================================
select pg_temp.como('a0000000-0000-4000-8000-000000000001');
select pg_temp.debe_contar('Administrador: ve el equipo con correos',
  $q$select count(*)::int from public.listar_equipo() where email like 'prueba-%@fragmentados.invalid'$q$, 4);
select pg_temp.debe_fallar('Administrador: no puede cambiar su propio rol',
  $q$update public.perfiles set rol = 'editor' where id = 'a0000000-0000-4000-8000-000000000001'$q$);
select pg_temp.debe_contar('Administrador: cambia el rol y la activación de otro',
  $q$with x as (update public.perfiles set rol = 'editor', activo = false where id = 'a0000000-0000-4000-8000-000000000003' returning 1) select count(*)::int from x$q$, 1);
select pg_temp.debe_funcionar('Administrador: también organiza la portada',
  $q$select public.guardar_portada((select id from publicadas where n = 2))$q$);

-- =============================================================================
-- 5. Inactivo
-- =============================================================================
select pg_temp.como('a0000000-0000-4000-8000-000000000005');
select pg_temp.debe_fallar('Inactivo: no puede organizar la portada',
  $q$select public.guardar_portada((select id from publicadas where n = 1))$q$);
select pg_temp.debe_fallar('Inactivo: no puede ver el equipo',
  $q$select * from public.listar_equipo()$q$);

-- Resultado -------------------------------------------------------------------
select pg_temp.como_sistema();
select n, case when ok then 'OK' else 'FALLA' end as resultado, prueba, detalle from resultados order by n;

rollback;
