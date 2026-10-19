/**
 * Configuración pública de Supabase.
 * Solo usa la URL del proyecto y la clave PUBLICABLE (antes "anon"), que está
 * pensada para el navegador: los permisos reales los imponen las políticas RLS.
 * La clave secreta (service_role / sb_secret_…) no se usa en este proyecto.
 */

export const BUCKET_IMAGENES = "imagenes-editoriales";

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

function decodeJwtRole(key: string): string | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

/** Impide usar por error una clave secreta como clave pública. */
export function assertPublishableKey(key: string): void {
  if (key.startsWith("sb_secret_") || decodeJwtRole(key) === "service_role") {
    throw new Error(
      "La variable NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contiene una clave SECRETA. " +
        "Reemplazala por la clave publicable (Project Settings → API Keys) y rotá la secreta en Supabase.",
    );
  }
}

/** Devuelve la configuración o `null` si falta alguna variable. */
export function readSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !publishableKey) return null;
  assertPublishableKey(publishableKey);
  return { url: url.replace(/\/+$/, ""), publishableKey };
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = readSupabaseConfig();
  if (!config) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Copiá .env.example a .env.local y completalas, o usá CONTENT_SOURCE=demo.",
    );
  }
  return config;
}

/** URL pública de una imagen del bucket editorial, o la ruta local de las imágenes de muestra. */
export function publicImageUrl(ruta: string): string {
  if (ruta.startsWith("/")) return ruta;
  const { url } = requireSupabaseConfig();
  const path = ruta.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/${BUCKET_IMAGENES}/${path}`;
}
