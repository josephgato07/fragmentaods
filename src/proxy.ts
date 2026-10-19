import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (antes "middleware") de Next.js 16.
 * Refresca la sesión de Supabase SOLO en las rutas del panel editorial
 * (/panel/…, incluido /panel/ingresar). Las páginas públicas no pasan por aquí:
 * siguen siendo estáticas y cacheables. Los permisos NO se deciden acá: cada
 * página y cada Server Action del panel vuelve a validar sesión, rol y estado.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Valida el JWT y, si venció, lo renueva antes de que la página se renderice.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};
