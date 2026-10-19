-- =============================================================================
-- FRAGMENTADOS · Pruebas de permisos (RLS, roles, validaciones y Storage)
-- =============================================================================
-- Simula al público y a cada rol, y devuelve una tabla con el resultado de
-- cada prueba (columna ok). Todo ocurre dentro de una transacción que se
-- deshace al final: NO deja usuarios, contenidos ni archivos de prueba.
--
-- Requisitos: las 3 migraciones y el script de datos de muestra (demo_kit.sql).
-- Uso: pegar completo en el SQL Editor de Supabase y ejecutar.
-- =============================================================================

begin;

create temp table resultados (n serial primary key, prueba text, ok boolean, detalle text);
grant all on resultados to anon, authenticated;
grant usage on sequence resultados_n_seq to anon, authenticated;

-- Cambiar de identidad dentro de la transacción ------------------------------
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

-- La consulta debe fallar con permiso denegado o violación de una regla
create function pg_temp.debe_fallar(prueba text, consulta text) returns void language plpgsql as $$
begin
  execute consulta;
  perform pg_temp.anotar(prueba, false, 'se ejecutó y debía fallar');
exception when others then
  perform pg_temp.anotar(prueba, sqlstate in ('42501', '23514', 'P0001'), sqlstate || ': ' || left(sqlerrm, 110));
end $$;

-- La consulta (insert/update/delete) debe afectar exactamente n filas
create function pg_temp.debe_afectar(prueba text, consulta text, esperado int) returns void language plpgsql as $$
declare filas int;
begin
  execute consulta;
  get diagnostics filas = row_count;
  perform pg_temp.anotar(prueba, filas = esperado, format('filas afectadas: %s (esperado %s)', filas, esperado));
exception when others then
  perform pg_temp.anotar(prueba, false, sqlstate || ': ' || left(sqlerrm, 110));
end $$;

-- La consulta (select count(*)) debe devolver n
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
  ('a0000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prueba-redactor2@fragmentados.invalid'),
  ('a0000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prueba-inactivo@fragmentados.invalid');

select pg_temp.debe_contar('Auth crea perfiles inactivos y como redactor',
  $q$select count(*) from public.perfiles where id::text like 'a0000000-%' and rol = 'redactor' and not activo$q$, 5);

update public.perfiles set rol = 'administrador', activo = true where id = 'a0000000-0000-4000-8000-000000000001';
update public.perfiles set rol = 'editor', activo = true where id = 'a0000000-0000-4000-8000-000000000002';
update public.perfiles set activo = true where id in ('a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004');

-- Contenido no público, creado como sistema
insert into public.notas (id, slug, titulo, categoria_id, estado)
select 'b0000000-0000-4000-8000-000000000001', 'prueba-borrador-oculto', 'Borrador de prueba', id, 'borrador'
from public.categorias where slug = 'politica';
insert into public.notas (id, slug, titulo, categoria_id, estado, publicado_en, imagen_ruta, imagen_alt, imagen_ancho, imagen_alto)
select 'b0000000-0000-4000-8000-000000000002', 'prueba-programada-futuro', 'Programada para mañana', id, 'publicado',
       now() + interval '1 day', '/demo/vivienda-inau.jpg', 'Prueba', 1600, 1067
from public.categorias where slug = 'politica';
insert into public.fragmentos (id, slug, palabra_clave, cuerpo, categoria_id, estado, autor_id)
select 'c0000000-0000-4000-8000-000000000001', 'prueba-fragmento-ajeno', 'Ajeno', '[["Texto de prueba."]]', id, 'borrador',
       'a0000000-0000-4000-8000-000000000004'
from public.categorias where slug = 'politica';
insert into public.destacados (id, tipo, valor, texto, estado)
values ('d0000000-0000-4000-8000-000000000001', 'cifra', '1%', 'Destacado en borrador', 'borrador');
insert into public.ubicaciones_portada (zona, posicion, destacado_id)
values ('destacado', 6, 'd0000000-0000-4000-8000-000000000001');

-- =============================================================================
-- 1. Público (anon)
-- =============================================================================
select pg_temp.como_publico();

select pg_temp.debe_contar('Público: ve solo notas publicadas con fecha cumplida',
  $q$select count(*) from public.notas where slug like 'prueba-%'$q$, 0);
select pg_temp.debe_contar('Público: no accede a un borrador aunque conozca su URL',
  $q$select count(*) from public.notas where slug = 'prueba-borrador-oculto'$q$, 0);
select pg_temp.debe_contar('Público: no ve una nota programada para el futuro',
  $q$select count(*) from public.notas where slug = 'prueba-programada-futuro'$q$, 0);
select pg_temp.debe_contar('Público: ve los fragmentos publicados del kit',
  $q$select count(*) from public.fragmentos where es_demo$q$, 7);
select pg_temp.debe_contar('Público: la portada no muestra destacados en borrador',
  $q$select count(*) from public.ubicaciones_portada where zona = 'destacado'$q$, 3);
select pg_temp.debe_fallar('Público: no puede leer perfiles',
  $q$select count(*) from public.perfiles$q$);
select pg_temp.debe_fallar('Público: no puede leer autor_id de las notas',
  $q$select autor_id from public.notas limit 1$q$);
select pg_temp.debe_fallar('Público: no puede crear notas',
  $q$insert into public.notas (slug, titulo, categoria_id) select 'prueba-anon', 'X', id from public.categorias limit 1$q$);
select pg_temp.debe_fallar('Público: no puede subir imágenes',
  $q$insert into storage.objects (bucket_id, name) values ('imagenes-editoriales', 'notas/prueba-anon.jpg')$q$);

-- =============================================================================
-- 2. Redactor
-- =============================================================================
select pg_temp.como('a0000000-0000-4000-8000-000000000003');

select pg_temp.debe_afectar('Redactor: crea un borrador propio',
  $q$insert into public.notas (id, slug, titulo, categoria_id, autor_id)
     select 'b0000000-0000-4000-8000-000000000003', 'prueba-redactor', 'Mi borrador', id, 'a0000000-0000-4000-8000-000000000004'
     from public.categorias where slug = 'politica'$q$, 1);
select pg_temp.debe_contar('Redactor: la autoría queda a su nombre aunque intente otra',
  $q$select count(*) from public.notas where slug = 'prueba-redactor' and autor_id = 'a0000000-0000-4000-8000-000000000003'$q$, 1);
select pg_temp.debe_fallar('Redactor: no puede crear contenido publicado',
  $q$insert into public.notas (slug, titulo, categoria_id, estado, imagen_ruta, imagen_alt, imagen_ancho, imagen_alto)
     select 'prueba-redactor-pub', 'X', id, 'publicado', '/demo/vivienda-inau.jpg', 'x', 10, 10 from public.categorias limit 1$q$);
select pg_temp.debe_afectar('Redactor: edita su borrador',
  $q$update public.notas set bajada = 'Bajada nueva' where slug = 'prueba-redactor'$q$, 1);
select pg_temp.debe_fallar('Redactor: no puede publicar su borrador',
  $q$update public.notas set estado = 'publicado', imagen_ruta = '/demo/vivienda-inau.jpg', imagen_alt = 'x', imagen_ancho = 10, imagen_alto = 10
     where slug = 'prueba-redactor'$q$);
select pg_temp.debe_afectar('Redactor: envía su borrador a revisión',
  $q$update public.notas set estado = 'en_revision' where slug = 'prueba-redactor'$q$, 1);
select pg_temp.debe_afectar('Redactor: no edita lo que ya envió a revisión',
  $q$update public.notas set titulo = 'Cambio tardío' where slug = 'prueba-redactor'$q$, 0);
select pg_temp.debe_contar('Redactor: no ve borradores de otros redactores',
  $q$select count(*) from public.fragmentos where slug = 'prueba-fragmento-ajeno'$q$, 0);
select pg_temp.debe_afectar('Redactor: no modifica contenido publicado',
  $q$update public.notas set titulo = 'Hackeado' where es_demo$q$, 0);
select pg_temp.debe_afectar('Redactor: no borra contenido publicado',
  $q$delete from public.fragmentos where es_demo$q$, 0);
select pg_temp.debe_fallar('Redactor: no puede cambiar su propio rol',
  $q$update public.perfiles set rol = 'administrador' where id = 'a0000000-0000-4000-8000-000000000003'$q$);
select pg_temp.debe_fallar('Redactor: no puede activarse ni desactivarse',
  $q$update public.perfiles set activo = false where id = 'a0000000-0000-4000-8000-000000000003'$q$);
select pg_temp.debe_afectar('Redactor: no puede cambiar el rol de otros',
  $q$update public.perfiles set rol = 'editor' where id = 'a0000000-0000-4000-8000-000000000004'$q$, 0);
select pg_temp.debe_afectar('Redactor: puede cambiar su nombre visible',
  $q$update public.perfiles set nombre_visible = 'Redacción de prueba' where id = 'a0000000-0000-4000-8000-000000000003'$q$, 1);
select pg_temp.debe_fallar('Redactor: no puede organizar la portada',
  $q$insert into public.ubicaciones_portada (zona, posicion, destacado_id) values ('destacado', 5, 'd0000000-0000-4000-8000-000000000001')$q$);
select pg_temp.debe_fallar('Redactor: no puede crear categorías',
  $q$insert into public.categorias (slug, nombre) values ('prueba', 'Prueba')$q$);
select pg_temp.debe_afectar('Redactor: sube una imagen a una carpeta permitida',
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('imagenes-editoriales', 'notas/2026/10/prueba-redactor.jpg', 'a0000000-0000-4000-8000-000000000003')$q$, 1);
select pg_temp.como_sistema();
insert into storage.objects (bucket_id, name, owner_id)
values ('imagenes-editoriales', 'notas/2026/10/prueba-ajena.jpg', 'a0000000-0000-4000-8000-000000000004');
select set_config('storage.allow_delete_query', 'true', true);
select pg_temp.como('a0000000-0000-4000-8000-000000000003');
select pg_temp.debe_afectar('Redactor: no puede eliminar imágenes de otros',
  $q$delete from storage.objects where name = 'notas/2026/10/prueba-ajena.jpg'$q$, 0);
select pg_temp.debe_afectar('Redactor: puede eliminar sus propias imágenes',
  $q$delete from storage.objects where name = 'notas/2026/10/prueba-redactor.jpg'$q$, 1);
select pg_temp.debe_afectar('Redactor: vuelve a subir su imagen',
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('imagenes-editoriales', 'notas/2026/10/prueba-redactor.jpg', 'a0000000-0000-4000-8000-000000000003')$q$, 1);
select pg_temp.debe_fallar('Redactor: no puede subir fuera de las carpetas permitidas',
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('imagenes-editoriales', 'otra/prueba.jpg', 'a0000000-0000-4000-8000-000000000003')$q$);
select pg_temp.debe_fallar('Redactor: no puede subir archivos que no son imágenes',
  $q$insert into storage.objects (bucket_id, name, owner_id) values ('imagenes-editoriales', 'notas/prueba.svg', 'a0000000-0000-4000-8000-000000000003')$q$);

-- =============================================================================
-- 3. Validaciones del contenido (con un editor, que tiene permisos amplios)
-- =============================================================================
select pg_temp.como('a0000000-0000-4000-8000-000000000002');

select pg_temp.debe_fallar('Validación: rechaza enlaces javascript:',
  $q$update public.notas set cuerpo = '[{"type":"parrafo","content":[{"type":"enlace","text":"x","href":"javascript:alert(1)"}]}]'
     where slug = 'prueba-redactor'$q$);
select pg_temp.debe_fallar('Validación: rechaza tipos de bloque desconocidos (HTML)',
  $q$update public.notas set cuerpo = '[{"type":"html","content":"<script>alert(1)</script>"}]' where slug = 'prueba-redactor'$q$);
select pg_temp.debe_fallar('Validación: rechaza énfasis de más de 240 caracteres',
  $q$update public.fragmentos set cuerpo = jsonb_build_array(jsonb_build_array(jsonb_build_object('type','enfasis','text', repeat('a', 241))))
     where slug = 'prueba-fragmento-ajeno'$q$);
select pg_temp.debe_fallar('Validación: no se publica una nota sin imagen principal',
  $q$update public.notas set estado = 'publicado' where slug = 'prueba-borrador-oculto'$q$);
select pg_temp.debe_afectar('Validación: acepta texto con símbolos como texto plano',
  $q$update public.notas set cuerpo = '[{"type":"parrafo","content":["Texto con <etiquetas> y \"comillas\"."]}]' where slug = 'prueba-redactor'$q$, 1);

-- =============================================================================
-- 4. Editor
-- =============================================================================
select pg_temp.debe_contar('Editor: ve lo enviado a revisión',
  $q$select count(*) from public.notas where slug = 'prueba-redactor' and estado = 'en_revision'$q$, 1);
select pg_temp.debe_afectar('Editor: publica una nota en revisión',
  $q$update public.notas set estado = 'publicado', imagen_ruta = 'notas/2026/10/prueba-redactor.jpg', imagen_alt = 'Prueba',
     imagen_ancho = 1200, imagen_alto = 800 where slug = 'prueba-redactor'$q$, 1);
select pg_temp.debe_contar('Editor: al publicar sin fecha se usa la actual',
  $q$select count(*) from public.notas where slug = 'prueba-redactor' and publicado_en is not null and publicado_en <= now()$q$, 1);
select pg_temp.debe_afectar('Editor: organiza la portada',
  $q$update public.ubicaciones_portada set nota_id = 'b0000000-0000-4000-8000-000000000003' where zona = 'apertura'$q$, 1);
select pg_temp.debe_afectar('Editor: no puede cambiar roles (la base no modifica ninguna fila)',
  $q$update public.perfiles set rol = 'editor' where id = 'a0000000-0000-4000-8000-000000000003'$q$, 0);
select pg_temp.debe_afectar('Editor: no puede eliminar notas',
  $q$delete from public.notas where slug = 'prueba-redactor'$q$, 0);
-- La API de Storage habilita el borrado con esta variable y borra con el rol del usuario.
select set_config('storage.allow_delete_query', 'true', true);
select pg_temp.debe_afectar('Editor: puede eliminar imágenes de otros',
  $q$delete from storage.objects where name = 'notas/2026/10/prueba-redactor.jpg'$q$, 1);

-- =============================================================================
-- 5. Administrador
-- =============================================================================
select pg_temp.como('a0000000-0000-4000-8000-000000000001');

select pg_temp.debe_afectar('Administrador: cambia el rol de otro usuario',
  $q$update public.perfiles set rol = 'editor' where id = 'a0000000-0000-4000-8000-000000000004'$q$, 1);
select pg_temp.debe_fallar('Administrador: no puede cambiar su propio rol',
  $q$update public.perfiles set rol = 'editor' where id = 'a0000000-0000-4000-8000-000000000001'$q$);
select pg_temp.debe_afectar('Administrador: crea una categoría',
  $q$insert into public.categorias (slug, nombre) values ('prueba-categoria', 'Prueba')$q$, 1);

-- =============================================================================
-- 6. Usuario inactivo
-- =============================================================================
select pg_temp.como('a0000000-0000-4000-8000-000000000005');

select pg_temp.debe_contar('Inactivo: solo ve contenido público',
  $q$select count(*) from public.notas where estado <> 'publicado'$q$, 0);
select pg_temp.debe_fallar('Inactivo: no puede crear contenido',
  $q$insert into public.fragmentos (slug, palabra_clave, categoria_id) select 'prueba-inactivo', 'X', id from public.categorias limit 1$q$);

-- =============================================================================
-- 7. Protección del último administrador (incluso desde el SQL Editor)
-- =============================================================================
select pg_temp.como_sistema();
update public.perfiles set activo = false where rol = 'administrador' and id <> 'a0000000-0000-4000-8000-000000000001';
select pg_temp.debe_contar('Sistema: el rol del redactor sigue sin cambios',
  $q$select count(*) from public.perfiles where id = 'a0000000-0000-4000-8000-000000000003' and rol = 'redactor'$q$, 1);
select pg_temp.debe_fallar('Sistema: no se puede desactivar al último administrador',
  $q$update public.perfiles set activo = false where id = 'a0000000-0000-4000-8000-000000000001'$q$);

-- Resultado -------------------------------------------------------------------
select pg_temp.como_sistema();
select n, case when ok then 'OK' else 'FALLA' end as resultado, prueba, detalle from resultados order by n;

rollback;
