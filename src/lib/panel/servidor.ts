import "server-only";

/**
 * Utilidades de servidor para las Server Actions del panel.
 */
import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath, updateTag } from "next/cache";
import { PermisoDenegadoError, requerirRol, type PerfilActual } from "@/lib/auth/perfil";
import { CONTENT_CACHE_TAG } from "@/lib/supabase/public";
import type { Rol } from "./tipos";

/**
 * Actualiza el portal público al instante, sin recompilar:
 * vence los datos cacheados de Supabase y las páginas generadas.
 * Solo puede llamarse desde Server Actions.
 */
export function refrescarPortal() {
  updateTag(CONTENT_CACHE_TAG);
  revalidatePath("/", "layout");
}

/** Comprueba sesión, perfil activo y rol. Devuelve el perfil o un mensaje para mostrar. */
export async function exigirRol(roles: Rol[]): Promise<{ perfil: PerfilActual } | { error: string }> {
  try {
    return { perfil: await requerirRol(roles) };
  } catch (e) {
    if (e instanceof PermisoDenegadoError) return { error: e.message };
    return { error: "No se pudo verificar tu sesión. Volvé a ingresar." };
  }
}

const RESTRICCIONES: Record<string, string> = {
  notas_publicable: "Para publicar una nota hace falta una imagen principal.",
  fragmentos_publicable: "Para publicar, el fragmento necesita al menos un párrafo.",
  notas_cuerpo_check: "El cuerpo de la nota tiene un formato que la base no acepta. Revisá enlaces y énfasis.",
  fragmentos_cuerpo_check: "El texto del fragmento tiene un formato que la base no acepta. Revisá enlaces y énfasis.",
  notas_imagen_completa: "Faltan datos de la imagen principal (texto alternativo o medidas).",
  fragmentos_imagen_completa: "Faltan datos de la imagen (texto alternativo o medidas).",
  notas_slug_check: "La dirección (slug) no tiene un formato válido.",
  fragmentos_slug_check: "La dirección (slug) no tiene un formato válido.",
  notas_slug_key: "Ya existe una nota con esa dirección (slug). Cambiala e intentá de nuevo.",
  fragmentos_slug_key: "Ya existe un fragmento con esa dirección (slug). Cambiala e intentá de nuevo.",
  categorias_slug_key: "Ya existe una categoría con esa dirección.",
};

/** Traduce errores de la base a mensajes claros. Nunca muestra detalles internos. */
export function mensajeDeError(error: PostgrestError | { code?: string; message: string }): string {
  const texto = error.message ?? "";
  for (const [clave, mensaje] of Object.entries(RESTRICCIONES)) {
    if (texto.includes(clave)) return mensaje;
  }
  switch (error.code) {
    case "23505":
      return "Ya existe un registro con esos datos (probablemente la misma dirección o slug).";
    case "23503":
      return "No se puede completar: hay contenidos que dependen de este registro.";
    case "23514":
      return "Algún dato no cumple las reglas de la base (largo de los textos, formato del cuerpo o de la imagen).";
    case "42501":
    case "P0001":
    case "22023":
      // Mensajes escritos por nosotros en las migraciones (triggers y funciones)
      return /^[A-ZÁÉÍÓÚÑ¿¡]/.test(texto) && !texto.startsWith("new row") && !texto.startsWith("permission")
        ? texto
        : "Tu rol no tiene permiso para esta operación.";
    default:
      return "No se pudo completar la operación. Intentá de nuevo en unos segundos.";
  }
}
