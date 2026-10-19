-- =============================================================================
-- FRAGMENTADOS · Datos de muestra del kit (OPCIONAL)
-- =============================================================================
-- Generado por scripts/generar-seed-demo.mts desde src/lib/content/demo-data.ts.
-- Carga categorías, notas, fragmentos, destacados y portada de la demo.
-- Todo queda marcado con es_demo = true para poder identificarlo después.
-- No borra ni modifica nada existente: si un slug ya existe, lo deja como está.
-- Ejecutar DESPUÉS de las tres migraciones.
-- =============================================================================

begin;

insert into public.categorias (slug, nombre, orden, en_portada) values
  ('politica', 'Política', 1, true),
  ('economia', 'Economía', 2, true),
  ('vivienda', 'Vivienda', 3, true),
  ('transporte', 'Transporte', 4, true)
on conflict (slug) do nothing;

insert into public.notas (slug, titulo, bajada, etiqueta, cuerpo, lugar, categoria_id, firma, fuentes,
  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste,
  estado, publicado_en, es_demo)
select 'la-pobreza-bajo-al-14-8-y-la-indigencia-al-1-2',
  'La pobreza bajó al 14,8% y la indigencia al 1,2%: 95.000 personas salieron de la línea de la pobreza en el primer semestre de 2026',
  null,
  null,
  '[{"type":"imagen","imagen":{"ruta":"/demo/pobreza-grafico.jpg","alt":"Gráficos de barras: pobreza por semestre en personas (%) de 2019 a 2026 y variación entre primeros semestres. Fuente: estimación MEF en base a ECH","ancho":735,"alto":377,"ajuste":"contain"}},{"type":"pendiente","note":"El kit solo incluye el titular, la foto y el gráfico de esta nota. El texto completo se cargará desde el panel editorial."}]'::jsonb,
  'Uruguay',
  c.id,
  'Redacción FRAGMENTADOS',
  '[{"label":"Estimación MEF en base a ECH (según el gráfico del kit)"}]'::jsonb,
  '/demo/pobreza-portada.jpg',
  'Hombre de traje con un micrófono en la mano y el puño en alto, sobre un fondo con rayas de la bandera uruguaya',
  null,
  1280,
  1280,
  '50% 38%',
  'cover',
  'publicado',
  '2026-10-09T09:00:00-03:00',
  true
from public.categorias c where c.slug = 'economia'
on conflict (slug) do nothing;

insert into public.notas (slug, titulo, bajada, etiqueta, cuerpo, lugar, categoria_id, firma, fuentes,
  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste,
  estado, publicado_en, es_demo)
select 'con-votos-del-fa-se-aprobo-la-obligacion-de-rendir-viaticos-publicos',
  'Con votos del FA se aprobó la obligación de rendir viáticos públicos',
  'La iniciativa alcanza a senadores, diputados y cargos políticos y de particular confianza de los gobiernos departamentales y municipales.',
  'Viáticos',
  '[{"type":"parrafo","content":["La Comisión de Hacienda del Senado aprobó con los votos del Frente Amplio el proyecto impulsado por el senador del MPP Daniel Caggiani para ampliar la obligación de rendir y devolver los excedentes de viáticos."]},{"type":"parrafo","content":["Uno de los principales cambios es que quienes queden comprendidos por el nuevo régimen tendrán un plazo de diez días hábiles desde su regreso para presentar la rendición correspondiente."]},{"type":"parrafo","content":["Deberán declarar los conceptos en los que utilizaron el dinero recibido y el cumplimiento de las tareas que motivaron la misión. La declaración de gastos tendrá carácter de declaración jurada."]},{"type":"parrafo","content":["Si luego de realizar el viaje queda dinero sin utilizar, el excedente deberá ser devuelto a la oficina correspondiente."]}]'::jsonb,
  'Uruguay',
  c.id,
  'Redacción FRAGMENTADOS',
  '[]'::jsonb,
  '/demo/viaticos-senado.jpg',
  'Hombre con barba responde a periodistas que le acercan micrófonos de radio y televisión',
  null,
  874,
  492,
  '55% 32%',
  'cover',
  'publicado',
  '2026-10-09T11:30:00-03:00',
  true
from public.categorias c where c.slug = 'politica'
on conflict (slug) do nothing;

insert into public.notas (slug, titulo, bajada, etiqueta, cuerpo, lugar, categoria_id, firma, fuentes,
  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste,
  estado, publicado_en, es_demo)
select 'vivienda-subsidiara-alquileres-familias-vinculadas-al-inau',
  'Vivienda subsidiará alquileres para acompañar integración de familias vinculadas al INAU',
  null,
  null,
  '[{"type":"imagen","imagen":{"ruta":"/demo/vivienda-ministerio.jpg","alt":"Mesa de conferencia de prensa con cinco personas frente a carteles del Ministerio de Vivienda y Ordenamiento Territorial","ancho":1600,"alto":1067,"foco":"50% 72%"}},{"type":"pendiente","note":"El kit solo incluye el titular y las fotos de esta nota. El texto completo se cargará desde el panel editorial."}]'::jsonb,
  'Montevideo',
  c.id,
  'Redacción FRAGMENTADOS',
  '[]'::jsonb,
  '/demo/vivienda-inau.jpg',
  'Grupo de personas conversando en una reunión dentro de una oficina',
  null,
  1600,
  1067,
  '62% 35%',
  'cover',
  'publicado',
  '2026-10-08T12:00:00-03:00',
  true
from public.categorias c where c.slug = 'vivienda'
on conflict (slug) do nothing;

insert into public.notas (slug, titulo, bajada, etiqueta, cuerpo, lugar, categoria_id, firma, fuentes,
  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste,
  estado, publicado_en, es_demo)
select 'comienza-recuperacion-de-puente-ferroviario-sobre-el-rio-negro',
  'Comienza recuperación de puente ferroviario sobre el río Negro para unir Rivera con el puerto de Montevideo',
  'La firma de un convenio entre la Corporación Ferroviaria del Uruguay y la Corporación Nacional para el Desarrollo permitirá recuperar el puente ferroviario sobre el río Negro y facilitar así el traslado de carga entre el puerto de Montevideo y Rivera.',
  null,
  '[{"type":"parrafo","content":["Las obras serán realizadas por una cooperativa, requerirán una inversión de casi dos millones de dólares y se extenderán durante unos 10 meses."]},{"type":"imagen","imagen":{"ruta":"/demo/transporte-convenio.jpg","alt":"Firma de un convenio en una mesa frente a carteles del Ministerio de Transporte y Obras Públicas y de la Corporación Ferroviaria del Uruguay","ancho":1600,"alto":1067,"foco":"50% 52%"}}]'::jsonb,
  'Paso de los Toros',
  c.id,
  'Redacción FRAGMENTADOS',
  '[]'::jsonb,
  '/demo/puente-rio-negro.jpg',
  'Vista aérea del puente ferroviario sobre el río Negro rodeado de campo',
  null,
  945,
  461,
  '50% 72%',
  'cover',
  'publicado',
  '2026-10-07T16:00:00-03:00',
  true
from public.categorias c where c.slug = 'transporte'
on conflict (slug) do nothing;

insert into public.notas (slug, titulo, bajada, etiqueta, cuerpo, lugar, categoria_id, firma, fuentes,
  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste,
  estado, publicado_en, es_demo)
select 'los-datos-del-ine-sobre-la-pobreza-por-franja-etaria',
  'Los datos del INE sobre la pobreza en Uruguay, detallados por franja etaria',
  null,
  null,
  '[{"type":"pendiente","note":"El kit solo incluye el titular y el gráfico de esta nota. El texto completo se cargará desde el panel editorial."}]'::jsonb,
  'Montevideo',
  c.id,
  'Redacción FRAGMENTADOS',
  '[{"label":"Estimación MEF en base a ECH (según el gráfico del kit)"}]'::jsonb,
  '/demo/pobreza-grafico.jpg',
  'Gráficos de barras: pobreza por semestre en personas (%) de 2019 a 2026 y variación entre primeros semestres. Fuente: estimación MEF en base a ECH',
  null,
  735,
  377,
  null,
  'contain',
  'publicado',
  '2026-10-08T18:00:00-03:00',
  true
from public.categorias c where c.slug = 'economia'
on conflict (slug) do nothing;

insert into public.fragmentos (slug, palabra_clave, cuerpo, lugar, categoria_id, fuentes, nota_id,
  estado, publicado_en, es_demo)
select 'gandini',
  'Gandini',
  '[["El dirigente nacionalista y director de la Administración Nacional de Puertos, Jorge Gandini, fue denunciado ante JUTEP por ",{"type":"enfasis","text":"NO haber declarado una inversión de su esposa en Conexión Ganadera"},", por 67 mil dólares, en su última declaración jurada de bienes."],["Se trata de un bien ganancial, por lo que debía figurar en la declaración que los cargos públicos están obligados a presentar ante el organismo."],["Gandini y su esposa pusieron 67 mil dólares y ",{"type":"enfasis","text":"ya cobraron un porcentaje como damnificados"},"."]]'::jsonb,
  'Uruguay',
  c.id,
  '[]'::jsonb,
  null,
  'publicado',
  '2026-10-09T14:32:00-03:00',
  true
from public.categorias c where c.slug = 'politica'
on conflict (slug) do nothing;

insert into public.fragmentos (slug, palabra_clave, cuerpo, lugar, categoria_id, fuentes, nota_id,
  estado, publicado_en, es_demo)
select 'penitencia',
  'Penitencia',
  '[["La resolución se adoptó tras conocerse que dentro del equipo del edil figuraba contratado Pablo Leiva, ",{"type":"enfasis","text":"una persona recientemente condenada por lavado de activos y tráfico de municiones"}," en el marco de la Operación Trazador."],["Leiva percibía un haber mensual de $ 52.000 nominales desde diciembre ",{"type":"enfasis","text":"sin realizar funciones asignadas"},", hecho que el propio edil reconoció públicamente como un \"error\" de control y confianza."]]'::jsonb,
  'Uruguay',
  c.id,
  '[]'::jsonb,
  null,
  'publicado',
  '2026-10-09T13:10:00-03:00',
  true
from public.categorias c where c.slug = 'politica'
on conflict (slug) do nothing;

insert into public.fragmentos (slug, palabra_clave, cuerpo, lugar, categoria_id, fuentes, nota_id,
  estado, publicado_en, es_demo)
select 'el-dato-plazo-para-rendir-viaticos',
  'El dato',
  '[["Uno de los principales cambios es que quienes queden comprendidos por el nuevo régimen ",{"type":"enfasis","text":"tendrán un plazo de diez días hábiles desde su regreso para presentar la rendición correspondiente"},"."],["Deberán declarar los conceptos en los que utilizaron el dinero recibido y el cumplimiento de las tareas que motivaron la misión. La declaración de gastos tendrá carácter de declaración jurada."],["Si luego de realizar el viaje queda dinero sin utilizar, el excedente deberá ser devuelto a la oficina correspondiente."]]'::jsonb,
  'Uruguay',
  c.id,
  '[]'::jsonb,
  (select n.id from public.notas n where n.slug = 'con-votos-del-fa-se-aprobo-la-obligacion-de-rendir-viaticos-publicos'),
  'publicado',
  '2026-10-09T12:05:00-03:00',
  true
from public.categorias c where c.slug = 'politica'
on conflict (slug) do nothing;

insert into public.fragmentos (slug, palabra_clave, cuerpo, lugar, categoria_id, fuentes, nota_id,
  estado, publicado_en, es_demo)
select 'el-dato-ampliacion-de-rendicion-de-viaticos',
  'El dato',
  '[["La Comisión de Hacienda del Senado aprobó con los votos del Frente Amplio el proyecto impulsado por el senador del MPP Daniel Caggiani ",{"type":"enfasis","text":"para ampliar la obligación de rendir y devolver los excedentes de viáticos"},"."],["La iniciativa alcanza a senadores, diputados y cargos políticos y de particular confianza de los gobiernos departamentales y municipales."]]'::jsonb,
  'Uruguay',
  c.id,
  '[]'::jsonb,
  (select n.id from public.notas n where n.slug = 'con-votos-del-fa-se-aprobo-la-obligacion-de-rendir-viaticos-publicos'),
  'publicado',
  '2026-10-09T12:00:00-03:00',
  true
from public.categorias c where c.slug = 'politica'
on conflict (slug) do nothing;

insert into public.fragmentos (slug, palabra_clave, cuerpo, lugar, categoria_id, fuentes, nota_id,
  estado, publicado_en, es_demo)
select 'besozzi',
  'Besozzi',
  '[["La Intendencia de Soriano, encabezada por Guillermo Besozzi, obtuvo la autorización de la Junta Departamental para otorgar ",{"type":"enfasis","text":"durante 15 años"}," una vivienda del Complejo Habitacional de Palmar al cantante Matías Valdez."],["El comodato fue aprobado por la junta departamental con los votos del Partido Nacional y el Partido Colorado. ",{"type":"enfasis","text":"El Frente Amplio votó en contra."}]]'::jsonb,
  'Soriano',
  c.id,
  '[]'::jsonb,
  null,
  'publicado',
  '2026-10-09T11:45:00-03:00',
  true
from public.categorias c where c.slug = 'politica'
on conflict (slug) do nothing;

insert into public.fragmentos (slug, palabra_clave, cuerpo, lugar, categoria_id, fuentes, nota_id,
  estado, publicado_en, es_demo)
select 'irregular',
  'Irregular',
  '[["Tras constatar el incumplimiento de los requisitos legales, el Instituto Nacional de Colonización resolvió la rescisión del contrato. Antía promovió un recurso judicial ante el Tribunal de lo Contencioso Administrativo para revertir la decisión, ",{"type":"enfasis","text":"pero el órgano de contralor falló en su contra"},", ratificando la obligación ",{"type":"enfasis","text":"de restituir al Estado las 106 hectáreas ubicadas en el departamento de Maldonado"},"."]]'::jsonb,
  'Maldonado',
  c.id,
  '[]'::jsonb,
  null,
  'publicado',
  '2026-10-09T10:02:00-03:00',
  true
from public.categorias c where c.slug = 'politica'
on conflict (slug) do nothing;

insert into public.fragmentos (slug, palabra_clave, cuerpo, lugar, categoria_id, fuentes, nota_id,
  estado, publicado_en, es_demo)
select 'conexion-norte-sur',
  'Conexión norte-sur',
  '[["La firma de un convenio entre la Corporación Ferroviaria del Uruguay y la Corporación Nacional para el Desarrollo permitirá recuperar el puente ferroviario sobre el río Negro y ",{"type":"enfasis","text":"facilitar así el traslado de carga entre el puerto de Montevideo y Rivera"},"."],["Las obras serán realizadas por una cooperativa, requerirán una inversión de casi ",{"type":"enfasis","text":"dos millones de dólares"}," y se extenderán durante unos 10 meses."]]'::jsonb,
  'Paso de los Toros',
  c.id,
  '[]'::jsonb,
  (select n.id from public.notas n where n.slug = 'comienza-recuperacion-de-puente-ferroviario-sobre-el-rio-negro'),
  'publicado',
  '2026-10-07T16:30:00-03:00',
  true
from public.categorias c where c.slug = 'transporte'
on conflict (slug) do nothing;

insert into public.destacados (id, tipo, valor, texto, fuentes, estado, publicado_en, es_demo)
values ('00000000-0000-4000-8000-000000000001', 'cifra', '57%', 'De los votantes del Partido Nacional también está de acuerdo', '[]'::jsonb, 'publicado', '2026-10-09T08:00:00-03:00', true)
on conflict (id) do nothing;

insert into public.destacados (id, tipo, cita, atribucion,
  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste, estado, publicado_en, es_demo)
values ('00000000-0000-4000-8000-000000000002', 'cita', 'Hay una voluntad de este Gobierno de cumplir, porque está comprometido con la búsqueda de la verdad, la memoria y la justicia', null, '/demo/cita-gobierno.jpg', 'Mujer sonriente con un micrófono, sentada frente a un fondo azul', null, 900, 600, '38% 38%', 'cover', 'publicado', '2026-10-09T08:00:00-03:00', true)
on conflict (id) do nothing;

insert into public.destacados (id, tipo, titulo, acento, texto,
  imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste, estado, publicado_en, es_demo)
values ('00000000-0000-4000-8000-000000000003', 'foto', 'Más plata.', 'Para los que menos tienen', 'El 64% de los uruguayos apoya aumentar las transferencias económicas a los hogares de menores ingresos con niños pequeños.', '/demo/infancia-impacto.jpg', 'Dos niños sentados en la puerta de una casa de barro, con una gallina en primer plano', null, 1248, 832, '57% 55%', 'cover', 'publicado', '2026-10-09T08:00:00-03:00', true)
on conflict (id) do nothing;

-- Portada: apertura, secundarias y destacados (solo si la ubicación está libre)
insert into public.ubicaciones_portada (zona, posicion, nota_id)
select 'apertura', 1, n.id from public.notas n where n.slug = 'la-pobreza-bajo-al-14-8-y-la-indigencia-al-1-2'
on conflict do nothing;
insert into public.ubicaciones_portada (zona, posicion, nota_id)
select 'secundaria', 1, n.id from public.notas n where n.slug = 'con-votos-del-fa-se-aprobo-la-obligacion-de-rendir-viaticos-publicos'
on conflict do nothing;
insert into public.ubicaciones_portada (zona, posicion, nota_id)
select 'secundaria', 2, n.id from public.notas n where n.slug = 'vivienda-subsidiara-alquileres-familias-vinculadas-al-inau'
on conflict do nothing;
insert into public.ubicaciones_portada (zona, posicion, nota_id)
select 'secundaria', 3, n.id from public.notas n where n.slug = 'comienza-recuperacion-de-puente-ferroviario-sobre-el-rio-negro'
on conflict do nothing;
insert into public.ubicaciones_portada (zona, posicion, destacado_id)
values ('destacado', 1, '00000000-0000-4000-8000-000000000001')
on conflict do nothing;
insert into public.ubicaciones_portada (zona, posicion, destacado_id)
values ('destacado', 2, '00000000-0000-4000-8000-000000000002')
on conflict do nothing;
insert into public.ubicaciones_portada (zona, posicion, destacado_id)
values ('destacado', 3, '00000000-0000-4000-8000-000000000003')
on conflict do nothing;

commit;
