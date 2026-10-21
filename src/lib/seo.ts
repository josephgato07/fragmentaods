import type { Metadata } from "next";
import type { Article } from "@/lib/content/types";
import { inlineToText } from "@/lib/content/search";

// Un único dominio canónico, también si se abre la copia *.vercel.app.
export const SITE_URL = "https://www.fragmentados.org";
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export function canIndex(): boolean {
  return process.env.NODE_ENV === "production" &&
    process.env.CONTENT_SOURCE?.trim().toLowerCase() !== "demo" &&
    (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");
}

export function publicRobots(isDemo = false): Metadata["robots"] {
  return canIndex() && !isDemo
    ? { index: true, follow: true, "max-image-preview": "large" }
    : { index: false, follow: false };
}

export function articleDescription(article: Article): string {
  return (article.deck?.trim() || article.body.filter(b => b.type === "parrafo")
    .map(b => inlineToText(b.content)).join(" ")).slice(0, 180);
}

export function articleJsonLd(article: Article, section?: string) {
  const url = absoluteUrl(`/nota/${article.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    headline: article.title,
    description: articleDescription(article),
    image: [absoluteUrl(article.image.src)],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    ...(article.author.trim() ? { author: { "@type": article.author.trim().toUpperCase() === "FRAGMENTADOS" ? "Organization" : "Person", name: article.author } } : {}),
    publisher: { "@type": "Organization", name: "FRAGMENTADOS", url: SITE_URL },
    articleSection: section ?? article.section,
    inLanguage: "es-UY",
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
