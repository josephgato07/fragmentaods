/**
 * Contrato de acceso a contenidos.
 * Los componentes y páginas solo usan estas funciones; nunca importan los datos directamente.
 * Para pasar a Supabase alcanza con escribir otra implementación de `ContentRepository`
 * y cambiarla en `src/lib/content/index.ts`.
 */
import type { Article, Fragment, HomePage, SearchResults, Section, SectionSlug } from "./types";

export interface ContentRepository {
  getSections(): Promise<Section[]>;
  getSection(slug: string): Promise<Section | null>;

  getHomePage(): Promise<HomePage>;

  getArticles(): Promise<Article[]>;
  getArticle(slug: string): Promise<Article | null>;
  getArticlesBySection(section: SectionSlug): Promise<Article[]>;
  getRelatedArticles(article: Article, limit?: number): Promise<Article[]>;

  getFragments(): Promise<Fragment[]>;
  getFragment(slug: string): Promise<Fragment | null>;
  getFragmentsBySection(section: SectionSlug): Promise<Fragment[]>;
  getFragmentsForArticle(articleSlug: string): Promise<Fragment[]>;
  getAdjacentFragments(slug: string): Promise<{ newer: Fragment | null; older: Fragment | null }>;

  search(query: string): Promise<SearchResults>;
}
