/**
 * Implementación de ContentRepository sobre los datos de muestra locales.
 * Las funciones son asíncronas a propósito: así las páginas ya están preparadas
 * para consultas reales a Supabase.
 */
import { articles, fragments, highlights, homeLayout, sections } from "./demo-data";
import type { ContentRepository } from "./repository";
import { searchContent } from "./search";
import type { Article, Fragment, SectionSlug } from "./types";

const byDateDesc = <T extends { publishedAt: string }>(a: T, b: T) => b.publishedAt.localeCompare(a.publishedAt);

const sortedArticles = () => [...articles].sort(byDateDesc);
const sortedFragments = () => [...fragments].sort(byDateDesc);

function requireArticle(slug: string): Article {
  const found = articles.find((a) => a.slug === slug);
  if (!found) throw new Error(`Nota de portada inexistente en los datos de muestra: ${slug}`);
  return found;
}

const sectionName = (slug: string) => sections.find((s) => s.slug === slug)?.name ?? slug;

export const demoRepository: ContentRepository = {
  async getSections() {
    return sections;
  },

  async getSection(slug) {
    return sections.find((s) => s.slug === slug) ?? null;
  },

  async getHomePage() {
    const lead = requireArticle(homeLayout.leadSlug);
    const secondary = homeLayout.secondarySlugs.map(requireArticle);

    const modules = homeLayout.moduleSections.map((slug) => {
      const section = sections.find((s) => s.slug === slug)!;
      const sectionArticles = sortedArticles().filter((a) => a.section === slug);
      const sectionFragments = sortedFragments().filter((f) => f.section === slug);
      // La nota principal del módulo evita repetir la apertura de portada.
      const moduleLead = sectionArticles.find((a) => a.slug !== lead.slug) ?? null;
      // La lista puede repetir la apertura como titular, para que ningún módulo quede vacío.
      const items: Array<Article | Fragment> = [
        ...sectionArticles.filter((a) => a.slug !== moduleLead?.slug),
        ...sectionFragments,
      ]
        .sort(byDateDesc)
        .slice(0, 4);
      return { section, lead: moduleLead, items };
    });

    return {
      lead,
      secondary,
      latestFragments: sortedFragments().slice(0, 8),
      modules: modules.filter((m) => m.lead || m.items.length > 0),
      highlights,
    };
  },

  async getArticles() {
    return sortedArticles();
  },

  async getArticle(slug) {
    return articles.find((a) => a.slug === slug) ?? null;
  },

  async getArticlesBySection(section: SectionSlug) {
    return sortedArticles().filter((a) => a.section === section);
  },

  async getRelatedArticles(article, limit = 3) {
    const others = sortedArticles().filter((a) => a.slug !== article.slug);
    const same = others.filter((a) => a.section === article.section);
    const rest = others.filter((a) => a.section !== article.section);
    return [...same, ...rest].slice(0, limit);
  },

  async getFragments() {
    return sortedFragments();
  },

  async getFragment(slug) {
    return fragments.find((f) => f.slug === slug) ?? null;
  },

  async getFragmentsBySection(section: SectionSlug) {
    return sortedFragments().filter((f) => f.section === section);
  },

  async getFragmentsForArticle(articleSlug) {
    return sortedFragments().filter((f) => f.articleSlug === articleSlug);
  },

  async getAdjacentFragments(slug) {
    const list = sortedFragments();
    const i = list.findIndex((f) => f.slug === slug);
    if (i === -1) return { newer: null, older: null };
    return { newer: list[i - 1] ?? null, older: list[i + 1] ?? null };
  },

  async search(query) {
    const q = query.trim().slice(0, 120);
    const results = searchContent(q, articles, fragments, sectionName);
    return { query: q, ...results };
  },
};
