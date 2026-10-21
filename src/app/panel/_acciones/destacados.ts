"use server";
import { exigirRol, mensajeDeError, refrescarPortal } from "@/lib/panel/servidor";
import { ROLES_EDICION } from "@/lib/panel/tipos";
import { validarImagen, fuentesParaGuardar } from "@/lib/panel/reglas";
import type { DestacadoForm } from "@/lib/panel/destacados";
import { createSessionClient } from "@/lib/supabase/server";

export async function guardarDestacado(f: DestacadoForm) {
  const sesion = await exigirRol(ROLES_EDICION);
  if ("error" in sesion) return { ok: false, mensaje: sesion.error };
  try {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!f || typeof f.publicado !== "boolean" || !["foto", "cifra", "cita"].includes(f.tipo) || (f.id && !uuid.test(f.id)) || (f.notaId && !uuid.test(f.notaId)))
      return { ok: false, mensaje: "Destacado o noticia inválidos." };
    const limites = { titulo: 120, texto: 400, valor: 16, cita: 600, atribucion: 160, acento: 120 } as const;
    for (const [campo, limite] of Object.entries(limites)) {
      const valor = f[campo as keyof typeof limites];
      if (typeof valor !== "string" || valor.trim().length > limite) return { ok: false, mensaje: `${campo}: máximo ${limite} caracteres.` };
    }
    if (f.tipo === "foto" && !f.titulo.trim()) return { ok: false, mensaje: "Escribí el título de la fotografía." };
    if (f.tipo === "cifra" && (!f.valor.trim() || !f.texto.trim())) return { ok: false, mensaje: "Completá la cifra y su explicación." };
    if (f.tipo === "cita" && !f.cita.trim()) return { ok: false, mensaje: "Escribí la cita." };
    const errores: Record<string, string> = {};
    validarImagen(f.imagen, "imagen", errores, f.tipo === "foto");
    if (errores.imagen) return { ok: false, mensaje: errores.imagen };
    if (!Array.isArray(f.fuentes) || f.fuentes.length > 30 || f.fuentes.some(x => typeof x.label !== "string" || typeof x.url !== "string" || !x.label.trim() || x.label.trim().length > 300 || x.url.length > 2000 || (x.url && !/^https:\/\/[^\s<>"'`\\]+$/.test(x.url))))
      return { ok: false, mensaje: "Revisá las fuentes: nombre obligatorio y enlace https:// opcional." };
    const db = await createSessionClient();
    if (f.notaId) {
      const { data, error } = await db.from("notas").select("id").eq("id", f.notaId).eq("estado", "publicado").lte("publicado_en", new Date().toISOString()).maybeSingle();
      if (error || !data) return { ok: false, mensaje: "La noticia vinculada debe estar publicada. Elegí otra o quitá el vínculo." };
    }
    let publicadoEn: string | null = f.publicado ? new Date().toISOString() : null;
    if (f.id) {
      const { data: actual, error } = await db.from("destacados").select("estado, publicado_en").eq("id", f.id).maybeSingle();
      if (error || !actual) return { ok: false, mensaje: "No se encontró el destacado para editar." };
      if (f.publicado && actual.estado === "publicado") publicadoEn = actual.publicado_en;
    }
    const im = f.imagen;
    const fila = {
      tipo: f.tipo, titulo: f.titulo.trim() || null, texto: f.texto.trim() || null,
      valor: f.valor.trim() || null, cita: f.cita.trim() || null, atribucion: f.atribucion.trim() || null,
      acento: f.acento.trim() || null, nota_id: f.notaId || null, fuentes: fuentesParaGuardar(f.fuentes),
      imagen_ruta: im?.ruta ?? null, imagen_alt: im?.alt.trim() ?? null,
      imagen_ancho: im?.ancho ?? null, imagen_alto: im?.alto ?? null,
      imagen_credito: im?.credito.trim() || null, imagen_foco: im?.foco ?? null, imagen_ajuste: im?.ajuste ?? "cover",
      estado: f.publicado ? "publicado" : "borrador", publicado_en: publicadoEn,
    };
    const { data, error } = f.id
      ? await db.from("destacados").update(fila).eq("id", f.id).select("id").maybeSingle()
      : await db.from("destacados").insert(fila).select("id").single();
    if (error) return { ok: false, mensaje: mensajeDeError(error) };
    if (!data) return { ok: false, mensaje: "No se pudo guardar el destacado." };
    refrescarPortal();
    return { ok: true, id: data.id as string, mensaje: f.publicado ? "Guardado. Ya podés elegirlo en Portada; si ya estaba elegido, se actualizó." : "Borrador guardado. No se muestra en el portal." };
  } catch { return { ok: false, mensaje: "No se pudo guardar. Revisá los datos y la conexión." }; }
}
