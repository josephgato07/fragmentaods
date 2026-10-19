# Instalar la etapa 3 (panel editorial)

Tiempo estimado: 20 minutos, más las pruebas.

## Resumen

| | |
| --- | --- |
| **SQL pendiente** | 1 migración nueva: `supabase/migrations/20261015170000_panel_editorial.sql` |
| **Variables nuevas** | Ninguna. Se usa el mismo `.env.local` de la etapa 2 |
| **Migraciones anteriores** | No se modifican. No se borra ningún dato |
| **Dependencias nuevas** | Ninguna (mismo `package.json`) |

---

## Paso 1 · Aplicar la migración nueva en Supabase

1. Abrí tu proyecto en https://supabase.com/dashboard → **SQL Editor → New query**.
2. En VS Code abrí `supabase/migrations/20261015170000_panel_editorial.sql`,
   seleccioná todo (`Ctrl+A`), copiá y pegalo en Supabase.
3. Apretá **Run**. Tiene que decir «Success. No rows returned».

Qué agrega (no toca tablas, políticas ni datos):

- `guardar_portada`: guarda de una sola vez apertura, secundarias y destacados.
  Solo editores y administradores. Respeta RLS.
- `listar_equipo`: lista perfiles con su correo. Solo administradores.
- `resumen_panel`: cantidades por estado para el inicio del panel. Cada rol ve
  solo lo que RLS le deja ver.

Si la ejecutás dos veces, la segunda falla con «function … already exists» y no
cambia nada: es esperable.

## Paso 2 · Comprobar la base

En **SQL Editor → New query**, pegá y ejecutá, uno por vez:

1. `supabase/pruebas/panel.sql` → **21 filas OK** (funciones nuevas por rol).
2. `supabase/pruebas/permisos.sql` → **51 filas OK** (lo de la etapa 2 sigue igual).

Los dos scripts trabajan dentro de una transacción que se deshace: no dejan
usuarios, contenidos ni cambios en la portada.

> `permisos.sql` comprueba que el público no vea notas cuya dirección empiece con
> `prueba-`. Si alguna vez publicás una nota real con una dirección así, esa fila va a
> dar FALLA sin que haya un problema de permisos.

## Paso 3 · Reemplazar el código

En la etapa 3 las páginas públicas se movieron a `src/app/(portal)/`. Si copiás los
archivos nuevos **encima** de la carpeta anterior, quedan duplicadas las páginas viejas
y la compilación falla. Por eso:

1. Cerrá `npm run dev` si está corriendo (`Ctrl+C` en la terminal).
2. Renombrá tu carpeta actual, por ejemplo a `fragmentados-etapa2` (queda de respaldo).
3. Descomprimí `fragmentados-etapa3.zip`. Se crea una carpeta `fragmentados` nueva.
4. Copiá tu `.env.local` desde `fragmentados-etapa2` a la carpeta nueva. Es el único
   archivo que hay que traer.
5. En la terminal, dentro de la carpeta nueva:

```bash
npm install
npm run typecheck
npm run build
npm start
```

`npm run build` tiene que terminar sin errores. Si se queja de que Supabase no
responde, revisá `.env.local`.

## Paso 4 · Entrar al panel

Abrí http://localhost:3000/panel e ingresá con el correo y la contraseña de Manuel.

- Si dice «todavía no está activo», el perfil tiene `activo = false`.
- Si dice «Correo o contraseña incorrectos», revisalo en
  **Authentication → Users**. Ahí también se puede enviar un enlace para cambiar la
  contraseña.

## Paso 5 · Sumar al equipo

El panel no crea usuarios: hacerlo exigiría la clave secreta en el servidor, y en
esta etapa no se usa. El procedimiento:

1. Supabase → **Authentication → Users → Add user → Create new user**. Correo,
   contraseña y **Auto Confirm User** marcado.
2. Ese usuario aparece en el panel, en **Usuarios**, como redactor inactivo.
3. Ahí, como administrador, poné su nombre visible, elegí el rol, marcá **Activo** y
   apretá **Guardar**.

Nadie puede cambiar su propio rol ni desactivarse, ni siquiera un administrador. La
base no deja quedar sin un administrador activo.

---

## Pruebas para hacer en tu proyecto real

Estas pruebas no las pude hacer yo, porque necesitan tu proyecto de Supabase y tu
hosting. Recomiendo crear para la prueba un usuario editor y uno redactor con correos
tuyos, y desactivarlos al terminar.

**A. Roles**

1. Como **redactor**:
   - En el menú no aparecen Portada, Categorías ni Usuarios. Abiertas por dirección,
     muestran «Sin acceso».
   - Al crear una noticia no aparece «Publicar».
   - Escribí título, categoría y un párrafo con una palabra en énfasis.
     **Guardar borrador** → «✓ Cambios guardados».
   - Editá algo y hacé clic en «Inicio»: tiene que avisar que hay cambios sin guardar.
   - **Enviar a revisión** → queda en solo lectura.
   - La **Vista previa privada** se ve. La dirección pública `/nota/…` da «Esta página
     no existe».
2. Como **editor**:
   - La nota aparece en «Pendientes de revisión».
   - **Publicar ahora** sin imagen tiene que dar error.
   - Subí una imagen, completá el texto alternativo y publicá. La nota se tiene que ver
     en el portal enseguida.
3. Como **editor**:
   - **Portada** → ponela de apertura → **Guardar portada** → la portada pública
     cambia al recargar.
   - **Despublicar** → la nota desaparece del portal.
   - Programala para dentro de 3 minutos y comprobá que aparezca sola.
4. Como **administrador** (Manuel):
   - En **Usuarios** no podés cambiar tu rol ni tu activación.
   - Cambiá el rol del usuario de prueba y comprobá que se aplica.

**B. Imágenes en Storage real**

- Un JPEG de varios MB se sube y se ve.
- Un archivo de más de 10 MB lo rechaza el panel con un mensaje.
- Un SVG o un PDF no se puede elegir o lo rechaza.

**C. Hosting**

El portal se actualiza sin recompilar con `npm start` en tu computadora o en un
servidor, y en Vercel. Si lo publicás en otro servicio, repetí la prueba A.3 ahí.

**D. Cierre**

- Volvé a dejar la portada como la querés.
- Desactivá los usuarios de prueba en **Usuarios**.
- Las imágenes de prueba quedan en Storage. Si querés, borralas en
  **Storage → imagenes-editoriales**.

---

## Archivos de esta etapa

**Nuevos**

```
supabase/migrations/20261015170000_panel_editorial.sql   Migración 4 (SQL pendiente)
supabase/pruebas/panel.sql                               21 pruebas de la migración 4
INSTALAR-ETAPA-3.md                                      Esta guía

src/app/(portal)/layout.tsx          Encabezado y pie del portal (antes en src/app/layout.tsx)
src/app/panel/layout.tsx             Panel fuera de buscadores (noindex)
src/app/panel/ingresar/page.tsx      Ingreso
src/app/panel/(privado)/…            Inicio, noticias, fragmentos, portada, categorías,
                                     usuarios y vista previa privada (todas exigen sesión)
src/app/panel/_acciones/             Server Actions: sesión, contenido y administración
src/components/panel/                Editor visual, imágenes, barra de acciones, listados…
src/components/views/                Nota y fragmento, compartidos por el portal y la vista previa
src/lib/panel/                       Reglas por rol, fechas de Uruguay, consultas y validaciones
public/panel/sin-imagen.png          Imagen de reemplazo para la vista previa
```

**Movidos sin cambios de comportamiento** (de `src/app/` a `src/app/(portal)/`)

```
page.tsx, page.module.css, error.tsx, estados.module.css,
seccion/, nota/, fragmento/, fragmentos/, buscar/
```

Las direcciones públicas no cambian: `(portal)` es un grupo y no aparece en la URL.

**Modificados**

```
src/app/layout.tsx       Solo fuentes y estilos globales (encabezado y pie pasaron a (portal))
src/app/not-found.tsx    Agrega el logo, porque ahora también la usa el panel
src/app/globals.css      Los campos de texto y las listas desplegables heredan la tipografía
src/proxy.ts             Refresca la sesión solo en /panel
next.config.ts           Opción para pruebas locales (ver abajo). En tu proyecto no hace nada
README.md, supabase/README.md
```

`next.config.ts` lee `IMAGENES_SUPABASE_LOCAL`. Sirve solo para probar contra un
Supabase en la propia computadora (127.0.0.1). **No la agregues** a tu `.env.local`.
