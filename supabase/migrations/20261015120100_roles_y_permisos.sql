-- =============================================================================
-- FRAGMENTADOS · Migración 2 de 3 · Roles, perfiles y políticas RLS
-- =============================================================================
-- Roles: administrador, editor, redactor (tabla public.perfiles).
-- Público (anon): solo ve contenido publicado cuya fecha de publicación llegó.
--
-- Requiere la migración 1. Es aditiva: no borra tablas ni datos.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Funciones de rol (security definer: leen perfiles sin pasar por RLS)
-- -----------------------------------------------------------------------------

create function privado.rol_actual()
returns public.rol_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select p.rol
  from public.perfiles p
  where p.id = (select auth.uid()) and p.activo;
$$;

create function privado.es_equipo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select privado.rol_actual() is not null;
$$;

create function privado.puede_publicar()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(privado.rol_actual() in ('administrador', 'editor'), false);
$$;

create function privado.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(privado.rol_actual() = 'administrador', false);
$$;

create function privado.es_redactor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(privado.rol_actual() = 'redactor', false);
$$;

-- ¿Hay otro administrador activo además de este perfil?
create function privado.hay_otro_admin_activo(excluir uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p
    where p.rol = 'administrador' and p.activo and p.id <> excluir
  );
$$;

-- Regla única de visibilidad pública
create function privado.es_publico(estado public.estado_contenido, publicado_en timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select estado = 'publicado' and publicado_en is not null and publicado_en <= now();
$$;


-- -----------------------------------------------------------------------------
-- Perfil automático para cada usuario nuevo de Auth
-- Se crea como redactor INACTIVO: sin permisos hasta que un administrador lo active.
-- -----------------------------------------------------------------------------

create function privado.crear_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre_visible, rol, activo)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(coalesce(new.email, ''), '@', 1)), 120),
    'redactor',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger al_crear_usuario_crear_perfil
  after insert on auth.users
  for each row execute function privado.crear_perfil_de_usuario();

-- Perfiles para usuarios que ya existían antes de esta migración (inactivos).
insert into public.perfiles (id, nombre_visible, rol, activo)
select u.id, left(split_part(coalesce(u.email, ''), '@', 1), 120), 'redactor', false
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Protección de roles: nadie cambia su propio rol ni su estado activo.
-- (Estos triggers NO son security definer a propósito: así current_user es
--  el rol real de quien escribe: authenticated desde la app, postgres desde
--  el SQL Editor.)
-- Solo un administrador activo (desde la app) o el SQL Editor del proyecto.
-- Nunca puede quedar el sistema sin un administrador activo.
-- -----------------------------------------------------------------------------

create function privado.proteger_perfiles()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_desde_api boolean := current_user in ('anon', 'authenticated');
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      raise exception 'No se puede cambiar el identificador de un perfil.' using errcode = '42501';
    end if;
    if (new.rol is distinct from old.rol or new.activo is distinct from old.activo)
       and v_desde_api and not privado.es_admin() then
      raise exception 'Solo un administrador puede cambiar roles o activar usuarios.' using errcode = '42501';
    end if;
    if v_desde_api and new.id = (select auth.uid()) and new.rol is distinct from old.rol then
      raise exception 'Nadie puede cambiar su propio rol.' using errcode = '42501';
    end if;
  end if;

  -- No dejar el portal sin administrador activo
  if old.rol = 'administrador' and old.activo
     and (tg_op = 'DELETE' or new.rol <> 'administrador' or not new.activo)
     and not privado.hay_otro_admin_activo(old.id) then
    raise exception 'Debe quedar al menos un administrador activo.' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger perfiles_proteger
  before update or delete on public.perfiles
  for each row execute function privado.proteger_perfiles();

-- -----------------------------------------------------------------------------
-- Flujo editorial en notas y fragmentos
--  - Al publicar sin fecha, se usa la fecha actual.
--  - Un redactor solo trabaja sobre sus borradores: no publica, no cambia la
--    autoría ni la fecha de publicación, y una vez enviado a revisión no edita
--    hasta que un editor lo devuelva a borrador.
-- -----------------------------------------------------------------------------

create function privado.controlar_flujo_editorial()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_desde_api boolean := current_user in ('anon', 'authenticated');
begin
  if v_desde_api then
    new.actualizado_por := (select auth.uid());

    if privado.es_redactor() then
      if new.estado = 'publicado' then
        raise exception 'Un redactor no puede publicar. Enviá el contenido a revisión.' using errcode = '42501';
      end if;
      new.es_demo := false;
      if tg_op = 'INSERT' then
        new.autor_id := (select auth.uid());
        new.publicado_en := null;
      else
        if old.estado <> 'borrador' then
          raise exception 'Este contenido ya está en revisión o publicado: solo un editor puede modificarlo.' using errcode = '42501';
        end if;
        new.autor_id := old.autor_id;
        new.publicado_en := old.publicado_en;
      end if;
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.actualizado_en := now();
  end if;

  if new.estado = 'publicado' and new.publicado_en is null then
    new.publicado_en := now();
  end if;

  return new;
end;
$$;

create trigger notas_flujo_editorial
  before insert or update on public.notas
  for each row execute function privado.controlar_flujo_editorial();
create trigger fragmentos_flujo_editorial
  before insert or update on public.fragmentos
  for each row execute function privado.controlar_flujo_editorial();

create function privado.controlar_destacado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.actualizado_por := (select auth.uid());
  end if;
  if tg_op = 'UPDATE' then
    new.actualizado_en := now();
  end if;
  if new.estado = 'publicado' and new.publicado_en is null then
    new.publicado_en := now();
  end if;
  return new;
end;
$$;

create trigger destacados_flujo
  before insert or update on public.destacados
  for each row execute function privado.controlar_destacado();

-- -----------------------------------------------------------------------------
-- Privilegios: se parte de cero y se otorga solo lo necesario.
-- anon (público) no ve autor_id ni actualizado_por.
-- -----------------------------------------------------------------------------

revoke all on public.categorias, public.perfiles, public.notas, public.fragmentos,
              public.destacados, public.ubicaciones_portada
  from anon, authenticated;

grant select on public.categorias to anon;
grant select (
  id, slug, titulo, bajada, etiqueta, cuerpo, lugar, categoria_id, firma, fuentes,
  imagen_ruta, imagen_alt, imagen_credito, imagen_pie, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste,
  estado, publicado_en, es_demo, busqueda, creado_en, actualizado_en
) on public.notas to anon;
grant select (
  id, slug, palabra_clave, cuerpo, lugar, categoria_id, firma, fuentes, nota_id,
  imagen_ruta, imagen_alt, imagen_credito, imagen_pie, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste,
  estado, publicado_en, es_demo, busqueda, creado_en, actualizado_en
) on public.fragmentos to anon;
grant select (
  id, tipo, valor, texto, cita, atribucion, titulo, acento, fuentes,
  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste,
  estado, publicado_en, es_demo
) on public.destacados to anon;
grant select (zona, posicion, nota_id, destacado_id) on public.ubicaciones_portada to anon;

grant select, insert, update, delete on public.categorias to authenticated;
grant select, insert, update, delete on public.notas to authenticated;
grant select, insert, update, delete on public.fragmentos to authenticated;
grant select, insert, update, delete on public.destacados to authenticated;
grant select, insert, update, delete on public.ubicaciones_portada to authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre_visible, rol, activo) on public.perfiles to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.categorias enable row level security;
alter table public.perfiles enable row level security;
alter table public.notas enable row level security;
alter table public.fragmentos enable row level security;
alter table public.destacados enable row level security;
alter table public.ubicaciones_portada enable row level security;

-- Categorías ------------------------------------------------------------------
create policy "categorias: lectura pública"
  on public.categorias for select to anon, authenticated
  using (true);
create policy "categorias: alta solo administrador"
  on public.categorias for insert to authenticated
  with check (privado.es_admin());
create policy "categorias: cambios administrador y editor"
  on public.categorias for update to authenticated
  using (privado.puede_publicar())
  with check (privado.puede_publicar());
create policy "categorias: baja solo administrador"
  on public.categorias for delete to authenticated
  using (privado.es_admin());

-- Perfiles --------------------------------------------------------------------
create policy "perfiles: cada usuario ve el suyo y el equipo ve a todos"
  on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or privado.es_equipo());
create policy "perfiles: cada usuario edita el suyo, el administrador todos"
  on public.perfiles for update to authenticated
  using (id = (select auth.uid()) or privado.es_admin())
  with check (id = (select auth.uid()) or privado.es_admin());
-- Sin políticas de insert ni delete: los perfiles los crea el trigger de Auth.

-- Notas -----------------------------------------------------------------------
create policy "notas: lectura pública de lo publicado"
  on public.notas for select to anon, authenticated
  using (privado.es_publico(estado, publicado_en));
create policy "notas: el equipo ve lo que puede trabajar"
  on public.notas for select to authenticated
  using (privado.puede_publicar() or (privado.es_redactor() and autor_id = (select auth.uid())));
create policy "notas: alta"
  on public.notas for insert to authenticated
  with check (
    privado.puede_publicar()
    or (privado.es_redactor() and autor_id = (select auth.uid()) and estado in ('borrador', 'en_revision'))
  );
create policy "notas: edición"
  on public.notas for update to authenticated
  using (
    privado.puede_publicar()
    or (privado.es_redactor() and autor_id = (select auth.uid()) and estado = 'borrador')
  )
  with check (
    privado.puede_publicar()
    or (privado.es_redactor() and autor_id = (select auth.uid()) and estado in ('borrador', 'en_revision'))
  );
create policy "notas: baja"
  on public.notas for delete to authenticated
  using (
    privado.es_admin()
    or (privado.es_redactor() and autor_id = (select auth.uid()) and estado = 'borrador')
  );

-- Fragmentos ------------------------------------------------------------------
create policy "fragmentos: lectura pública de lo publicado"
  on public.fragmentos for select to anon, authenticated
  using (privado.es_publico(estado, publicado_en));
create policy "fragmentos: el equipo ve lo que puede trabajar"
  on public.fragmentos for select to authenticated
  using (privado.puede_publicar() or (privado.es_redactor() and autor_id = (select auth.uid())));
create policy "fragmentos: alta"
  on public.fragmentos for insert to authenticated
  with check (
    privado.puede_publicar()
    or (privado.es_redactor() and autor_id = (select auth.uid()) and estado in ('borrador', 'en_revision'))
  );
create policy "fragmentos: edición"
  on public.fragmentos for update to authenticated
  using (
    privado.puede_publicar()
    or (privado.es_redactor() and autor_id = (select auth.uid()) and estado = 'borrador')
  )
  with check (
    privado.puede_publicar()
    or (privado.es_redactor() and autor_id = (select auth.uid()) and estado in ('borrador', 'en_revision'))
  );
create policy "fragmentos: baja"
  on public.fragmentos for delete to authenticated
  using (
    privado.es_admin()
    or (privado.es_redactor() and autor_id = (select auth.uid()) and estado = 'borrador')
  );

-- Destacados (solo administrador y editor los gestionan) ----------------------
create policy "destacados: lectura pública de lo publicado"
  on public.destacados for select to anon, authenticated
  using (privado.es_publico(estado, publicado_en));
create policy "destacados: lectura del equipo editorial"
  on public.destacados for select to authenticated
  using (privado.puede_publicar());
create policy "destacados: alta"
  on public.destacados for insert to authenticated
  with check (privado.puede_publicar());
create policy "destacados: edición"
  on public.destacados for update to authenticated
  using (privado.puede_publicar())
  with check (privado.puede_publicar());
create policy "destacados: baja"
  on public.destacados for delete to authenticated
  using (privado.puede_publicar());

-- Ubicaciones de portada ------------------------------------------------------
-- El público solo ve ubicaciones cuyo contenido es público.
create policy "portada: lectura pública"
  on public.ubicaciones_portada for select to anon, authenticated
  using (
    (nota_id is not null and exists (
      select 1 from public.notas n
      where n.id = ubicaciones_portada.nota_id and privado.es_publico(n.estado, n.publicado_en)))
    or (destacado_id is not null and exists (
      select 1 from public.destacados d
      where d.id = ubicaciones_portada.destacado_id and privado.es_publico(d.estado, d.publicado_en)))
  );
create policy "portada: lectura del equipo editorial"
  on public.ubicaciones_portada for select to authenticated
  using (privado.puede_publicar());
create policy "portada: organizar (alta)"
  on public.ubicaciones_portada for insert to authenticated
  with check (privado.puede_publicar());
create policy "portada: organizar (cambios)"
  on public.ubicaciones_portada for update to authenticated
  using (privado.puede_publicar())
  with check (privado.puede_publicar());
create policy "portada: organizar (baja)"
  on public.ubicaciones_portada for delete to authenticated
  using (privado.puede_publicar());

-- Las funciones auxiliares solo se ejecutan desde las políticas y validaciones.
revoke all on all functions in schema privado from public;
grant execute on all functions in schema privado to anon, authenticated, service_role;

commit;
