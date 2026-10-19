import "server-only";

/**
 * Punto único de acceso a contenidos.
 *
 * Origen de los datos (variable CONTENT_SOURCE):
 *  - "supabase": consulta Supabase (requiere NEXT_PUBLIC_SUPABASE_URL y la clave publicable).
 *  - "demo": usa los datos de muestra locales del kit.
 *  - sin definir: Supabase si las variables están completas; en desarrollo, si faltan,
 *    usa la demo con un aviso. En producción falta de configuración = error explícito,
 *    para que el portal nunca muestre la demo por accidente.
 */
import { readSupabaseConfig } from "@/lib/supabase/config";
import { demoRepository } from "./demo-repository";
import type { ContentRepository } from "./repository";
import { supabaseRepository } from "./supabase-repository";

let resolved: ContentRepository | null = null;

function resolveRepository(): ContentRepository {
  if (resolved) return resolved;
  const source = process.env.CONTENT_SOURCE?.trim().toLowerCase();

  if (source === "demo") {
    resolved = demoRepository;
  } else if (source === "supabase" || readSupabaseConfig()) {
    if (!readSupabaseConfig()) {
      throw new Error("CONTENT_SOURCE=supabase pero faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
    }
    resolved = supabaseRepository;
  } else if (process.env.NODE_ENV !== "production") {
    console.warn("[FRAGMENTADOS] Supabase no está configurado: se usan los datos de muestra locales.");
    resolved = demoRepository;
  } else {
    throw new Error(
      "Supabase no está configurado. Completá .env.local (ver .env.example) o definí CONTENT_SOURCE=demo explícitamente.",
    );
  }
  return resolved;
}

/** Mismo contrato que antes: las páginas siguen llamando content.getArticle(...), etc. */
export const content: ContentRepository = new Proxy({} as ContentRepository, {
  get(_target, prop: keyof ContentRepository) {
    const repo = resolveRepository();
    const value = repo[prop];
    return typeof value === "function" ? value.bind(repo) : value;
  },
});

export type * from "./types";
