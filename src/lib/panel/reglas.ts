/**
 * Reglas editoriales del panel: qué puede hacer cada rol y cómo se validan
 * los datos. Es el mismo código en el navegador (para mostrar solo los botones
 * posibles y avisar antes de enviar) y en el servidor (para rechazar). La base
 * de datos vuelve a comprobar todo con RLS, triggers y restricciones.
 */
import type { Inline } from "@/lib/content/types";
import { desdeEntradaLocal } from "./fechas";
import type {
  Accion,
  BloqueForm,
  Estado,
  EstadoVisible,
  FragmentoForm,
  FuenteForm,
  ImagenForm,
  NotaForm,
  Rol,
  SituacionContenido,
} from "./tipos";

/* ——— Límites (iguales a la migración 1) ——— */
export const LIMITES = {
  titulo: 300,
  bajada: 600,
  etiqueta: 40,
  lugar: 80,
  firma: 120,
  palabraClave: 60,
  slugMin: 3,
  slugMax: 160,
  enfasis: 240,
  textoEnlace: 300,
  alt: 400,
  credito: 200,
  pie: 500,
  fuentes: 30,
  fuente: 300,
  parrafosFragmento: 20,
  bloquesNota: 400,
  imagenBytes: 10 * 1024 * 1024,
} as const;

export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const EXTENSION_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const SLUG_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const HREF_VALIDO = /^(\/(?!\/)[^\s<>"'`\\]*|https:\/\/[^\s<>"'`\\]+)$/;
export const URL_FUENTE_VALIDA = /^https:\/\/[^\s<>"'`\\]+$/;
const RUTA_IMAGEN = /^(\/demo\/[a-z0-9-]+|(notas|fragmentos|destacados|general)\/[a-z0-9/_-]+)\.(jpg|jpeg|png|webp|avif)$/;
const FOCO = /^(100|[1-9]?[0-9])% (100|[1-9]?[0-9])%$/;

/* ——— Estados ——— */

export function estadoVisible(estado: Estado, publicadoEn: string | null, ahora = new Date()): EstadoVisible {
  if (estado === "publicado" && publicadoEn && new Date(publicadoEn) > ahora) return "programado";
  return estado;
}

export const NOMBRE_ESTADO: Record<EstadoVisible, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
  programado: "Programado",
};

export const NOMBRE_ROL: Record<Rol, string> = {
  administrador: "Administrador",
  editor: "Editor",
  redactor: "Redactor",
};

/* ——— Permisos por rol ——— */

/** Acciones que el rol puede ejecutar sobre un contenido en su estado actual. */
export function accionesPermitidas(rol: Rol, c: SituacionContenido, ahora = new Date()): Accion[] {
  const visible = estadoVisible(c.estado, c.publicadoEn, ahora);

  if (rol === "redactor") {
    if (c.esNuevo || (c.esPropio && c.estado === "borrador")) return ["guardar", "enviar_revision"];
    return [];
  }

  // Editor y administrador
  if (c.esNuevo) return ["guardar", "publicar", "programar"];
  switch (visible) {
    case "borrador":
      return ["guardar", "publicar", "programar"];
    case "en_revision":
      return ["guardar", "devolver_borrador", "publicar", "programar"];
    case "programado":
      return ["guardar", "publicar", "programar", "despublicar"];
    case "publicado":
      return ["guardar", "despublicar"];
  }
}

/** Estado y fecha resultantes de aplicar una acción. */
export function transicion(
  accion: Accion,
  actual: { estado: Estado; publicadoEn: string | null } | null,
  programarIso: string | null,
  ahora = new Date(),
): { estado: Estado; publicadoEn: string | null } {
  const estado = actual?.estado ?? "borrador";
  const publicadoEn = actual?.publicadoEn ?? null;
  switch (accion) {
    case "guardar":
      return { estado, publicadoEn };
    case "enviar_revision":
      return { estado: "en_revision", publicadoEn: null };
    case "devolver_borrador":
    case "despublicar":
      return { estado: "borrador", publicadoEn: null };
    case "publicar": {
      const yaPublico = estado === "publicado" && publicadoEn && new Date(publicadoEn) <= ahora;
      return { estado: "publicado", publicadoEn: yaPublico ? publicadoEn : ahora.toISOString() };
    }
    case "programar":
      return { estado: "publicado", publicadoEn: programarIso };
  }
}

export const ETIQUETA_ACCION: Record<Accion, string> = {
  guardar: "Guardar",
  enviar_revision: "Enviar a revisión",
  devolver_borrador: "Devolver a borrador",
  publicar: "Publicar ahora",
  programar: "Programar",
  despublicar: "Despublicar",
};

export const MENSAJE_ACCION: Record<Accion, string> = {
  guardar: "Cambios guardados",
  enviar_revision: "Enviado a revisión",
  devolver_borrador: "Devuelto a borrador",
  publicar: "Publicado",
  programar: "Publicación programada",
  despublicar: "Despublicado: ya no se ve en el portal",
};

/* ——— Texto en línea ——— */

export function textoPlano(content: Inline[]): string {
  return content.map((p) => (typeof p === "string" ? p : p.text)).join("");
}

/** Une piezas contiguas del mismo tipo y quita las vacías. */
export function limpiarInlines(content: Inline[]): Inline[] {
  const salida: Inline[] = [];
  for (const parte of content) {
    if (typeof parte === "string") {
      if (!parte) continue;
      const ultima = salida[salida.length - 1];
      if (typeof ultima === "string") salida[salida.length - 1] = ultima + parte;
      else salida.push(parte);
      continue;
    }
    if (!parte.text) continue;
    const ultima = salida[salida.length - 1];
    if (ultima && typeof ultima !== "string" && ultima.type === parte.type && (parte.type === "enfasis" || (ultima.type === "enlace" && ultima.href === parte.href))) {
      salida[salida.length - 1] = { ...ultima, text: ultima.text + parte.text } as Inline;
    } else {
      salida.push(parte);
    }
  }
  // Sin espacios sobrantes al principio y al final del párrafo
  if (typeof salida[0] === "string") salida[0] = (salida[0] as string).replace(/^\s+/, "");
  const fin = salida.length - 1;
  if (typeof salida[fin] === "string") salida[fin] = (salida[fin] as string).replace(/\s+$/, "");
  return salida.filter((p) => (typeof p === "string" ? p.length > 0 : p.text.length > 0));
}

function erroresInlines(content: Inline[]): string | null {
  for (const parte of content) {
    if (typeof parte === "string") continue;
    if (parte.type === "enfasis" && parte.text.length > LIMITES.enfasis) {
      return `Un énfasis supera los ${LIMITES.enfasis} caracteres. Subrayá solo la frase central, no el párrafo entero.`;
    }
    if (parte.type === "enlace") {
      if (!HREF_VALIDO.test(parte.href)) return `El enlace «${parte.text}» no es válido: usá una ruta interna (/…) o una dirección https://.`;
      if (parte.text.length > LIMITES.textoEnlace) return "El texto de un enlace es demasiado largo.";
    }
  }
  return null;
}

/* ——— Slug ——— */

export function crearSlug(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
  return base.length >= LIMITES.slugMin ? base : base ? `${base}-nota` : "";
}

/* ——— Validación ——— */

type Errores = Record<string, string>;

function largo(errores: Errores, campo: string, valor: string, max: number, nombre: string, obligatorio = false) {
  const v = valor.trim();
  if (obligatorio && !v) errores[campo] = `${nombre} es obligatorio.`;
  else if (v.length > max) errores[campo] = `${nombre} admite hasta ${max} caracteres (tiene ${v.length}).`;
}

function validarSlug(errores: Errores, slug: string) {
  const s = slug.trim();
  if (!s) errores.slug = "La dirección (slug) es obligatoria.";
  else if (!SLUG_VALIDO.test(s)) errores.slug = "La dirección solo admite minúsculas, números y guiones (sin tildes ni espacios).";
  else if (s.length < LIMITES.slugMin || s.length > LIMITES.slugMax)
    errores.slug = `La dirección debe tener entre ${LIMITES.slugMin} y ${LIMITES.slugMax} caracteres.`;
}

export function validarImagen(imagen: ImagenForm | null, campo: string, errores: Errores, obligatoria: boolean) {
  if (!imagen) {
    if (obligatoria) errores[campo] = "Para publicar hace falta una imagen principal.";
    return;
  }
  if (!RUTA_IMAGEN.test(imagen.ruta)) errores[campo] = "La imagen no tiene una ruta válida. Volvé a subirla.";
  else if (!imagen.alt.trim()) errores[campo] = "Escribí el texto alternativo de la imagen (qué se ve en la foto).";
  else if (imagen.alt.trim().length > LIMITES.alt) errores[campo] = `El texto alternativo admite hasta ${LIMITES.alt} caracteres.`;
  else if (imagen.credito.trim().length > LIMITES.credito) errores[campo] = `El crédito admite hasta ${LIMITES.credito} caracteres.`;
  else if (imagen.pie.trim().length > LIMITES.pie) errores[campo] = `El pie de foto admite hasta ${LIMITES.pie} caracteres.`;
  else if (!(imagen.ancho > 0 && imagen.alto > 0)) errores[campo] = "No se pudieron leer las medidas de la imagen. Volvé a subirla.";
  else if (imagen.foco && !FOCO.test(imagen.foco)) errores[campo] = "El punto de interés de la imagen no es válido.";
}

function validarFuentes(fuentes: FuenteForm[], errores: Errores) {
  const usadas = fuentes.filter((f) => f.label.trim() || f.url.trim());
  if (usadas.length > LIMITES.fuentes) errores.fuentes = `Se admiten hasta ${LIMITES.fuentes} fuentes.`;
  for (const f of usadas) {
    if (!f.label.trim()) {
      errores.fuentes = "Cada fuente necesita un nombre.";
      return;
    }
    if (f.label.trim().length > LIMITES.fuente) {
      errores.fuentes = `El nombre de una fuente admite hasta ${LIMITES.fuente} caracteres.`;
      return;
    }
    if (f.url.trim() && !URL_FUENTE_VALIDA.test(f.url.trim())) {
      errores.fuentes = `La dirección de «${f.label.trim()}» debe empezar con https://.`;
      return;
    }
  }
}

function validarProgramacion(accion: Accion, local: string, errores: Errores, ahora: Date) {
  if (accion !== "programar") return;
  const iso = desdeEntradaLocal(local);
  if (!iso) errores.programarPara = "Elegí la fecha y la hora de publicación.";
  else if (new Date(iso).getTime() < ahora.getTime() + 60_000)
    errores.programarPara = "La fecha programada tiene que ser al menos un minuto posterior a la hora actual. Para publicar ya, usá «Publicar ahora».";
}

/** ¿El resultado de la acción quedará publicado o programado? */
const quedaPublicado = (accion: Accion, estadoActual: Estado | null) =>
  accion === "publicar" || accion === "programar" || (accion === "guardar" && estadoActual === "publicado");

export function validarNota(form: NotaForm, accion: Accion, estadoActual: Estado | null, ahora = new Date()): Errores {
  const errores: Errores = {};
  largo(errores, "titulo", form.titulo, LIMITES.titulo, "El título", true);
  validarSlug(errores, form.slug);
  largo(errores, "bajada", form.bajada, LIMITES.bajada, "La bajada");
  largo(errores, "etiqueta", form.etiqueta, LIMITES.etiqueta, "La etiqueta");
  largo(errores, "lugar", form.lugar, LIMITES.lugar, "El lugar", true);
  largo(errores, "firma", form.firma, LIMITES.firma, "La firma", true);
  if (!form.categoriaId) errores.categoriaId = "Elegí una categoría.";
  validarFuentes(form.fuentes, errores);
  validarImagen(form.imagen, "imagen", errores, quedaPublicado(accion, estadoActual));

  const bloques = cuerpoNotaParaGuardar(form.cuerpo);
  if (bloques.length > LIMITES.bloquesNota) errores.cuerpo = "El cuerpo tiene demasiados bloques.";
  for (const b of form.cuerpo) {
    if (b.type === "parrafo") {
      const e = erroresInlines(b.content);
      if (e) {
        errores.cuerpo = e;
        break;
      }
    } else if (b.type === "imagen" && b.imagen) {
      const e: Errores = {};
      validarImagen(b.imagen, "x", e, true);
      if (e.x) {
        errores.cuerpo = `Imagen del cuerpo: ${e.x}`;
        break;
      }
    }
  }
  validarProgramacion(accion, form.programarPara, errores, ahora);
  return errores;
}

export function validarFragmento(form: FragmentoForm, accion: Accion, estadoActual: Estado | null, ahora = new Date()): Errores {
  const errores: Errores = {};
  largo(errores, "palabraClave", form.palabraClave, LIMITES.palabraClave, "La palabra clave", true);
  validarSlug(errores, form.slug);
  largo(errores, "lugar", form.lugar, LIMITES.lugar, "El lugar", true);
  largo(errores, "firma", form.firma, LIMITES.firma, "La firma", true);
  if (!form.categoriaId) errores.categoriaId = "Elegí una categoría.";
  validarFuentes(form.fuentes, errores);
  validarImagen(form.imagen, "imagen", errores, false);

  const parrafos = parrafosParaGuardar(form.parrafos);
  if (parrafos.length > LIMITES.parrafosFragmento) errores.cuerpo = `Un fragmento admite hasta ${LIMITES.parrafosFragmento} párrafos.`;
  if (parrafos.length === 0 && quedaPublicado(accion, estadoActual)) errores.cuerpo = "Para publicar, el fragmento necesita al menos un párrafo.";
  for (const p of parrafos) {
    const e = erroresInlines(p);
    if (e) {
      errores.cuerpo = e;
      break;
    }
  }
  validarProgramacion(accion, form.programarPara, errores, ahora);
  return errores;
}

/* ——— Conversión del formulario al JSON de la base ——— */

export function imagenJson(imagen: ImagenForm) {
  const out: Record<string, unknown> = {
    ruta: imagen.ruta,
    alt: imagen.alt.trim(),
    ancho: Math.round(imagen.ancho),
    alto: Math.round(imagen.alto),
  };
  if (imagen.credito.trim()) out.credito = imagen.credito.trim();
  if (imagen.pie.trim()) out.pie = imagen.pie.trim();
  if (imagen.foco) out.foco = imagen.foco;
  if (imagen.ajuste === "contain") out.ajuste = "contain";
  return out;
}

export function cuerpoNotaParaGuardar(bloques: BloqueForm[]) {
  const salida: unknown[] = [];
  for (const b of bloques) {
    if (b.type === "parrafo") {
      const content = limpiarInlines(b.content);
      if (content.length > 0) salida.push({ type: "parrafo", content });
    } else if (b.type === "imagen") {
      if (b.imagen) salida.push({ type: "imagen", imagen: imagenJson(b.imagen) });
    } else if (b.note.trim()) {
      salida.push({ type: "pendiente", note: b.note.trim() });
    }
  }
  return salida;
}

export function parrafosParaGuardar(parrafos: { content: Inline[] }[]): Inline[][] {
  return parrafos.map((p) => limpiarInlines(p.content)).filter((p) => p.length > 0);
}

export function fuentesParaGuardar(fuentes: FuenteForm[]) {
  return fuentes
    .filter((f) => f.label.trim())
    .map((f) => (f.url.trim() ? { label: f.label.trim(), url: f.url.trim() } : { label: f.label.trim() }));
}

export const textoONulo = (v: string) => (v.trim() ? v.trim() : null);
