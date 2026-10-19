import type { Article, Fragment, Inline } from "./types";

/** Minúsculas y sin tildes, para que "pobreza" encuentre "POBREZA" y "economia" encuentre "Economía". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function inlineToText(content: Inline[]): string {
  return content.map((part) => (typeof part === "string" ? part : part.text)).join("");
}

function articleText(article: Article, sectionName: string): string {
  const body = article.body
    .map((block) => {
      if (block.type === "parrafo") return inlineToText(block.content);
      if (block.type === "imagen") return block.image.caption ?? "";
      return "";
    })
    .join(" ");
  return [article.title, article.deck ?? "", article.label, sectionName, article.place, body].join(" ");
}

function fragmentText(fragment: Fragment, sectionName: string): string {
  return [fragment.keyword, sectionName, fragment.place, ...fragment.body.map(inlineToText)].join(" ");
}

/**
 * Búsqueda simple sobre datos locales: todas las palabras de la consulta deben aparecer.
 * Los resultados con coincidencia en el título o palabra clave van primero.
 */
export function searchContent(
  query: string,
  articles: Article[],
  fragments: Fragment[],
  sectionName: (slug: string) => string,
): { articles: Article[]; fragments: Fragment[] } {
  const terms = normalize(query).split(" ").filter((t) => t.length > 0);
  if (terms.length === 0) return { articles: [], fragments: [] };

  const score = (haystack: string, headline: string) => {
    const h = normalize(haystack);
    if (!terms.every((t) => h.includes(t))) return 0;
    const head = normalize(headline);
    return 1 + terms.filter((t) => head.includes(t)).length;
  };

  const rank = <T extends { publishedAt: string }>(items: Array<{ item: T; s: number }>) =>
    items
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || b.item.publishedAt.localeCompare(a.item.publishedAt))
      .map((r) => r.item);

  return {
    articles: rank(articles.map((a) => ({ item: a, s: score(articleText(a, sectionName(a.section)), a.title) }))),
    fragments: rank(
      fragments.map((f) => ({ item: f, s: score(fragmentText(f, sectionName(f.section)), f.keyword) })),
    ),
  };
}
