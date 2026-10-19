-- =============================================================================
-- FRAGMENTADOS · Migración 3 de 3 · Storage para imágenes editoriales
-- =============================================================================
-- Bucket "imagenes-editoriales":
--   - Público para LECTURA por URL: las fotos se muestran en el portal sin
--     firmar enlaces. Los nombres de archivo llevan un identificador aleatorio.
--   - Máximo 10 MB por archivo. Formatos: JPEG, PNG, WebP y AVIF.
--   - Subir: cualquier miembro activo del equipo, solo en las carpetas
--     notas/, fragmentos/, destacados/ y general/.
--   - Reemplazar y eliminar: administrador y editor cualquier imagen;
--     redactor solo las que subió.
--   - El público no puede listar el bucket ni escribir en él.
--
-- Requiere la migración 2. Es aditiva: si el bucket ya existe, solo ajusta
-- sus límites; no borra archivos.
-- =============================================================================

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'imagenes-editoriales',
  'imagenes-editoriales',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "imagenes: el equipo puede ver el listado"
  on storage.objects for select to authenticated
  using (bucket_id = 'imagenes-editoriales' and privado.es_equipo());

create policy "imagenes: el equipo puede subir"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'imagenes-editoriales'
    and privado.es_equipo()
    and (storage.foldername(name))[1] in ('notas', 'fragmentos', 'destacados', 'general')
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif')
    and name ~ '^[a-z0-9/_-]+\.[a-zA-Z0-9]+$'
  );

create policy "imagenes: reemplazar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'imagenes-editoriales'
    and (privado.puede_publicar() or (privado.es_equipo() and owner_id = (select auth.uid())::text))
  )
  with check (
    bucket_id = 'imagenes-editoriales'
    and (privado.puede_publicar() or (privado.es_equipo() and owner_id = (select auth.uid())::text))
    and (storage.foldername(name))[1] in ('notas', 'fragmentos', 'destacados', 'general')
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif')
  );

create policy "imagenes: eliminar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'imagenes-editoriales'
    and (privado.puede_publicar() or (privado.es_equipo() and owner_id = (select auth.uid())::text))
  );

commit;
