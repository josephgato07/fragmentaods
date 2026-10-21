import type { MetadataRoute } from "next";
import { absoluteUrl, canIndex } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!canIndex()) return { rules: { userAgent: "*", disallow: "/" } };
  // El panel y la búsqueda llevan noindex. Se permite leer esa instrucción.
  return { rules: { userAgent: "*", allow: "/" }, sitemap: absoluteUrl("/sitemap.xml") };
}
