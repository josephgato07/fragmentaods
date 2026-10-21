import "server-only";

/**
 * Implementación de ContentRepository sobre Supabase (lectura pública).
 *
 * Seguridad en dos capas:
 *  1. El cliente consulta como visitante anónimo: RLS solo entrega contenido
 *     publicado cuya fecha llegó, aunque se pida un slug directamente.
 *  2. Además, cada consulta filtra explícitamente estado y fecha.
 */
import type { PostgrestError } from "@supabase/supabase-js";
import { getPublicClient } from "@/lib/supabase/public";
import {
  DESTACADO_COLUMNS,
  FRAGMENTO_COLUMNS,
  NOTA_COLUMNS,
  notNull,
  toArticle,
  toFragment,
  toHighlight,
  toSection,
  type CategoriaRow,
  type DestacadoRow,
  type FragmentoRow,
  type NotaRow,
} from "./mappers";
import type { ContentRepository } from "./repository";
import { normalize } from "./search";
import type { Article, Fragment, Highlight, SectionModuleData } from "./types";

export class ContentUnavailableError extends Error {
  constructor(context: string, cause: PostgrestError) {
    super(`No se pudieron cargar los contenidos (${context}): ${cause.message}`);
    this.name = "ContentUnavailableError";
  }
}

function check<T>(context: string, result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) throw new ContentUnavailableError(context, result.error);
  return result.data as T;
}

const db = () => getPublicClient();
const now = () => new Date().toISOString();

/** Consultas base: solo publicado y con fecha cumplida, de lo más reciente a lo más antiguo. */
const publicNotas = () =>
  db().from("notas").select(NOTA_COLUMNS).eq("estado", "publicado").lte("publicado_en", now());
const publicFragmentos = () =>
  db().from("fragmentos").select(FRAGMENTO_COLUMNS).eq("estado", "publicado").lte("publicado_en", now());

const LIST_LIMIT = 100;

function articlesFrom(rows: unknown): Article[] {
  return ((rows ?? []) as NotaRow[]).map(toArticle).filter(notNull);
}
function fragmentsFrom(rows: unknown): Fragment[] {
  return ((rows ?? []) as FragmentoRow[]).map(toFragment).filter(notNull);
}

/** Escapa los comodines de LIKE para que el texto buscado sea literal. */
const likeLiteral = (term: string) => term.replace(/[\\%_]/g, (c) => `\\${c}`);

export const supabaseRepository: ContentRepository = {
  async getSitemapContent() {
    const result: Array<Article | Fragment> = [];
    const cutoff = now();
    for (const kind of ["notas", "fragmentos"] as const) {
      let after: string | undefined;
      while (true) {
        let query = db().from(kind).select(kind === "notas" ? NOTA_COLUMNS : FRAGMENTO_COLUMNS)
          .eq("estado", "publicado").lte("publicado_en", cutoff).eq("es_demo", false)
          .order("id").limit(500);
        if (after) query = query.gt("id", after);
        const rows = check("mapa del sitio", await query) as unknown as Array<NotaRow | FragmentoRow>;
        if (!rows.length) break;
        result.push(...(kind === "notas" ? articlesFrom(rows) : fragmentsFrom(rows)));
        after = rows[rows.length - 1].id;
      }
    }
    return result;
  },
  async getSections() {
    const rows = check(
      "categorías",
      await db().from("categorias").select("slug, nombre").order("orden").order("nombre"),
    );
    return (rows as CategoriaRow[]).map(toSection);
  },

  async getSection(slug) {
    const row = check("categoría", await db().from("categorias").select("slug, nombre").eq("slug", slug).maybeSingle());
    return row ? toSection(row as CategoriaRow) : null;
  },

  async getHomePage() {
    const [placementsRes, categoriasRes, recentArticlesRes, recentFragmentsRes] = await Promise.all([
      db().from("ubicaciones_portada").select("zona, posicion, nota_id, destacado_id").order("posicion"),
      db().from("categorias").select("slug, nombre").eq("en_portada", true).order("orden").order("nombre"),
      publicNotas().order("publicado_en", { ascending: false }).limit(60),
      publicFragmentos().order("publicado_en", { ascending: false }).limit(60),
    ]);
    const placements = check("portada", placementsRes) as Array<{
      zona: "apertura" | "secundaria" | "destacado";
      posicion: number;
      nota_id: string | null;
      destacado_id: string | null;
    }>;
    const categorias = check("categorías de portada", categoriasRes) as CategoriaRow[];
    const recentRows = check("notas recientes", recentArticlesRes) as unknown as NotaRow[];
    const recentFragments = fragmentsFrom(check("fragmentos recientes", recentFragmentsRes));

    // Notas ubicadas que no estén entre las recientes (p. ej. una apertura antigua)
    const known = new Map(recentRows.map((r) => [r.id, r]));
    const missingIds = placements.map((p) => p.nota_id).filter((id): id is string => !!id && !known.has(id));
    if (missingIds.length > 0) {
      const extra = check("notas de portada", await publicNotas().in("id", missingIds)) as unknown as NotaRow[];
      extra.forEach((r) => known.set(r.id, r));
    }
    const articleById = (id: string | null) => {
      const row = id ? known.get(id) : undefined;
      return row ? toArticle(row) : null;
    };
    const recentArticles = articlesFrom(recentRows);

    // Apertura: la elegida por la redacción; si no hay, la nota más reciente.
    const leadPlacement = placements.find((p) => p.zona === "apertura");
    const lead = articleById(leadPlacement?.nota_id ?? null) ?? recentArticles[0] ?? null;

    // Secundarias: las elegidas, en orden; si faltan, se completan con las más recientes.
    const secondary: Article[] = placements
      .filter((p) => p.zona === "secundaria")
      .map((p) => articleById(p.nota_id))
      .filter(notNull)
      .filter((a) => a.slug !== lead?.slug);
    for (const a of recentArticles) {
      if (secondary.length >= 3) break;
      if (a.slug !== lead?.slug && !secondary.some((s) => s.slug === a.slug)) secondary.push(a);
    }

    // Destacados, en el orden definido
    const highlightIds = placements
      .filter((p) => p.zona === "destacado" && p.destacado_id)
      .map((p) => p.destacado_id as string);
    let highlights: Highlight[] = [];
    if (highlightIds.length > 0) {
      const rows = check(
        "destacados",
        await db()
          .from("destacados")
          .select(DESTACADO_COLUMNS)
          .in("id", highlightIds)
          .eq("estado", "publicado")
          .lte("publicado_en", now()),
      ) as unknown as DestacadoRow[];
      const byId = new Map(rows.map((r) => [r.id, r]));
      highlights = highlightIds.map((id) => byId.get(id)).map((r) => (r ? toHighlight(r) : null)).filter(notNull);
    }

    // Módulos por categoría
    const modules: SectionModuleData[] = categorias
      .map((c) => {
        const section = toSection(c);
        const sectionArticles = recentArticles.filter((a) => a.section === section.slug);
        const sectionFragments = recentFragments.filter((f) => f.section === section.slug);
        const moduleLead = sectionArticles.find((a) => a.slug !== lead?.slug) ?? null;
        const items = [...sectionArticles.filter((a) => a.slug !== moduleLead?.slug), ...sectionFragments]
          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
          .slice(0, 4);
        return { section, lead: moduleLead, items };
      })
      .filter((m) => m.lead || m.items.length > 0);

    return {
      lead,
      secondary,
      latestFragments: recentFragments.slice(0, 8),
      modules,
      highlights,
    };
  },

  async getArticles() {
    return articlesFrom(
      check("notas", await publicNotas().order("publicado_en", { ascending: false }).limit(LIST_LIMIT)),
    );
  },

  async getArticle(slug) {
    const row = check("nota", await publicNotas().eq("slug", slug).maybeSingle());
    return row ? toArticle(row as NotaRow) : null;
  },

  async getArticlesBySection(section) {
    return articlesFrom(
      check(
        "notas de la sección",
        await publicNotas().eq("categoria.slug", section).order("publicado_en", { ascending: false }).limit(LIST_LIMIT),
      ),
    );
  },

  async getRelatedArticles(article, limit = 3) {
    const [sameRes, otherRes] = await Promise.all([
      publicNotas()
        .eq("categoria.slug", article.section)
        .neq("slug", article.slug)
        .order("publicado_en", { ascending: false })
        .limit(limit),
      publicNotas().neq("slug", article.slug).order("publicado_en", { ascending: false }).limit(limit * 2),
    ]);
    const same = articlesFrom(check("relacionadas", sameRes));
    const others = articlesFrom(check("relacionadas", otherRes)).filter((a) => !same.some((s) => s.slug === a.slug));
    return [...same, ...others].slice(0, limit);
  },

  async getFragments() {
    return fragmentsFrom(
      check("fragmentos", await publicFragmentos().order("publicado_en", { ascending: false }).limit(LIST_LIMIT)),
    );
  },

  async getFragment(slug) {
    const row = check("fragmento", await publicFragmentos().eq("slug", slug).maybeSingle());
    return row ? toFragment(row as FragmentoRow) : null;
  },

  async getFragmentsBySection(section) {
    return fragmentsFrom(
      check(
        "fragmentos de la sección",
        await publicFragmentos().eq("categoria.slug", section).order("publicado_en", { ascending: false }).limit(LIST_LIMIT),
      ),
    );
  },

  async getFragmentsForArticle(articleSlug) {
    const nota = check(
      "nota vinculada",
      await db().from("notas").select("id").eq("slug", articleSlug).eq("estado", "publicado").lte("publicado_en", now()).maybeSingle(),
    ) as { id: string } | null;
    if (!nota) return [];
    return fragmentsFrom(
      check(
        "fragmentos de la nota",
        await publicFragmentos().eq("nota_id", nota.id).order("publicado_en", { ascending: false }),
      ),
    );
  },

  async getAdjacentFragments(slug) {
    const current = check(
      "fragmento actual",
      await db().from("fragmentos").select("publicado_en").eq("slug", slug).eq("estado", "publicado").lte("publicado_en", now()).maybeSingle(),
    ) as { publicado_en: string } | null;
    if (!current) return { newer: null, older: null };
    const [newerRes, olderRes] = await Promise.all([
      publicFragmentos().gt("publicado_en", current.publicado_en).order("publicado_en", { ascending: true }).limit(1),
      publicFragmentos().lt("publicado_en", current.publicado_en).order("publicado_en", { ascending: false }).limit(1),
    ]);
    return {
      newer: fragmentsFrom(check("fragmento siguiente", newerRes))[0] ?? null,
      older: fragmentsFrom(check("fragmento anterior", olderRes))[0] ?? null,
    };
  },

  async search(query) {
    const q = query.trim().slice(0, 120);
    const terms = normalize(q)
      .split(" ")
      .filter((t) => t.length > 0)
      .slice(0, 6);
    if (terms.length === 0) return { query: q, articles: [], fragments: [] };

    let notas = publicNotas();
    let fragmentos = publicFragmentos();
    for (const term of terms) {
      const pattern = `%${likeLiteral(term)}%`;
      notas = notas.like("busqueda", pattern);
      fragmentos = fragmentos.like("busqueda", pattern);
    }
    const [notasRes, fragmentosRes] = await Promise.all([
      notas.order("publicado_en", { ascending: false }).limit(50),
      fragmentos.order("publicado_en", { ascending: false }).limit(50),
    ]);

    // Primero lo que coincide en el titular o la palabra clave
    const score = (headline: string) => terms.filter((t) => normalize(headline).includes(t)).length;
    const articles = articlesFrom(check("búsqueda de notas", notasRes)).sort(
      (a, b) => score(b.title) - score(a.title) || b.publishedAt.localeCompare(a.publishedAt),
    );
    const fragments = fragmentsFrom(check("búsqueda de fragmentos", fragmentosRes)).sort(
      (a, b) => score(b.keyword) - score(a.keyword) || b.publishedAt.localeCompare(a.publishedAt),
    );
    return { query: q, articles, fragments };
  },
};
