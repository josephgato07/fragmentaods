-- =============================================================================
-- FRAGMENTADOS · Migración 1 de 3 · Esquema de contenidos
-- =============================================================================
-- Crea: tipos, categorías, perfiles, notas, fragmentos, destacados y
-- ubicaciones de portada, con validación del cuerpo y búsqueda sin tildes.
--
-- Es ADITIVA: no borra tablas ni datos. Si alguna tabla ya existe, la
-- migración falla completa (no aplica nada a medias) en lugar de pisarla.
-- Ejecutar una sola vez, en orden, desde el SQL Editor de Supabase.
-- =============================================================================

begin;

-- Extensión para normalizar tildes en la búsqueda (Supabase la instala en "extensions").
create extension if not exists unaccent with schema extensions;

-- Esquema interno para funciones auxiliares. No se publica en la API.
create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.rol_usuario as enum ('administrador', 'editor', 'redactor');
create type public.estado_contenido as enum ('borrador', 'en_revision', 'publicado');
create type public.tipo_destacado as enum ('cifra', 'cita', 'foto');
create type public.zona_portada as enum ('apertura', 'secundaria', 'destacado');

-- -----------------------------------------------------------------------------
-- Validación del contenido estructurado (JSON, nunca HTML)
--
-- Formato de un texto en línea (igual que el tipo `Inline` del proyecto):
--   "texto plano"
--   {"type": "enfasis", "text": "frase subrayada"}            (máx. 240 caracteres)
--   {"type": "enlace",  "text": "texto", "href": "/ruta" | "https://..."}
--
-- Cuerpo de nota: lista de bloques
--   {"type": "parrafo",   "content": [<inline>, ...]}
--   {"type": "imagen",    "imagen": {ruta, alt, ancho, alto, credito?, pie?, foco?, ajuste?}}
--   {"type": "pendiente", "note": "texto"}
--
-- Cuerpo de fragmento: lista de párrafos, cada uno una lista de <inline>.
--
-- React escapa todo el texto al mostrarlo; los enlaces solo admiten rutas
-- internas o https. No se acepta HTML, javascript: ni data:.
-- -----------------------------------------------------------------------------

create function privado.texto_valido(valor jsonb, minimo int, maximo int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select valor is not null
     and jsonb_typeof(valor) = 'string'
     and char_length(btrim(valor #>> '{}')) between minimo and maximo;
$$;

create function privado.claves_permitidas(objeto jsonb, permitidas text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select not exists (
    select 1 from jsonb_object_keys(objeto) as k where k <> all (permitidas)
  );
$$;

create function privado.ruta_imagen_valida(ruta text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select ruta is not null
     and char_length(ruta) <= 300
     and position('..' in ruta) = 0
     and position('//' in ruta) = 0
     and (
       -- Imágenes de muestra incluidas en el proyecto (public/demo)
       ruta ~ '^/demo/[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$'
       -- Imágenes subidas al bucket "imagenes-editoriales"
       or ruta ~ '^(notas|fragmentos|destacados|general)/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$'
     );
$$;

create function privado.href_valido(href text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select href is not null
     and char_length(href) <= 2000
     and (
       href ~ '^/([^/[:space:]<>"''`\\][^[:space:]<>"''`\\]*)?$'
       or href ~ '^https://[^[:space:]<>"''`\\]+$'
     );
$$;

create function privado.inline_valido(item jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(item) = 'string' then
    return char_length(item #>> '{}') between 1 and 5000;
  end if;
  if jsonb_typeof(item) <> 'object' then
    return false;
  end if;
  if item ->> 'type' = 'enfasis' then
    return privado.claves_permitidas(item, array['type', 'text'])
       and privado.texto_valido(item -> 'text', 1, 240);
  end if;
  if item ->> 'type' = 'enlace' then
    return privado.claves_permitidas(item, array['type', 'text', 'href'])
       and privado.texto_valido(item -> 'text', 1, 300)
       and jsonb_typeof(item -> 'href') = 'string'
       and privado.href_valido(item ->> 'href');
  end if;
  return false;
end;
$$;

create function privado.parrafo_valido(parrafo jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(parrafo) = 'array'
     and jsonb_array_length(parrafo) between 1 and 200
     and not exists (
       select 1 from jsonb_array_elements(parrafo) as e where not privado.inline_valido(e)
     );
$$;

create function privado.imagen_json_valida(imagen jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(imagen) = 'object'
     and privado.claves_permitidas(imagen, array['ruta', 'alt', 'ancho', 'alto', 'credito', 'pie', 'foco', 'ajuste'])
     and jsonb_typeof(imagen -> 'ruta') = 'string'
     and privado.ruta_imagen_valida(imagen ->> 'ruta')
     and privado.texto_valido(imagen -> 'alt', 1, 400)
     and jsonb_typeof(imagen -> 'ancho') = 'number'
     and jsonb_typeof(imagen -> 'alto') = 'number'
     and (imagen ->> 'ancho') ~ '^[0-9]+$' and (imagen ->> 'ancho')::int between 1 and 20000
     and (imagen ->> 'alto') ~ '^[0-9]+$' and (imagen ->> 'alto')::int between 1 and 20000
     and (imagen -> 'credito' is null or jsonb_typeof(imagen -> 'credito') = 'null' or privado.texto_valido(imagen -> 'credito', 1, 200))
     and (imagen -> 'pie' is null or jsonb_typeof(imagen -> 'pie') = 'null' or privado.texto_valido(imagen -> 'pie', 1, 500))
     and (imagen -> 'foco' is null or jsonb_typeof(imagen -> 'foco') = 'null'
          or (imagen ->> 'foco') ~ '^(100|[1-9]?[0-9])% (100|[1-9]?[0-9])%$')
     and (imagen -> 'ajuste' is null or jsonb_typeof(imagen -> 'ajuste') = 'null'
          or (imagen ->> 'ajuste') in ('cover', 'contain'));
$$;

create function privado.bloque_nota_valido(bloque jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(bloque) <> 'object' then
    return false;
  end if;
  case bloque ->> 'type'
    when 'parrafo' then
      return privado.claves_permitidas(bloque, array['type', 'content'])
         and privado.parrafo_valido(bloque -> 'content');
    when 'imagen' then
      return privado.claves_permitidas(bloque, array['type', 'imagen'])
         and privado.imagen_json_valida(bloque -> 'imagen');
    when 'pendiente' then
      return privado.claves_permitidas(bloque, array['type', 'note'])
         and privado.texto_valido(bloque -> 'note', 1, 600);
    else
      return false;
  end case;
end;
$$;

create function privado.cuerpo_nota_valido(cuerpo jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(cuerpo) = 'array'
     and jsonb_array_length(cuerpo) <= 400
     and not exists (
       select 1 from jsonb_array_elements(cuerpo) as b where not privado.bloque_nota_valido(b)
     );
$$;

create function privado.cuerpo_fragmento_valido(cuerpo jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(cuerpo) = 'array'
     and jsonb_array_length(cuerpo) <= 20
     and not exists (
       select 1 from jsonb_array_elements(cuerpo) as p where not privado.parrafo_valido(p)
     );
$$;

create function privado.fuentes_validas(fuentes jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(fuentes) = 'array'
     and jsonb_array_length(fuentes) <= 30
     and not exists (
       select 1
       from jsonb_array_elements(fuentes) as f
       where not (
         jsonb_typeof(f) = 'object'
         and privado.claves_permitidas(f, array['label', 'url'])
         and privado.texto_valido(f -> 'label', 1, 300)
         and (f -> 'url' is null or jsonb_typeof(f -> 'url') = 'null'
              or (jsonb_typeof(f -> 'url') = 'string' and (f ->> 'url') ~ '^https://[^[:space:]<>"''`\\]+$'
                  and char_length(f ->> 'url') <= 2000))
       )
     );
$$;

-- Texto plano de un cuerpo, para la búsqueda.
create function privado.texto_de_inlines(parrafo jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(string_agg(
    case jsonb_typeof(e) when 'string' then e #>> '{}' else e ->> 'text' end, ''), '')
  from jsonb_array_elements(case when jsonb_typeof(parrafo) = 'array' then parrafo else '[]'::jsonb end) as e;
$$;

create function privado.texto_de_cuerpo_nota(cuerpo jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(string_agg(
    case b ->> 'type'
      when 'parrafo' then privado.texto_de_inlines(b -> 'content')
      when 'imagen' then coalesce(b -> 'imagen' ->> 'pie', '')
      else ''
    end, ' '), '')
  from jsonb_array_elements(cuerpo) as b;
$$;

create function privado.texto_de_cuerpo_fragmento(cuerpo jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(string_agg(privado.texto_de_inlines(p), ' '), '')
  from jsonb_array_elements(cuerpo) as p;
$$;

-- Minúsculas y sin tildes: "Economía" -> "economia".
create function privado.normalizar(texto text)
returns text
language sql
stable
set search_path = ''
as $$
  select regexp_replace(lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(texto, ''))), '\s+', ' ', 'g');
$$;

-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  orden smallint not null default 0,
  en_portada boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on table public.categorias is 'Secciones del portal. orden y en_portada definen los módulos de la portada.';

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_visible text not null default '' check (char_length(nombre_visible) <= 120),
  rol public.rol_usuario not null default 'redactor',
  activo boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on table public.perfiles is 'Un perfil por usuario de Supabase Auth. Se crea inactivo y como redactor; solo un administrador cambia rol y activo.';

create table public.notas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 160),
  titulo text not null check (char_length(btrim(titulo)) between 1 and 300),
  bajada text check (bajada is null or char_length(btrim(bajada)) between 1 and 600),
  etiqueta text check (etiqueta is null or char_length(btrim(etiqueta)) between 1 and 40),
  cuerpo jsonb not null default '[]'::jsonb check (privado.cuerpo_nota_valido(cuerpo)),
  lugar text not null default 'Uruguay' check (char_length(btrim(lugar)) between 1 and 80),
  categoria_id uuid not null references public.categorias (id) on delete restrict,
  autor_id uuid default auth.uid() references public.perfiles (id) on delete set null,
  firma text not null default 'Redacción FRAGMENTADOS' check (char_length(btrim(firma)) between 1 and 120),
  fuentes jsonb not null default '[]'::jsonb check (privado.fuentes_validas(fuentes)),
  imagen_ruta text check (imagen_ruta is null or privado.ruta_imagen_valida(imagen_ruta)),
  imagen_alt text check (imagen_alt is null or char_length(btrim(imagen_alt)) between 1 and 400),
  imagen_credito text check (imagen_credito is null or char_length(btrim(imagen_credito)) between 1 and 200),
  imagen_pie text check (imagen_pie is null or char_length(btrim(imagen_pie)) between 1 and 500),
  imagen_ancho integer check (imagen_ancho is null or imagen_ancho between 1 and 20000),
  imagen_alto integer check (imagen_alto is null or imagen_alto between 1 and 20000),
  imagen_foco text check (imagen_foco is null or imagen_foco ~ '^(100|[1-9]?[0-9])% (100|[1-9]?[0-9])%$'),
  imagen_ajuste text not null default 'cover' check (imagen_ajuste in ('cover', 'contain')),
  estado public.estado_contenido not null default 'borrador',
  publicado_en timestamptz,
  es_demo boolean not null default false,
  busqueda text not null default '',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references public.perfiles (id) on delete set null,
  constraint notas_imagen_completa check (
    (imagen_ruta is null and imagen_alt is null and imagen_ancho is null and imagen_alto is null)
    or (imagen_ruta is not null and imagen_alt is not null and imagen_ancho is not null and imagen_alto is not null)
  ),
  constraint notas_publicable check (
    estado <> 'publicado' or (publicado_en is not null and imagen_ruta is not null)
  )
);
comment on column public.notas.etiqueta is 'Texto de la etiqueta verde. Si es null se usa el nombre de la categoría.';
comment on column public.notas.firma is 'Firma pública. autor_id identifica al usuario responsable y no se expone al público.';
comment on column public.notas.busqueda is 'Texto normalizado para el buscador. Lo completa un trigger.';

create table public.fragmentos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 160),
  palabra_clave text not null check (char_length(btrim(palabra_clave)) between 1 and 60),
  cuerpo jsonb not null default '[]'::jsonb check (privado.cuerpo_fragmento_valido(cuerpo)),
  lugar text not null default 'Uruguay' check (char_length(btrim(lugar)) between 1 and 80),
  categoria_id uuid not null references public.categorias (id) on delete restrict,
  autor_id uuid default auth.uid() references public.perfiles (id) on delete set null,
  firma text not null default 'Redacción FRAGMENTADOS' check (char_length(btrim(firma)) between 1 and 120),
  fuentes jsonb not null default '[]'::jsonb check (privado.fuentes_validas(fuentes)),
  nota_id uuid references public.notas (id) on delete set null,
  imagen_ruta text check (imagen_ruta is null or privado.ruta_imagen_valida(imagen_ruta)),
  imagen_alt text check (imagen_alt is null or char_length(btrim(imagen_alt)) between 1 and 400),
  imagen_credito text check (imagen_credito is null or char_length(btrim(imagen_credito)) between 1 and 200),
  imagen_pie text check (imagen_pie is null or char_length(btrim(imagen_pie)) between 1 and 500),
  imagen_ancho integer check (imagen_ancho is null or imagen_ancho between 1 and 20000),
  imagen_alto integer check (imagen_alto is null or imagen_alto between 1 and 20000),
  imagen_foco text check (imagen_foco is null or imagen_foco ~ '^(100|[1-9]?[0-9])% (100|[1-9]?[0-9])%$'),
  imagen_ajuste text not null default 'cover' check (imagen_ajuste in ('cover', 'contain')),
  estado public.estado_contenido not null default 'borrador',
  publicado_en timestamptz,
  es_demo boolean not null default false,
  busqueda text not null default '',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references public.perfiles (id) on delete set null,
  constraint fragmentos_imagen_completa check (
    (imagen_ruta is null and imagen_alt is null and imagen_ancho is null and imagen_alto is null)
    or (imagen_ruta is not null and imagen_alt is not null and imagen_ancho is not null and imagen_alto is not null)
  ),
  constraint fragmentos_publicable check (
    estado <> 'publicado' or (publicado_en is not null and jsonb_array_length(cuerpo) >= 1)
  )
);

create table public.destacados (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_destacado not null,
  valor text check (valor is null or char_length(btrim(valor)) between 1 and 16),
  texto text check (texto is null or char_length(btrim(texto)) between 1 and 400),
  cita text check (cita is null or char_length(btrim(cita)) between 1 and 600),
  atribucion text check (atribucion is null or char_length(btrim(atribucion)) between 1 and 160),
  titulo text check (titulo is null or char_length(btrim(titulo)) between 1 and 120),
  acento text check (acento is null or char_length(btrim(acento)) between 1 and 120),
  fuentes jsonb not null default '[]'::jsonb check (privado.fuentes_validas(fuentes)),
  imagen_ruta text check (imagen_ruta is null or privado.ruta_imagen_valida(imagen_ruta)),
  imagen_alt text check (imagen_alt is null or char_length(btrim(imagen_alt)) between 1 and 400),
  imagen_credito text check (imagen_credito is null or char_length(btrim(imagen_credito)) between 1 and 200),
  imagen_ancho integer check (imagen_ancho is null or imagen_ancho between 1 and 20000),
  imagen_alto integer check (imagen_alto is null or imagen_alto between 1 and 20000),
  imagen_foco text check (imagen_foco is null or imagen_foco ~ '^(100|[1-9]?[0-9])% (100|[1-9]?[0-9])%$'),
  imagen_ajuste text not null default 'cover' check (imagen_ajuste in ('cover', 'contain')),
  estado public.estado_contenido not null default 'borrador',
  publicado_en timestamptz,
  es_demo boolean not null default false,
  creado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references public.perfiles (id) on delete set null,
  constraint destacados_imagen_completa check (
    (imagen_ruta is null and imagen_alt is null and imagen_ancho is null and imagen_alto is null)
    or (imagen_ruta is not null and imagen_alt is not null and imagen_ancho is not null and imagen_alto is not null)
  ),
  constraint destacados_campos_por_tipo check (
    (tipo = 'cifra' and valor is not null and texto is not null)
    or (tipo = 'cita' and cita is not null)
    or (tipo = 'foto' and imagen_ruta is not null and titulo is not null)
  ),
  constraint destacados_publicable check (estado <> 'publicado' or publicado_en is not null)
);
comment on table public.destacados is 'Módulos de cifra, cita y fotografía de impacto de la portada.';

create table public.ubicaciones_portada (
  zona public.zona_portada not null,
  posicion smallint not null,
  nota_id uuid references public.notas (id) on delete cascade,
  destacado_id uuid references public.destacados (id) on delete cascade,
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  primary key (zona, posicion),
  constraint ubicacion_coherente check (
    (zona = 'apertura' and posicion = 1 and nota_id is not null and destacado_id is null)
    or (zona = 'secundaria' and posicion between 1 and 3 and nota_id is not null and destacado_id is null)
    or (zona = 'destacado' and posicion between 1 and 6 and destacado_id is not null and nota_id is null)
  )
);
comment on table public.ubicaciones_portada is 'Orden editorial de la portada: 1 apertura, hasta 3 secundarias y hasta 6 destacados.';

-- Una nota o un destacado ocupan como máximo una ubicación.
create unique index ubicaciones_portada_nota_unica on public.ubicaciones_portada (nota_id) where nota_id is not null;
create unique index ubicaciones_portada_destacado_unico on public.ubicaciones_portada (destacado_id) where destacado_id is not null;

-- Índices de lectura pública y de trabajo editorial
create index notas_publicacion_idx on public.notas (estado, publicado_en desc);
create index notas_categoria_idx on public.notas (categoria_id, publicado_en desc);
create index notas_autor_idx on public.notas (autor_id);
create index fragmentos_publicacion_idx on public.fragmentos (estado, publicado_en desc);
create index fragmentos_categoria_idx on public.fragmentos (categoria_id, publicado_en desc);
create index fragmentos_nota_idx on public.fragmentos (nota_id);
create index fragmentos_autor_idx on public.fragmentos (autor_id);
create index destacados_publicacion_idx on public.destacados (estado, publicado_en desc);

-- -----------------------------------------------------------------------------
-- Triggers de mantenimiento
-- -----------------------------------------------------------------------------

create function privado.marcar_actualizacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger categorias_actualizado before update on public.categorias
  for each row execute function privado.marcar_actualizacion();
create trigger perfiles_actualizado before update on public.perfiles
  for each row execute function privado.marcar_actualizacion();
create trigger ubicaciones_actualizado before update on public.ubicaciones_portada
  for each row execute function privado.marcar_actualizacion();

-- Texto de búsqueda de notas
create function privado.preparar_busqueda_nota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_categoria text;
begin
  select c.nombre into v_categoria from public.categorias c where c.id = new.categoria_id;
  new.busqueda := privado.normalizar(concat_ws(' ',
    new.titulo, new.bajada, new.etiqueta, new.lugar, v_categoria,
    privado.texto_de_cuerpo_nota(new.cuerpo)));
  return new;
end;
$$;

create function privado.preparar_busqueda_fragmento()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_categoria text;
begin
  select c.nombre into v_categoria from public.categorias c where c.id = new.categoria_id;
  new.busqueda := privado.normalizar(concat_ws(' ',
    new.palabra_clave, new.lugar, v_categoria,
    privado.texto_de_cuerpo_fragmento(new.cuerpo)));
  return new;
end;
$$;

create trigger notas_busqueda before insert or update on public.notas
  for each row execute function privado.preparar_busqueda_nota();
create trigger fragmentos_busqueda before insert or update on public.fragmentos
  for each row execute function privado.preparar_busqueda_fragmento();

commit;
