import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseConfig } from "./config";

/**
 * Cliente con la SESIÓN del usuario, para Server Components, Server Actions y
 * Route Handlers del panel editorial.
 * Las consultas se hacen con el rol del usuario: RLS aplica sus permisos.
 * No usar en las páginas públicas (las volvería dinámicas y sin caché).
 */
export async function createSessionClient() {
  const { url, publishableKey } = requireSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // En un Server Component no se pueden escribir cookies: el proxy ya refresca la sesión.
        }
      },
    },
  });
}
