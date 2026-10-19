/**
 * DATOS DE MUESTRA — DEMO
 *
 * Todo el contenido periodístico de este archivo proviene textualmente del
 * "kit editables.pdf" (titulares, textos, cifras, cita y fotos).
 * No se agregaron hechos, citas, fuentes ni cifras.
 *
 * Lo que SÍ es de relleno y debe reemplazarse:
 *  - Fechas y horas exactas (el kit solo indica "octubre 2026").
 *  - Asignación de cada pieza a una sección del portal.
 *  - Firma "Redacción FRAGMENTADOS" (el kit no indica autores).
 *  - Créditos fotográficos: quedan en `null` hasta tener los reales.
 *
 * Este archivo se reemplazará por consultas a Supabase.
 */
import type { Article, Fragment, Highlight, ImageAsset, Section } from "./types";

const AUTOR_DEMO = "Redacción FRAGMENTADOS";

export const sections: Section[] = [
  { slug: "politica", name: "Política" },
  { slug: "economia", name: "Economía" },
  { slug: "vivienda", name: "Vivienda" },
  { slug: "transporte", name: "Transporte" },
];

/* ——— Imágenes del kit (public/demo) ——— */
const img = {
  pobrezaPortada: {
    src: "/demo/pobreza-portada.jpg",
    alt: "Hombre de traje con un micrófono en la mano y el puño en alto, sobre un fondo con rayas de la bandera uruguaya",
    width: 1280,
    height: 1280,
    credit: null,
    focal: "50% 38%",
  },
  pobrezaGrafico: {
    src: "/demo/pobreza-grafico.jpg",
    alt: "Gráficos de barras: pobreza por semestre en personas (%) de 2019 a 2026 y variación entre primeros semestres. Fuente: estimación MEF en base a ECH",
    width: 735,
    height: 377,
    credit: null,
    fit: "contain",
  },
  viaticos: {
    src: "/demo/viaticos-senado.jpg",
    alt: "Hombre con barba responde a periodistas que le acercan micrófonos de radio y televisión",
    width: 874,
    height: 492,
    credit: null,
    focal: "55% 32%",
  },
  viviendaInau: {
    src: "/demo/vivienda-inau.jpg",
    alt: "Grupo de personas conversando en una reunión dentro de una oficina",
    width: 1600,
    height: 1067,
    credit: null,
    focal: "62% 35%",
  },
  viviendaMinisterio: {
    src: "/demo/vivienda-ministerio.jpg",
    alt: "Mesa de conferencia de prensa con cinco personas frente a carteles del Ministerio de Vivienda y Ordenamiento Territorial",
    width: 1600,
    height: 1067,
    credit: null,
    focal: "50% 72%",
  },
  puente: {
    src: "/demo/puente-rio-negro.jpg",
    alt: "Vista aérea del puente ferroviario sobre el río Negro rodeado de campo",
    width: 945,
    height: 461,
    credit: null,
    focal: "50% 72%",
  },
  convenio: {
    src: "/demo/transporte-convenio.jpg",
    alt: "Firma de un convenio en una mesa frente a carteles del Ministerio de Transporte y Obras Públicas y de la Corporación Ferroviaria del Uruguay",
    width: 1600,
    height: 1067,
    credit: null,
    focal: "50% 52%",
  },
  cita: {
    src: "/demo/cita-gobierno.jpg",
    alt: "Mujer sonriente con un micrófono, sentada frente a un fondo azul",
    width: 900,
    height: 600,
    credit: null,
    focal: "38% 38%",
  },
  infancia: {
    src: "/demo/infancia-impacto.jpg",
    alt: "Dos niños sentados en la puerta de una casa de barro, con una gallina en primer plano",
    width: 1248,
    height: 832,
    credit: null,
    focal: "57% 55%",
  },
} satisfies Record<string, ImageAsset>;

/* ——— Notas completas ——— */
export const articles: Article[] = [
  {
    kind: "articulo",
    slug: "la-pobreza-bajo-al-14-8-y-la-indigencia-al-1-2",
    section: "economia",
    label: "Economía",
    title:
      "La pobreza bajó al 14,8% y la indigencia al 1,2%: 95.000 personas salieron de la línea de la pobreza en el primer semestre de 2026",
    deck: null,
    author: AUTOR_DEMO,
    place: "Uruguay",
    publishedAt: "2026-10-09T09:00:00-03:00",
    image: img.pobrezaPortada,
    body: [
      { type: "imagen", image: img.pobrezaGrafico },
      {
        type: "pendiente",
        note: "El kit solo incluye el titular, la foto y el gráfico de esta nota. El texto completo se cargará desde el panel editorial.",
      },
    ],
    sources: [{ label: "Estimación MEF en base a ECH (según el gráfico del kit)" }],
    isDemo: true,
  },
  {
    kind: "articulo",
    slug: "con-votos-del-fa-se-aprobo-la-obligacion-de-rendir-viaticos-publicos",
    section: "politica",
    label: "Viáticos",
    title: "Con votos del FA se aprobó la obligación de rendir viáticos públicos",
    deck: "La iniciativa alcanza a senadores, diputados y cargos políticos y de particular confianza de los gobiernos departamentales y municipales.",
    author: AUTOR_DEMO,
    place: "Uruguay",
    publishedAt: "2026-10-09T11:30:00-03:00",
    image: img.viaticos,
    body: [
      {
        type: "parrafo",
        content: [
          "La Comisión de Hacienda del Senado aprobó con los votos del Frente Amplio el proyecto impulsado por el senador del MPP Daniel Caggiani para ampliar la obligación de rendir y devolver los excedentes de viáticos.",
        ],
      },
      {
        type: "parrafo",
        content: [
          "Uno de los principales cambios es que quienes queden comprendidos por el nuevo régimen tendrán un plazo de diez días hábiles desde su regreso para presentar la rendición correspondiente.",
        ],
      },
      {
        type: "parrafo",
        content: [
          "Deberán declarar los conceptos en los que utilizaron el dinero recibido y el cumplimiento de las tareas que motivaron la misión. La declaración de gastos tendrá carácter de declaración jurada.",
        ],
      },
      {
        type: "parrafo",
        content: [
          "Si luego de realizar el viaje queda dinero sin utilizar, el excedente deberá ser devuelto a la oficina correspondiente.",
        ],
      },
    ],
    sources: [],
    isDemo: true,
  },
  {
    kind: "articulo",
    slug: "vivienda-subsidiara-alquileres-familias-vinculadas-al-inau",
    section: "vivienda",
    label: "Vivienda",
    title: "Vivienda subsidiará alquileres para acompañar integración de familias vinculadas al INAU",
    deck: null,
    author: AUTOR_DEMO,
    place: "Montevideo",
    publishedAt: "2026-10-08T12:00:00-03:00",
    image: img.viviendaInau,
    body: [
      { type: "imagen", image: img.viviendaMinisterio },
      {
        type: "pendiente",
        note: "El kit solo incluye el titular y las fotos de esta nota. El texto completo se cargará desde el panel editorial.",
      },
    ],
    sources: [],
    isDemo: true,
  },
  {
    kind: "articulo",
    slug: "comienza-recuperacion-de-puente-ferroviario-sobre-el-rio-negro",
    section: "transporte",
    label: "Transporte",
    title: "Comienza recuperación de puente ferroviario sobre el río Negro para unir Rivera con el puerto de Montevideo",
    deck: "La firma de un convenio entre la Corporación Ferroviaria del Uruguay y la Corporación Nacional para el Desarrollo permitirá recuperar el puente ferroviario sobre el río Negro y facilitar así el traslado de carga entre el puerto de Montevideo y Rivera.",
    author: AUTOR_DEMO,
    place: "Paso de los Toros",
    publishedAt: "2026-10-07T16:00:00-03:00",
    image: img.puente,
    body: [
      {
        type: "parrafo",
        content: [
          "Las obras serán realizadas por una cooperativa, requerirán una inversión de casi dos millones de dólares y se extenderán durante unos 10 meses.",
        ],
      },
      { type: "imagen", image: img.convenio },
    ],
    sources: [],
    isDemo: true,
  },
  {
    kind: "articulo",
    slug: "los-datos-del-ine-sobre-la-pobreza-por-franja-etaria",
    section: "economia",
    label: "Economía",
    title: "Los datos del INE sobre la pobreza en Uruguay, detallados por franja etaria",
    deck: null,
    author: AUTOR_DEMO,
    place: "Montevideo",
    publishedAt: "2026-10-08T18:00:00-03:00",
    image: img.pobrezaGrafico,
    body: [
      {
        type: "pendiente",
        note: "El kit solo incluye el titular y el gráfico de esta nota. El texto completo se cargará desde el panel editorial.",
      },
    ],
    sources: [{ label: "Estimación MEF en base a ECH (según el gráfico del kit)" }],
    isDemo: true,
  },
];

/* ——— Fragmentos ——— */
export const fragments: Fragment[] = [
  {
    kind: "fragmento",
    slug: "gandini",
    section: "politica",
    keyword: "Gandini",
    body: [
      [
        "El dirigente nacionalista y director de la Administración Nacional de Puertos, Jorge Gandini, fue denunciado ante JUTEP por ",
        { type: "enfasis", text: "NO haber declarado una inversión de su esposa en Conexión Ganadera" },
        ", por 67 mil dólares, en su última declaración jurada de bienes.",
      ],
      [
        "Se trata de un bien ganancial, por lo que debía figurar en la declaración que los cargos públicos están obligados a presentar ante el organismo.",
      ],
      [
        "Gandini y su esposa pusieron 67 mil dólares y ",
        { type: "enfasis", text: "ya cobraron un porcentaje como damnificados" },
        ".",
      ],
    ],
    place: "Uruguay",
    publishedAt: "2026-10-09T14:32:00-03:00",
    sources: [],
    image: null,
    articleSlug: null,
    isDemo: true,
  },
  {
    kind: "fragmento",
    slug: "penitencia",
    section: "politica",
    keyword: "Penitencia",
    body: [
      [
        "La resolución se adoptó tras conocerse que dentro del equipo del edil figuraba contratado Pablo Leiva, ",
        {
          type: "enfasis",
          text: "una persona recientemente condenada por lavado de activos y tráfico de municiones",
        },
        " en el marco de la Operación Trazador.",
      ],
      [
        "Leiva percibía un haber mensual de $ 52.000 nominales desde diciembre ",
        { type: "enfasis", text: "sin realizar funciones asignadas" },
        ', hecho que el propio edil reconoció públicamente como un "error" de control y confianza.',
      ],
    ],
    place: "Uruguay",
    publishedAt: "2026-10-09T13:10:00-03:00",
    sources: [],
    image: null,
    articleSlug: null,
    isDemo: true,
  },
  {
    kind: "fragmento",
    slug: "el-dato-plazo-para-rendir-viaticos",
    section: "politica",
    keyword: "El dato",
    body: [
      [
        "Uno de los principales cambios es que quienes queden comprendidos por el nuevo régimen ",
        {
          type: "enfasis",
          text: "tendrán un plazo de diez días hábiles desde su regreso para presentar la rendición correspondiente",
        },
        ".",
      ],
      [
        "Deberán declarar los conceptos en los que utilizaron el dinero recibido y el cumplimiento de las tareas que motivaron la misión. La declaración de gastos tendrá carácter de declaración jurada.",
      ],
      [
        "Si luego de realizar el viaje queda dinero sin utilizar, el excedente deberá ser devuelto a la oficina correspondiente.",
      ],
    ],
    place: "Uruguay",
    publishedAt: "2026-10-09T12:05:00-03:00",
    sources: [],
    image: null,
    articleSlug: "con-votos-del-fa-se-aprobo-la-obligacion-de-rendir-viaticos-publicos",
    isDemo: true,
  },
  {
    kind: "fragmento",
    slug: "el-dato-ampliacion-de-rendicion-de-viaticos",
    section: "politica",
    keyword: "El dato",
    body: [
      [
        "La Comisión de Hacienda del Senado aprobó con los votos del Frente Amplio el proyecto impulsado por el senador del MPP Daniel Caggiani ",
        { type: "enfasis", text: "para ampliar la obligación de rendir y devolver los excedentes de viáticos" },
        ".",
      ],
      [
        "La iniciativa alcanza a senadores, diputados y cargos políticos y de particular confianza de los gobiernos departamentales y municipales.",
      ],
    ],
    place: "Uruguay",
    publishedAt: "2026-10-09T12:00:00-03:00",
    sources: [],
    image: null,
    articleSlug: "con-votos-del-fa-se-aprobo-la-obligacion-de-rendir-viaticos-publicos",
    isDemo: true,
  },
  {
    kind: "fragmento",
    slug: "besozzi",
    section: "politica",
    keyword: "Besozzi",
    body: [
      [
        "La Intendencia de Soriano, encabezada por Guillermo Besozzi, obtuvo la autorización de la Junta Departamental para otorgar ",
        { type: "enfasis", text: "durante 15 años" },
        " una vivienda del Complejo Habitacional de Palmar al cantante Matías Valdez.",
      ],
      [
        "El comodato fue aprobado por la junta departamental con los votos del Partido Nacional y el Partido Colorado. ",
        { type: "enfasis", text: "El Frente Amplio votó en contra." },
      ],
    ],
    place: "Soriano",
    publishedAt: "2026-10-09T11:45:00-03:00",
    sources: [],
    image: null,
    articleSlug: null,
    isDemo: true,
  },
  {
    kind: "fragmento",
    slug: "irregular",
    section: "politica",
    keyword: "Irregular",
    body: [
      [
        "Tras constatar el incumplimiento de los requisitos legales, el Instituto Nacional de Colonización resolvió la rescisión del contrato. Antía promovió un recurso judicial ante el Tribunal de lo Contencioso Administrativo para revertir la decisión, ",
        { type: "enfasis", text: "pero el órgano de contralor falló en su contra" },
        ", ratificando la obligación ",
        {
          type: "enfasis",
          text: "de restituir al Estado las 106 hectáreas ubicadas en el departamento de Maldonado",
        },
        ".",
      ],
    ],
    place: "Maldonado",
    publishedAt: "2026-10-09T10:02:00-03:00",
    sources: [],
    image: null,
    articleSlug: null,
    isDemo: true,
  },
  {
    kind: "fragmento",
    slug: "conexion-norte-sur",
    section: "transporte",
    keyword: "Conexión norte-sur",
    body: [
      [
        "La firma de un convenio entre la Corporación Ferroviaria del Uruguay y la Corporación Nacional para el Desarrollo permitirá recuperar el puente ferroviario sobre el río Negro y ",
        { type: "enfasis", text: "facilitar así el traslado de carga entre el puerto de Montevideo y Rivera" },
        ".",
      ],
      [
        "Las obras serán realizadas por una cooperativa, requerirán una inversión de casi ",
        { type: "enfasis", text: "dos millones de dólares" },
        " y se extenderán durante unos 10 meses.",
      ],
    ],
    place: "Paso de los Toros",
    publishedAt: "2026-10-07T16:30:00-03:00",
    sources: [],
    image: null,
    articleSlug: "comienza-recuperacion-de-puente-ferroviario-sobre-el-rio-negro",
    isDemo: true,
  },
];

/* ——— Destacados de portada ——— */
export const highlights: Highlight[] = [
  {
    type: "cifra",
    id: "cifra-57",
    value: "57%",
    text: "De los votantes del Partido Nacional también está de acuerdo",
    source: null,
  },
  {
    type: "cita",
    id: "cita-verdad-memoria-justicia",
    quote:
      "Hay una voluntad de este Gobierno de cumplir, porque está comprometido con la búsqueda de la verdad, la memoria y la justicia",
    attribution: null,
    image: img.cita,
  },
  {
    type: "foto",
    id: "foto-transferencias",
    image: img.infancia,
    title: "Más plata.",
    accent: "Para los que menos tienen",
    caption:
      "El 64% de los uruguayos apoya aumentar las transferencias económicas a los hogares de menores ingresos con niños pequeños.",
  },
];

/* ——— Orden editorial de portada ——— */
export const homeLayout = {
  leadSlug: "la-pobreza-bajo-al-14-8-y-la-indigencia-al-1-2",
  secondarySlugs: [
    "con-votos-del-fa-se-aprobo-la-obligacion-de-rendir-viaticos-publicos",
    "vivienda-subsidiara-alquileres-familias-vinculadas-al-inau",
    "comienza-recuperacion-de-puente-ferroviario-sobre-el-rio-negro",
  ],
  moduleSections: ["politica", "economia", "transporte", "vivienda"] as const,
};
