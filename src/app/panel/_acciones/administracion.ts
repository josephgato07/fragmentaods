"use server";

/**
 * Portada, categorías y equipo. Cada función valida sesión y rol en el servidor;
 * la base vuelve a comprobarlo (RLS, funciones y trigger de perfiles).
 */
import { revalidatePath } from "next/cache";
import { NOMBRE_ROL, SLUG_VALIDO } from "@/lib/panel/reglas";
import { exigirRol, mensajeDeError, refrescarPortal } from "@/lib/panel/servidor";
import type { ResultadoSimple, Rol } from "@/lib/panel/tipos";
import { ROLES_EDICION } from "@/lib/panel/tipos";
import { createSessionClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ——— Portada ——— */

export async function guardarPortada(datos: {
  apertura: string | null;
  secundarias: string[];
  destacados: string[];
}): Promise<ResultadoSimple> {
  const sesion = await exigirRol(ROLES_EDICION);
  if ("error" in sesion) return { ok: false, mensaje: sesion.error };

  const secundarias = (datos.secundarias ?? []).filter(Boolean);
  const destacados = (datos.destacados ?? []).filter(Boolean);
  const ids = [datos.apertura, ...secundarias, ...destacados].filter((x): x is string => !!x);
  if (ids.some((x) => !UUID.test(x))) return { ok: false, mensaje: "Hay una selección inválida." };
  if (!datos.apertura) return { ok: false, mensaje: "Elegí la noticia de apertura." };
  if (secundarias.length > 3) return { ok: false, mensaje: "La portada admite hasta 3 notas secundarias." };
  if (destacados.length > 6) return { ok: false, mensaje: "La portada admite hasta 6 destacados." };

  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("guardar_portada", {
    p_apertura: datos.apertura,
    p_secundarias: secundarias,
    p_destacados: destacados,
  });
  if (error) return { ok: false, mensaje: mensajeDeError(error) };

  refrescarPortal();
  return { ok: true, mensaje: "Portada actualizada. Ya se ve en el portal." };
}

/* ——— Categorías (administrador) ——— */

export async function guardarCategoria(datos: {
  id: string | null;
  slug: string;
  nombre: string;
  orden: number;
  enPortada: boolean;
}): Promise<ResultadoSimple> {
  const sesion = await exigirRol(["administrador"]);
  if ("error" in sesion) return { ok: false, mensaje: sesion.error };

  const slug = datos.slug.trim();
  const nombre = datos.nombre.trim();
  const orden = Math.trunc(Number(datos.orden));
  if (!nombre || nombre.length > 60) return { ok: false, mensaje: "El nombre es obligatorio y admite hasta 60 caracteres." };
  if (!SLUG_VALIDO.test(slug) || slug.length > 60)
    return { ok: false, mensaje: "La dirección solo admite minúsculas, números y guiones (hasta 60 caracteres)." };
  if (!Number.isFinite(orden) || orden < -999 || orden > 999) return { ok: false, mensaje: "El orden debe ser un número entre -999 y 999." };
  if (datos.id && !UUID.test(datos.id)) return { ok: false, mensaje: "Categoría inválida." };

  const supabase = await createSessionClient();
  const fila = { slug, nombre, orden, en_portada: Boolean(datos.enPortada) };
  const { data, error } = datos.id
    ? await supabase.from("categorias").update(fila).eq("id", datos.id).select("id").maybeSingle()
    : await supabase.from("categorias").insert(fila).select("id").single();
  if (error) return { ok: false, mensaje: mensajeDeError(error) };
  if (!data) return { ok: false, mensaje: "La base no permitió el cambio." };

  refrescarPortal();
  revalidatePath("/panel/categorias");
  return { ok: true, mensaje: datos.id ? `Categoría «${nombre}» actualizada.` : `Categoría «${nombre}» creada.` };
}

export async function eliminarCategoria(id: string): Promise<ResultadoSimple> {
  const sesion = await exigirRol(["administrador"]);
  if ("error" in sesion) return { ok: false, mensaje: sesion.error };
  if (!UUID.test(id)) return { ok: false, mensaje: "Categoría inválida." };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("categorias").delete().eq("id", id).select("id").maybeSingle();
  if (error) {
    return {
      ok: false,
      mensaje:
        error.code === "23503"
          ? "No se puede eliminar: hay notas o fragmentos en esta categoría. Movelos a otra categoría primero."
          : mensajeDeError(error),
    };
  }
  if (!data) return { ok: false, mensaje: "La base no permitió eliminarla." };

  refrescarPortal();
  revalidatePath("/panel/categorias");
  return { ok: true, mensaje: "Categoría eliminada." };
}

/* ——— Equipo (administrador) ——— */

const ROLES: Rol[] = ["administrador", "editor", "redactor"];

export async function actualizarMiembro(datos: {
  id: string;
  nombreVisible: string;
  rol: Rol;
  activo: boolean;
}): Promise<ResultadoSimple> {
  const sesion = await exigirRol(["administrador"]);
  if ("error" in sesion) return { ok: false, mensaje: sesion.error };
  const { perfil } = sesion;

  if (!UUID.test(datos.id)) return { ok: false, mensaje: "Usuario inválido." };
  if (!ROLES.includes(datos.rol)) return { ok: false, mensaje: "Rol inválido." };
  const nombre = datos.nombreVisible.trim();
  if (nombre.length > 120) return { ok: false, mensaje: "El nombre visible admite hasta 120 caracteres." };

  const supabase = await createSessionClient();
  const { data: actual, error: errorLectura } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", datos.id)
    .maybeSingle();
  if (errorLectura || !actual) return { ok: false, mensaje: "No se encontró el usuario." };

  // Nadie cambia su propio rol ni se desactiva a sí mismo (la base también lo impide).
  if (datos.id === perfil.id && (datos.rol !== actual.rol || datos.activo !== actual.activo)) {
    return { ok: false, mensaje: "No podés cambiar tu propio rol ni desactivarte. Pedíselo a otro administrador." };
  }

  const cambios: Record<string, unknown> = { nombre_visible: nombre };
  if (datos.rol !== actual.rol) cambios.rol = datos.rol;
  if (datos.activo !== actual.activo) cambios.activo = datos.activo;

  const { data, error } = await supabase.from("perfiles").update(cambios).eq("id", datos.id).select("id").maybeSingle();
  if (error) return { ok: false, mensaje: mensajeDeError(error) };
  if (!data) return { ok: false, mensaje: "La base no permitió el cambio." };

  revalidatePath("/panel/usuarios");
  return {
    ok: true,
    mensaje: `Guardado: ${nombre || "usuario"} · ${NOMBRE_ROL[datos.rol]} · ${datos.activo ? "activo" : "inactivo"}.`,
  };
}
