# Fragmentados en Google

## Publicar esta actualización

Incorporar el pull request a `main` y esperar `Ready` en Vercel. No hay SQL ni dependencias nuevas. Descargar luego el código en la PC con `git pull`.

La actualización elimina el `noindex` general de la demo en producción. Agrega URLs canónicas bajo `https://www.fragmentados.org`, `robots.txt`, un sitemap que se refresca cada 60 segundos y datos estructurados `NewsArticle`. Las notas incluyen título, descripción, imagen, firma y fechas reales. No cambia el diseño.

El panel, las vistas previas, la búsqueda interna y las piezas marcadas `es_demo` mantienen `noindex`. Los borradores y las notas futuras siguen protegidos por los filtros públicos y RLS. Los despliegues Preview y el modo demo no se habilitan para indexar.

Las noticias creadas como contenido real y publicadas entran automáticamente al sitemap. Las piezas originales del kit marcadas como muestra no entran: publicar una noticia nueva real desde el panel. No se modifican los datos existentes ni se convierte contenido de muestra en noticia real.

## Alta en Search Console (una vez)

1. Abrir https://search.google.com/search-console con la cuenta de Google que administrará el medio.
2. Agregar una propiedad de tipo **Dominio**: `fragmentados.org` (sin https ni www).
3. Copiar el registro **TXT** que entrega Google. En el proveedor DNS del dominio, agregar ese TXT al dominio raíz usando exactamente el valor de Google. Si los DNS los administra Vercel, hacerlo en la configuración DNS del dominio allí. Conservar los registros existentes.
4. Volver a Search Console y pulsar **Verificar**. Si todavía no lo encuentra, esperar la propagación y reintentar; conservar el TXT después de verificar.
5. En **Sitemaps**, enviar `https://www.fragmentados.org/sitemap.xml`.
6. En **Inspección de URLs**, pegar la URL completa de una noticia real publicada. Probar la URL publicada y solicitar indexación.

Antes del envío, abrir `/robots.txt` y `/sitemap.xml` en el dominio de producción. El primero debe permitir `/` y anunciar el sitemap. El segundo debe contener las URLs públicas reales. La portada y cada nota real deben carecer de `noindex`.

## Publicación habitual

Escribir títulos descriptivos del hecho, una bajada útil y contenido propio, con firma, fuentes y fotos pertinentes. Mantener un slug estable para no romper enlaces. Publicar desde el panel; no hace falta recompilar ni enviar individualmente todas las notas. Search Console permite revisar cuáles se indexaron y detectar errores.

El sitemap ayuda a descubrir páginas y el marcado ayuda a interpretarlas: no garantizan indexación, posición ni aparición en Google News. Google puede tardar días o semanas en rastrear. No es necesario comprar anuncios.

## Validación técnica

19 pruebas automatizadas con API/sesión simuladas, incluidas 5 de SEO; TypeScript y compilación con contenido demo. Se comprueba paginación de más de 500 piezas, filtros públicos, exclusión de muestras, canónicos y escape del JSON-LD. No se ha verificado la propiedad en Search Console ni enviado su sitemap desde este entorno.

El sitemap admite hasta 50.000 URLs; al superar ese volumen habrá que dividirlo en varios archivos. Los errores de Supabase no se convierten en un sitemap vacío exitoso.

Referencias oficiales:
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/structured-data/article
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://support.google.com/webmasters/answer/9008080
