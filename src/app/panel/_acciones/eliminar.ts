"use server";

import { revalidatePath } from "next/cache";
import { exigirRol, mensajeDeError, refrescarPortal } from "@/lib/panel/servidor";
import { createSessionClient } from "@/lib/supabase/server";
import type { ResultadoSimple } from "@/lib/panel/tipos";

/** Elimina solo el registro elegido. La base resuelve vínculos y posiciones;
 * las imágenes se conservan porque pueden estar compartidas con otros contenidos. */
export async function eliminarContenido(tipo: "nota" | "fragmento" | "destacado", id: string): Promise<ResultadoSimple> {
  const sesion = await exigirRol(["administrador"]);
  if ("error" in sesion) return { ok: false, mensaje: sesion.error };
  if (!["nota", "fragmento", "destacado"].includes(tipo) || typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return { ok: false, mensaje: "El contenido seleccionado no es válido." };
  const tabla = tipo === "nota" ? "notas" : tipo === "fragmento" ? "fragmentos" : "destacados";
  try {
    const db = await createSessionClient();
    const { data, error } = await db.from(tabla).delete().eq("id", id).select("id").maybeSingle();
    if (error) return { ok: false, mensaje: mensajeDeError(error) };
    if (!data) return { ok: false, mensaje: "No se encontró el contenido o no se permitió eliminarlo. Recargá el listado." };
  } catch { return { ok: false, mensaje: "No se pudo confirmar la eliminación. Recargá el listado antes de volver a intentarlo." }; }

  // La eliminación ya se confirmó: un fallo de caché no debe presentarla como fallida.
  try {
    refrescarPortal();
    revalidatePath("/panel", "layout");
  } catch { return { ok: true, mensaje: "Contenido eliminado. La vista pública puede tardar hasta un minuto en actualizarse." }; }
  return { ok: true, mensaje: "Contenido eliminado definitivamente." };
}
