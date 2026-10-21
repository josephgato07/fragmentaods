# Destacados editables y encabezado adaptable

## Instalación, en este orden

1. En el proyecto Supabase de Fragmentados (`fhicymgdlssjkkbvycpn`), abrí SQL Editor.
2. Copiá y ejecutá **solo** `supabase/migrations/20261021180000_destacados_nota.sql` una vez. Agrega el vínculo opcional a una noticia. No borra datos ni cambia las políticas existentes.
3. Incorporá esta rama a `main` desde el pull request. Vercel desplegará el cambio automáticamente. Esperá a que termine correctamente.
4. En tu PC, dentro del proyecto, ejecutá `git pull` para descargar los archivos actualizados.
5. Ingresá en `https://www.fragmentados.org/panel/destacados` con Manuel.

No se necesitan variables ni dependencias nuevas. La migración debe ejecutarse **antes** del despliegue: el repositorio público consulta la nueva relación.

## Uso

- Desde Portada: **Crear o editar destacados**. También aparece **Destacados** en el menú del panel.
- Elegí Nuevo destacado o uno existente para editarlo.
- Formatos: fotografía/noticia, cifra y cita.
- Podés vincular una noticia publicada. **Copiar título y foto** trae una copia editable; si el título supera 120 caracteres se recorta para que puedas ajustarlo. Estos campos no se sincronizan automáticamente con cambios posteriores de la nota.
- Las fotografías requieren título, foto y texto alternativo. Las citas admiten foto opcional.
- Marcá **Publicado** y guardá. Volvé a Portada, elegí el destacado en una posición y guardá la portada.
- Para retirarlo del portal, desmarcá Publicado y guardá. Para quitarlo de una posición, usá la cruz en Portada y guardá.
- Editar un destacado que ya está en portada refresca el portal. Los borradores quedan ocultos.
- Si la noticia vinculada se despublica, su enlace desaparece; el destacado es una pieza independiente y se mantiene hasta que lo retires.
- Las fechas de publicación existentes, incluidas las programadas, se conservan al editar. Este formulario no permite cambiar la fecha programada.

## Encabezado

Los enlaces y espacios ajustan su tamaño al ancho disponible. En tablet las categorías ocupan una fila aparte; en escritorio pueden compartir fila con el logo y el buscador. Los enlaces pueden pasar de línea para no superponerse, también si se agregan categorías.

## Comprobaciones

- Compilación de producción con contenido demo: correcta.
- TypeScript: correcto.
- `node --test tests/destacados.cjs`: ocho pruebas con sesión y API simuladas. Cubren permisos de la acción, creación, validación de foto/fuentes, nota no pública, despublicación, conservación de fecha y enlaces públicos.
- Pendiente en Supabase real: ejecutar la migración, crear/editar/publicar un destacado, subir una foto y guardarlo en portada. No se ejecutó SQL contra la base de producción desde este entorno.
- Pendiente comprobación visual en iPad: el navegador de pruebas no pudo instalarse en este entorno. Probar vertical y horizontal; el cambio CSS está compilado, pero no se afirma una validación visual que no se realizó.

Si necesitás revertir la aplicación, podés volver al despliegue anterior. La columna nueva es opcional y compatible con el código anterior.
