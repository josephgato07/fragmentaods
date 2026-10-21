/**
 * Conversión de filas de Supabase a los tipos que usan los componentes.
 * La base ya valida el cuerpo (migración 1); aquí se vuelve a filtrar como
 * segunda barrera: cualquier pieza que no cumpla el formato se descarta en
 * lugar de mostrarse. Nunca se interpreta HTML.
 */
import { publicImageUrl } from "@/lib/supabase/config";
import type { Article, ArticleBlock, Fragment, Highlight, ImageAsset, Inline, Section, Source } from "./types";

/* ——— Filas tal como las devuelve la API ——— */

export interface CategoriaRow {
  slug: string;
  nombre: string;
}

interface ImagenCols {
  imagen_ruta: string | null;
  imagen_alt: string | null;
  imagen_credito: string | null;
  imagen_ancho: number | null;
  imagen_alto: number | null;
  imagen_foco: string | null;
  imagen_ajuste: string | null;
}

export interface NotaRow extends ImagenCols {
  id: string;
  slug: string;
  titulo: string;
  bajada: string | null;
  etiqueta: string | null;
  cuerpo: unknown;
  lugar: string;
  firma: string;
  fuentes: unknown;
  imagen_pie: string | null;
  publicado_en: string;
  actualizado_en?: string;
  es_demo: boolean;
  categoria: CategoriaRow | null;
}

export interface FragmentoRow extends ImagenCols {
  id: string;
  slug: string;
  palabra_clave: string;
  cuerpo: unknown;
  lugar: string;
  fuentes: unknown;
  imagen_pie: string | null;
  publicado_en: string;
  actualizado_en?: string;
  es_demo: boolean;
  categoria: CategoriaRow | null;
  nota: { slug: string } | null;
}

export interface DestacadoRow extends ImagenCols {
  nota?: { slug: string; estado: string; publicado_en: string | null } | null;
  id: string;
  tipo: "cifra" | "cita" | "foto";
  valor: string | null;
  texto: string | null;
  cita: string | null;
  atribucion: string | null;
  titulo: string | null;
  acento: string | null;
  fuentes: unknown;
}

/* ——— Columnas que se piden (anon solo tiene permiso sobre estas) ——— */

const IMAGEN = "imagen_ruta, imagen_alt, imagen_credito, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste";

export const NOTA_COLUMNS =
  `id, slug, titulo, bajada, etiqueta, cuerpo, lugar, firma, fuentes, ${IMAGEN}, imagen_pie, publicado_en, actualizado_en, es_demo, ` +
  "categoria:categorias!inner(slug, nombre)";

export const FRAGMENTO_COLUMNS =
  `id, slug, palabra_clave, cuerpo, lugar, fuentes, ${IMAGEN}, imagen_pie, publicado_en, actualizado_en, es_demo, ` +
  "categoria:categorias!inner(slug, nombre), nota:notas(slug)";

export const DESTACADO_COLUMNS = `id, tipo, valor, texto, cita, atribucion, titulo, acento, fuentes, ${IMAGEN}, nota:notas(slug, estado, publicado_en)`;

/* ——— Validación defensiva del contenido estructurado ——— */

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown, max: number): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max;

const SAFE_HREF = /^(\/(?!\/)[^\s<>"'`\\]*|https:\/\/[^\s<>"'`\\]+)$/;

function parseInline(item: unknown): Inline | null {
  if (typeof item === "string") return item.length > 0 ? item : null;
  if (!isObject(item)) return null;
  if (item.type === "enfasis" && isText(item.text, 240)) return { type: "enfasis", text: item.text };
  if (item.type === "enlace" && isText(item.text, 300) && typeof item.href === "string" && SAFE_HREF.test(item.href)) {
    return { type: "enlace", text: item.text, href: item.href };
  }
  return null;
}

export function parseParagraph(value: unknown): Inline[] | null {
  if (!Array.isArray(value)) return null;
  const parts = value.map(parseInline).filter((p): p is Inline => p !== null);
  return parts.length > 0 ? parts : null;
}

function parseImageJson(value: unknown): ImageAsset | null {
  if (!isObject(value) || typeof value.ruta !== "string" || !isText(value.alt, 400)) return null;
  const width = Number(value.ancho);
  const height = Number(value.alto);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) return null;
  return {
    src: publicImageUrl(value.ruta),
    alt: value.alt,
    width,
    height,
    credit: isText(value.credito, 200) ? value.credito : null,
    caption: isText(value.pie, 500) ? value.pie : undefined,
    focal: typeof value.foco === "string" ? value.foco : undefined,
    fit: value.ajuste === "contain" ? "contain" : "cover",
  };
}

function parseArticleBody(value: unknown): ArticleBlock[] {
  if (!Array.isArray(value)) return [];
  const blocks: ArticleBlock[] = [];
  for (const block of value) {
    if (!isObject(block)) continue;
    if (block.type === "parrafo") {
      const content = parseParagraph(block.content);
      if (content) blocks.push({ type: "parrafo", content });
    } else if (block.type === "imagen") {
      const image = parseImageJson(block.imagen);
      if (image) blocks.push({ type: "imagen", image });
    } else if (block.type === "pendiente" && isText(block.note, 600)) {
      blocks.push({ type: "pendiente", note: block.note });
    }
  }
  return blocks;
}

function parseFragmentBody(value: unknown): Inline[][] {
  if (!Array.isArray(value)) return [];
  return value.map(parseParagraph).filter((p): p is Inline[] => p !== null);
}

function parseSources(value: unknown): Source[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((s) => {
    if (!isObject(s) || !isText(s.label, 300)) return [];
    const url = typeof s.url === "string" && /^https:\/\/[^\s<>"'`\\]+$/.test(s.url) ? s.url : undefined;
    return [url ? { label: s.label, url } : { label: s.label }];
  });
}

function imageFromColumns(row: ImagenCols & { imagen_pie?: string | null }): ImageAsset | null {
  if (!row.imagen_ruta || !row.imagen_alt || !row.imagen_ancho || !row.imagen_alto) return null;
  return {
    src: publicImageUrl(row.imagen_ruta),
    alt: row.imagen_alt,
    width: row.imagen_ancho,
    height: row.imagen_alto,
    credit: row.imagen_credito,
    caption: row.imagen_pie ?? undefined,
    focal: row.imagen_foco ?? undefined,
    fit: row.imagen_ajuste === "contain" ? "contain" : "cover",
  };
}

/* ——— Conversores públicos ——— */

export const toSection = (row: CategoriaRow): Section => ({ slug: row.slug, name: row.nombre });

/** Devuelve null si la fila no cumple lo mínimo para mostrarse (p. ej. sin imagen). */
export function toArticle(row: NotaRow): Article | null {
  const image = imageFromColumns(row);
  if (!image || !row.categoria) return null;
  return {
    kind: "articulo",
    slug: row.slug,
    section: row.categoria.slug,
    label: row.etiqueta ?? row.categoria.nombre,
    title: row.titulo,
    deck: row.bajada,
    author: row.firma,
    place: row.lugar,
    publishedAt: row.publicado_en,
    updatedAt: row.actualizado_en,
    image,
    body: parseArticleBody(row.cuerpo),
    sources: parseSources(row.fuentes),
    isDemo: row.es_demo,
  };
}

export function toFragment(row: FragmentoRow): Fragment | null {
  const body = parseFragmentBody(row.cuerpo);
  if (body.length === 0 || !row.categoria) return null;
  return {
    kind: "fragmento",
    slug: row.slug,
    section: row.categoria.slug,
    keyword: row.palabra_clave,
    body,
    place: row.lugar,
    publishedAt: row.publicado_en,
    updatedAt: row.actualizado_en,
    sources: parseSources(row.fuentes),
    image: imageFromColumns(row),
    articleSlug: row.nota?.slug ?? null,
    isDemo: row.es_demo,
  };
}

export function toHighlight(row: DestacadoRow): Highlight | null {
  const image = imageFromColumns(row);
  const articleSlug = row.nota?.estado === "publicado" && row.nota.publicado_en && new Date(row.nota.publicado_en) <= new Date() ? row.nota.slug : null;
  if (row.tipo === "cifra" && row.valor && row.texto) {
    return { type: "cifra", articleSlug, id: row.id, value: row.valor, text: row.texto, source: parseSources(row.fuentes)[0] ?? null };
  }
  if (row.tipo === "cita" && row.cita) {
    return { type: "cita", articleSlug, id: row.id, quote: row.cita, attribution: row.atribucion, image };
  }
  if (row.tipo === "foto" && image && row.titulo) {
    return { type: "foto", articleSlug, id: row.id, image, title: row.titulo, accent: row.acento, caption: row.texto };
  }
  return null;
}

export const notNull = <T,>(v: T | null): v is T => v !== null;
