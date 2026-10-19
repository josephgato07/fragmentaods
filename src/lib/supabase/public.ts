import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "./config";

/** Segundos que una página pública puede servirse desde caché antes de refrescarse. */
export const PUBLIC_REVALIDATE_SECONDS = 60;
/** Etiqueta de caché de todos los contenidos públicos (para revalidateTag desde el panel). */
export const CONTENT_CACHE_TAG = "contenidos";

let client: SupabaseClient | null = null;

/**
 * Cliente para la LECTURA PÚBLICA del portal.
 * - Usa la clave publicable y NUNCA lee cookies: siempre consulta como visitante
 *   anónimo, así que RLS solo le entrega contenido publicado. Aunque el editor
 *   tenga sesión abierta, el portal no le muestra borradores.
 * - Sus consultas se guardan en la caché de Next.js y se refrescan cada 60 s
 *   (o antes, con revalidateTag("contenidos")).
 */
export function getPublicClient(): SupabaseClient {
  if (client) return client;
  const { url, publishableKey } = requireSupabaseConfig();
  client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [CONTENT_CACHE_TAG] },
        }),
    },
  });
  return client;
}
