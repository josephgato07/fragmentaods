/**
 * Modelo de contenidos de FRAGMENTADOS.
 * Estos tipos son el contrato entre la capa de datos y los componentes.
 * Las filas de Supabase se convierten a estas formas en `mappers.ts`.
 */

/** Slug de una categoría (tabla `categorias`). */
export type SectionSlug = string;

export interface Section {
  slug: SectionSlug;
  name: string;
}

/** Fragmento de texto en línea: texto plano, énfasis (subrayado negro) o enlace interno/externo. */
export type Inline =
  | string
  | { type: "enfasis"; text: string }
  | { type: "enlace"; text: string; href: string };

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Crédito fotográfico. `null` mientras no esté cargado. */
  credit: string | null;
  caption?: string;
  /** Punto focal para el recorte (CSS object-position), p. ej. "50% 35%". */
  focal?: string;
  /** "contain" para gráficos o imágenes que no se pueden recortar. */
  fit?: "cover" | "contain";
}

export interface Source {
  label: string;
  url?: string;
}

export type ArticleBlock =
  | { type: "parrafo"; content: Inline[] }
  | { type: "imagen"; image: ImageAsset }
  | { type: "pendiente"; note: string };

export interface Article {
  kind: "articulo";
  slug: string;
  section: SectionSlug;
  /** Texto de la etiqueta verde (en el kit puede diferir de la sección, p. ej. "Viáticos"). */
  label: string;
  title: string;
  deck: string | null;
  author: string;
  place: string;
  /** ISO 8601 con zona horaria. */
  publishedAt: string;
  image: ImageAsset;
  body: ArticleBlock[];
  sources: Source[];
  isDemo: boolean;
}

export interface Fragment {
  kind: "fragmento";
  slug: string;
  section: SectionSlug;
  keyword: string;
  /** Párrafos del fragmento. */
  body: Inline[][];
  place: string;
  publishedAt: string;
  sources: Source[];
  /** Imagen opcional del fragmento. */
  image: ImageAsset | null;
  /** Nota completa relacionada, si existe y es pública. */
  articleSlug: string | null;
  isDemo: boolean;
}

export type Highlight =
  | {
      type: "cifra";
      id: string;
      value: string;
      text: string;
      source: Source | null;
    }
  | {
      type: "cita";
      id: string;
      quote: string;
      attribution: string | null;
      image: ImageAsset | null;
    }
  | {
      type: "foto";
      id: string;
      image: ImageAsset;
      title: string;
      accent: string | null;
      caption: string | null;
    };

export interface HomePage {
  /** `null` solo si todavía no hay ninguna nota publicada. */
  lead: Article | null;
  secondary: Article[];
  latestFragments: Fragment[];
  modules: SectionModuleData[];
  highlights: Highlight[];
}

export interface SectionModuleData {
  section: Section;
  lead: Article | null;
  items: Array<Article | Fragment>;
}

export interface SearchResults {
  query: string;
  articles: Article[];
  fragments: Fragment[];
}
