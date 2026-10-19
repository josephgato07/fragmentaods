"use server";

/**
 * Guardar y cambiar de estado notas y fragmentos.
 * Orden de las comprobaciones (todas en el servidor):
 *  1. Sesión válida, perfil activo y rol del equipo.
 *  2. La acción está permitida para ese rol y ese estado (reglas.ts).
 *  3. Validación completa de los datos.
 *  4. La base vuelve a aplicar RLS, triggers del flujo editorial y restricciones.
 */
import { desdeEntradaLocal } from "@/lib/panel/fechas";
import {
  accionesPermitidas,
  cuerpoNotaParaGuardar,
  fuentesParaGuardar,
  MENSAJE_ACCION,
  parrafosParaGuardar,
  textoONulo,
  transicion,
  validarFragmento,
  validarNota,
} from "@/lib/panel/reglas";
import { exigirRol, mensajeDeError, refrescarPortal } from "@/lib/panel/servidor";
import type { Accion, Estado, FragmentoForm, ImagenForm, NotaForm, ResultadoGuardado } from "@/lib/panel/tipos";
import { ROLES_EQUIPO } from "@/lib/panel/tipos";
import { createSessionClient } from "@/lib/supabase/server";

const ACCIONES: Accion[] = ["guardar", "enviar_revision", "devolver_borrador", "publicar", "programar", "despublicar"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function columnasImagen(imagen: ImagenForm | null, conPie: boolean) {
  const base = {
    imagen_ruta: imagen?.ruta ?? null,
    imagen_alt: imagen ? imagen.alt.trim() : null,
    imagen_credito: imagen ? textoONulo(imagen.credito) : null,
    imagen_ancho: imagen ? Math.round(imagen.ancho) : null,
    imagen_alto: imagen ? Math.round(imagen.alto) : null,
    imagen_foco: imagen?.foco ?? null,
    imagen_ajuste: imagen?.ajuste ?? "cover",
  };
  return conPie ? { ...base, imagen_pie: imagen ? textoONulo(imagen.pie) : null } : base;
}

type Tabla = "notas" | "fragmentos";

interface Actual {
  id: string;
  slug: string;
  estado: Estado;
  publicado_en: string | null;
  autor_id: string | null;
}

async function procesar(
  tabla: Tabla,
  id: string | null,
  accion: Accion,
  programarPara: string,
  validar: (estadoActual: Estado | null) => Record<string, string>,
  columnas: (slugFinal: string) => Record<string, unknown>,
  slugPedido: string,
): Promise<ResultadoGuardado> {
  if (!ACCIONES.includes(accion)) return { ok: false, mensaje: "Acción desconocida." };
  if (id !== null && !UUID.test(id)) return { ok: false, mensaje: "Identificador inválido." };

  const sesion = await exigirRol(ROLES_EQUIPO);
  if ("error" in sesion) return { ok: false, mensaje: sesion.error };
  const { perfil } = sesion;

  const supabase = await createSessionClient();
  const ahora = new Date();

  let actual: Actual | null = null;
  if (id) {
    const { data, error } = await supabase.from(tabla).select("id, slug, estado, publicado_en, autor_id").eq("id", id).maybeSingle();
    if (error) return { ok: false, mensaje: mensajeDeError(error) };
    if (!data) return { ok: false, mensaje: "El contenido no existe o no tenés acceso a él." };
    actual = data as Actual;
  }

  const permitidas = accionesPermitidas(
    perfil.rol,
    {
      estado: actual?.estado ?? "borrador",
      publicadoEn: actual?.publicado_en ?? null,
      esPropio: !actual || actual.autor_id === perfil.id,
      esNuevo: !actual,
    },
    ahora,
  );
  if (!permitidas.includes(accion)) {
    return {
      ok: false,
      mensaje:
        perfil.rol === "redactor" && actual && actual.estado !== "borrador"
          ? "Este contenido ya está en revisión o publicado: solo un editor puede modificarlo."
          : "Tu rol no permite esta acción sobre este contenido.",
    };
  }

  const errores = validar(actual?.estado ?? null);
  if (Object.keys(errores).length > 0) return { ok: false, mensaje: "Revisá los campos marcados.", errores };

  const programarIso = accion === "programar" ? desdeEntradaLocal(programarPara) : null;
  const destino = transicion(accion, actual ? { estado: actual.estado, publicadoEn: actual.publicado_en } : null, programarIso, ahora);

  // Una vez publicado, la dirección no cambia (para no romper enlaces compartidos).
  const fuePublicado = actual?.estado === "publicado";
  const slugFinal = fuePublicado && actual ? actual.slug : slugPedido.trim();

  const fila = { ...columnas(slugFinal), estado: destino.estado, publicado_en: destino.publicadoEn };
  const columnasRespuesta = "id, slug, estado, publicado_en, actualizado_en";

  const respuesta = actual
    ? await supabase.from(tabla).update(fila).eq("id", actual.id).select(columnasRespuesta).maybeSingle()
    : await supabase.from(tabla).insert(fila).select(columnasRespuesta).single();

  if (respuesta.error) return { ok: false, mensaje: mensajeDeError(respuesta.error) };
  if (!respuesta.data) {
    return { ok: false, mensaje: "La base no permitió el cambio con tu rol. Puede que el contenido haya cambiado de estado: recargá la página." };
  }
  const guardado = respuesta.data as { id: string; slug: string; estado: Estado; publicado_en: string | null; actualizado_en: string };

  if (fuePublicado || guardado.estado === "publicado") refrescarPortal();

  return {
    ok: true,
    mensaje: MENSAJE_ACCION[accion],
    id: guardado.id,
    slug: guardado.slug,
    estado: guardado.estado,
    publicadoEn: guardado.publicado_en,
    actualizadoEn: guardado.actualizado_en,
  };
}

export async function guardarNota(form: NotaForm, accion: Accion): Promise<ResultadoGuardado> {
  return procesar(
    "notas",
    form.id,
    accion,
    form.programarPara,
    (estadoActual) => validarNota(form, accion, estadoActual),
    (slug) => ({
      slug,
      titulo: form.titulo.trim(),
      bajada: textoONulo(form.bajada),
      etiqueta: textoONulo(form.etiqueta),
      lugar: form.lugar.trim(),
      firma: form.firma.trim(),
      categoria_id: form.categoriaId,
      fuentes: fuentesParaGuardar(form.fuentes),
      cuerpo: cuerpoNotaParaGuardar(form.cuerpo),
      ...columnasImagen(form.imagen, true),
    }),
    form.slug,
  );
}

export async function guardarFragmento(form: FragmentoForm, accion: Accion): Promise<ResultadoGuardado> {
  if (form.notaId && !UUID.test(form.notaId)) return { ok: false, mensaje: "La nota vinculada no es válida." };
  return procesar(
    "fragmentos",
    form.id,
    accion,
    form.programarPara,
    (estadoActual) => validarFragmento(form, accion, estadoActual),
    (slug) => ({
      slug,
      palabra_clave: form.palabraClave.trim(),
      lugar: form.lugar.trim(),
      firma: form.firma.trim(),
      categoria_id: form.categoriaId,
      fuentes: fuentesParaGuardar(form.fuentes),
      cuerpo: parrafosParaGuardar(form.parrafos),
      nota_id: form.notaId || null,
      ...columnasImagen(form.imagen, true),
    }),
    form.slug,
  );
}
