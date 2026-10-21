import type { MetadataRoute } from "next";
import { content } from "@/lib/content";
import { absoluteUrl, canIndex } from "@/lib/seo";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!canIndex()) return [];
  const [sections, pieces] = await Promise.all([content.getSections(), content.getSitemapContent()]);
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/fragmentos") },
    ...sections.map(s => ({ url: absoluteUrl(`/seccion/${s.slug}`) })),
    ...pieces.filter(p => !p.isDemo).map(p => ({
      url: absoluteUrl(`/${p.kind === "articulo" ? "nota" : "fragmento"}/${p.slug}`),
      lastModified: p.updatedAt ?? p.publishedAt,
      ...(p.image ? { images: [absoluteUrl(p.image.src)] } : {}),
    })),
  ];
  // Fallar explícitamente antes de servir un XML fuera del límite del protocolo.
  if (entries.length > 50000) throw new Error("El sitemap requiere dividirse en varios archivos (más de 50.000 URLs).");
  return entries;
}
