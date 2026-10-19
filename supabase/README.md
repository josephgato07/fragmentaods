# FRAGMENTADOS · Supabase

Guía para crear la base de datos, cargar los contenidos de muestra, crear el primer
administrador y comprobar los permisos.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `migrations/20261015120000_esquema_contenidos.sql` | Tablas, tipos, validación del cuerpo y búsqueda |
| `migrations/20261015120100_roles_y_permisos.sql` | Roles, perfiles automáticos, flujo editorial y políticas RLS |
| `migrations/20261015120200_storage_imagenes.sql` | Bucket de imágenes, límites y permisos |
| `migrations/20261015170000_panel_editorial.sql` | Funciones del panel: portada, equipo y resumen (etapa 3) |
| `seed/demo_kit.sql` | Contenidos de muestra del kit (opcional) |
| `pruebas/permisos.sql` | 51 pruebas de permisos (no deja datos) |
| `pruebas/panel.sql` | 21 pruebas de las funciones del panel (no deja datos) |

Las migraciones solo crean objetos: no borran tablas ni datos. Cada una corre dentro
de una transacción; si algo falla, no se aplica nada de esa migración.

---

## 1. Crear el proyecto

1. Entrá a https://supabase.com/dashboard y elegí **New project**.
2. Nombre: `fragmentados`. Región: **South America (São Paulo)**, la más cercana a Uruguay.
3. Generá una contraseña de base de datos fuerte y guardala en un gestor de contraseñas.
   La app no la usa.
4. Esperá a que el proyecto termine de crearse.

## 2. Cerrar el registro público

**Authentication → Sign In / Providers**

- Desactivá **Allow new users to sign up** y guardá.
- Dejá activo el proveedor **Email**: es el que va a usar el equipo para ingresar.

A partir de acá, los usuarios se crean solo desde el panel de Supabase. El rol y la
activación se asignan después en el panel editorial (**Usuarios**), por un administrador.

## 3. Aplicar las migraciones

**SQL Editor → New query**. Para cada archivo, en este orden:

1. Abrí el archivo en VS Code, seleccioná todo (`Ctrl+A`) y copiá.
2. Pegalo en el editor de Supabase y apretá **Run**.
3. Esperá «Success. No rows returned» antes de pasar al siguiente.

```
supabase/migrations/20261015120000_esquema_contenidos.sql
supabase/migrations/20261015120100_roles_y_permisos.sql
supabase/migrations/20261015120200_storage_imagenes.sql
supabase/migrations/20261015170000_panel_editorial.sql
```

Si Supabase avisa que una tabla se crea sin RLS después de la migración 1, es esperable:
la migración 2 lo activa en todas. Ejecutalas seguidas.

Opcional, para ver el portal con la demo: ejecutá también `supabase/seed/demo_kit.sql`.

## 4. Conectar el proyecto

1. **Project Settings → Data API**: copiá la **Project URL**.
2. **Project Settings → API Keys**: copiá la **Publishable key** (`sb_publishable_…`).
   No uses la **Secret key**.
3. En VS Code, copiá `.env.example` como `.env.local` y completá:

```
CONTENT_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Si pegás por error una clave secreta, la app se niega a arrancar y te lo avisa.

## 5. Crear el primer administrador

Este paso se hace solo desde el panel de Supabase. La app no permite que nadie se
asigne un rol.

1. **Authentication → Users → Add user → Create new user**.
2. Escribí tu correo y una contraseña larga, y marcá **Auto Confirm User**.
3. El usuario se crea con un perfil de **redactor inactivo**, es decir, sin permisos.
4. En **SQL Editor**, reemplazá el correo y ejecutá:

```sql
update public.perfiles
set rol = 'administrador', activo = true, nombre_visible = 'Tu nombre'
where id = (select id from auth.users where email = 'tu@correo.com');

select u.email, p.rol, p.activo
from public.perfiles p join auth.users u on u.id = p.id;
```

El resultado debe mostrar tu correo con rol `administrador` y `activo = true`.

Recomendado: activá la verificación en dos pasos en tu cuenta de Supabase
(Account → Security), porque esa cuenta controla la base completa.

Para sumar a alguien más del equipo, repetí los pasos 1 y 2 con su correo. Después,
en el panel editorial (`/panel/usuarios`), asignale nombre visible y rol, y activalo.

## 6. Comprobar

**En Supabase** (SQL Editor): ejecutá `supabase/pruebas/permisos.sql` (51 filas **OK**)
y `supabase/pruebas/panel.sql` (21 filas **OK**). Los scripts crean usuarios y contenidos de prueba
dentro de una transacción y la deshacen al final: no queda nada.

**Desde tu computadora**:

```bash
npm install
npm run verificar:supabase
npm run verificar:supabase -- --usuario tu@correo.com
npm run verificar:supabase -- --probar-registro
```

- El primero prueba la conexión y lo que el público puede y no puede hacer, incluida
  la subida de imágenes.
- El segundo inicia sesión con tu usuario y comprueba tu rol. La contraseña se pide
  en pantalla y no se guarda.
- El tercero intenta registrarse con un correo inventado: debe ser rechazado. Si el
  registro estuviera abierto, crea un usuario inactivo que tendrías que borrar.

Después: `npm run dev` y abrí http://localhost:3000.

## Organizar la portada

Desde el panel: **`/panel/portada`** (editor o administrador). Zonas: apertura (1),
secundarias (hasta 3) y destacados (hasta 6). Solo se pueden elegir contenidos
publicados o programados; lo programado aparece en su lugar cuando llega su hora. Si
falta alguna secundaria, la portada la completa con las notas más recientes.

## Reglas que impone la base

- **Visibilidad pública:** estado `publicado` y fecha de publicación cumplida. Lo
  programado aparece solo cuando llega su hora (con hasta 60 s de demora por la caché).
- **Para publicar una nota:** necesita imagen principal. Un fragmento necesita al menos
  un párrafo.
- **Redactor:**
  - Crea y edita sus borradores y los envía a revisión.
  - No publica, no ve borradores ajenos y no puede editar lo que ya envió a revisión.
- **Editor:**
  - Crea, edita y publica cualquier contenido.
  - Organiza la portada y los destacados.
  - No cambia roles ni elimina notas.
- **Administrador:**
  - Todo lo anterior, más gestionar categorías y roles, y eliminar contenidos.
  - Nadie puede cambiar su propio rol, y siempre queda al menos un administrador activo.
- **Cuerpo:** JSON con párrafos, énfasis, enlaces e imágenes. No se guarda HTML.
  - Los enlaces solo pueden ser rutas internas (`/…`) o `https://`.
  - El énfasis admite hasta 240 caracteres, para no subrayar párrafos enteros.
- **Imágenes:**
  - Bucket `imagenes-editoriales`, de lectura pública por URL.
  - Hasta 10 MB, en JPEG, PNG, WebP o AVIF.
  - Solo en las carpetas `notas/`, `fragmentos/`, `destacados/` y `general/`.
