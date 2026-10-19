# FRAGMENTADOS — etapa 3

Portal periodístico con lectura pública desde Supabase y panel editorial en `/panel`.

**Instalar esta etapa sobre un proyecto existente: [`INSTALAR-ETAPA-3.md`](INSTALAR-ETAPA-3.md).**
Next.js 16 (App Router) + TypeScript + CSS Modules + Supabase (Postgres, Auth, Storage).

**Configuración de Supabase paso a paso: [`supabase/README.md`](supabase/README.md).**

Origen de los contenidos (`CONTENT_SOURCE` en `.env.local`):
- `supabase`: lee de Supabase. Es lo normal.
- `demo`: usa los datos de muestra locales y no necesita credenciales.
- Sin definir: en desarrollo, si faltan las variables de Supabase, usa la demo con un aviso. En producción da error para no publicar la demo por accidente.

## Requisitos

- Node.js 22.18 o superior (recomendado: 22 o 24 LTS). Comprobá con `node -v`.
- Visual Studio Code (opcional).

## Ejecutar en tu computadora

```bash
cd fragmentados
npm install
copy .env.example .env.local      (en Mac/Linux: cp .env.example .env.local)
npm run dev
```

Abrí http://localhost:3000.

Para probar la versión de producción:

```bash
npm run build
npm start
```

Comprobación de tipos sin compilar: `npm run typecheck`.

Para ver el portal desde el celular en la misma red Wi-Fi: `npm run dev -- -H 0.0.0.0`
y abrí `http://IP-DE-TU-COMPUTADORA:3000` en el teléfono.

## Rutas

| Ruta | Contenido |
| --- | --- |
| `/` | Portada: apertura, tres secundarias, últimos fragmentos, módulos por sección, destacados |
| `/seccion/[slug]` | Noticias y fragmentos de una sección (`politica`, `economia`, `vivienda`, `transporte`) |
| `/nota/[slug]` | Nota completa |
| `/fragmento/[slug]` | Fragmento |
| `/fragmentos` | Todos los fragmentos |
| `/buscar?q=…` | Buscador sobre notas y fragmentos |
| `/panel` | Panel editorial (exige sesión; ver más abajo) |

## Estructura

```
src/
  app/
    layout.tsx              Fuentes y estilos globales (común a portal y panel)
    globals.css             Base, foco visible, énfasis y enlaces, movimiento reducido
    (portal)/               Portal público (el grupo no aparece en la URL)
      layout.tsx            Header, footer, regeneración cada 60 s
      page.tsx              Portada
      seccion/ nota/ fragmento/ fragmentos/ buscar/
    panel/
      ingresar/             Ingreso con correo y contraseña
      (privado)/            Todo lo que exige sesión activa
      _acciones/            Server Actions (validan sesión y rol en cada llamada)
  components/
    views/                  Nota y fragmento (portal y vista previa privada)
    panel/                  Editor visual, imágenes, acciones, listados, administración
  lib/
    content/                Modelo y acceso a contenidos públicos
    panel/                  Reglas por rol, fechas de Uruguay, consultas del panel
    supabase/               Clientes (público cacheado, con sesión, navegador)
    auth/perfil.ts          Perfil y rol del usuario actual
  styles/tokens.css         Variables de diseño
public/demo/                Imágenes del kit
```

## Panel editorial

| Ruta | Quién | Para qué |
| --- | --- | --- |
| `/panel` | Todos | Resumen por estado y pendientes |
| `/panel/notas`, `/panel/fragmentos` | Todos | Listados con búsqueda y filtros por estado y categoría |
| `/panel/notas/nueva`, `/panel/notas/[id]` | Todos | Editor visual (el redactor solo lo suyo y en borrador) |
| `/panel/vista-previa/…` | Quien puede editarlo | Vista previa privada, nunca en rutas públicas |
| `/panel/portada` | Editor, administrador | Apertura, secundarias y destacados, en orden |
| `/panel/categorias`, `/panel/usuarios` | Administrador | Categorías; nombre visible, rol y activación |

Acciones por rol:

| Acción | Redactor | Editor y administrador |
| --- | --- | --- |
| Guardar borrador | Sus borradores | Siempre |
| Enviar a revisión | Sus borradores | — |
| Devolver a borrador | — | Desde revisión |
| Publicar ahora, programar | — | Sí |
| Despublicar | — | Sí |

Las fechas se muestran y se eligen en hora de Uruguay y se guardan con zona horaria
(`timestamptz`). Publicar, editar algo publicado, despublicar o guardar la portada
actualiza el portal al instante. Lo programado aparece solo cuando llega la hora,
con hasta 60 s de demora.

Los permisos se validan tres veces: en la pantalla (qué botones se ven), en cada
Server Action (sesión, rol, estado) y en la base (RLS y triggers). Si las dos
primeras fallaran, la base igual rechaza la operación.

## Supabase

```
supabase/
  migrations/           SQL en orden (esquema, roles y RLS, Storage, funciones del panel)
  seed/demo_kit.sql     Contenidos de muestra del kit (opcional)
  pruebas/permisos.sql  51 pruebas de permisos que no dejan datos
  pruebas/panel.sql     21 pruebas de las funciones del panel
src/lib/supabase/
  config.ts             Variables públicas y bloqueo de claves secretas
  public.ts             Cliente anónimo y cacheado para el portal (solo servidor)
  server.ts             Cliente con sesión para el panel
  browser.ts            Cliente de navegador (subida de imágenes del panel)
src/lib/auth/perfil.ts  Perfil y rol del usuario, más requerirRol() para Server Actions
src/lib/content/
  supabase-repository.ts  Implementación de ContentRepository sobre Supabase
  mappers.ts              Filas a tipos, con revalidación del cuerpo
src/proxy.ts            Refresco de sesión solo en /panel
scripts/verificar-supabase.mjs  Comprobación de conexión y permisos
```

Actualización del portal: las páginas públicas se regeneran como máximo cada 60 s, y el
panel además las invalida al instante cuando publica, edita, despublica o reordena. `npm run build` necesita que
Supabase responda, porque genera la portada durante la compilación.

## Contenido de muestra

Titulares, textos, cifras, la cita y las imágenes provienen del kit editable, y en
Supabase quedan marcados con `es_demo = true`. Son de relleno y hay que reemplazar las
fechas y horas exactas, la firma «Redacción FRAGMENTADOS», los créditos fotográficos y
la asignación de cada pieza a una sección.
