/**
 * Tipos del panel editorial. Se usan en el navegador (formularios) y en el
 * servidor (Server Actions), por eso no importan nada de servidor.
 */
import type { Inline } from "@/lib/content/types";

export type Rol = "administrador" | "editor" | "redactor";
export type Estado = "borrador" | "en_revision" | "publicado";
/** Estado tal como se muestra: "publicado" con fecha futura es "programado". */
export type EstadoVisible = Estado | "programado";

export type Accion = "guardar" | "enviar_revision" | "devolver_borrador" | "publicar" | "programar" | "despublicar";

export const ROLES_EQUIPO: Rol[] = ["administrador", "editor", "redactor"];
export const ROLES_EDICION: Rol[] = ["administrador", "editor"];

export interface ImagenForm {
  /** Ruta dentro del bucket (notas/2026/10/x.jpg) o ruta local de la demo (/demo/x.jpg). */
  ruta: string;
  alt: string;
  ancho: number;
  alto: number;
  credito: string;
  pie: string;
  /** Punto focal del recorte, "50% 35%". */
  foco: string | null;
  ajuste: "cover" | "contain";
}

export type BloqueForm =
  | { id: string; type: "parrafo"; content: Inline[] }
  | { id: string; type: "imagen"; imagen: ImagenForm | null }
  | { id: string; type: "pendiente"; note: string };

export interface ParrafoForm {
  id: string;
  content: Inline[];
}

export interface FuenteForm {
  label: string;
  url: string;
}

export interface NotaForm {
  id: string | null;
  titulo: string;
  slug: string;
  bajada: string;
  etiqueta: string;
  lugar: string;
  firma: string;
  categoriaId: string;
  fuentes: FuenteForm[];
  imagen: ImagenForm | null;
  cuerpo: BloqueForm[];
  /** Fecha y hora local de Uruguay para programar ("2026-10-20T08:00"). */
  programarPara: string;
}

export interface FragmentoForm {
  id: string | null;
  palabraClave: string;
  slug: string;
  lugar: string;
  firma: string;
  categoriaId: string;
  fuentes: FuenteForm[];
  imagen: ImagenForm | null;
  parrafos: ParrafoForm[];
  notaId: string;
  programarPara: string;
}

/** Estado editorial de un contenido guardado. */
export interface SituacionContenido {
  estado: Estado;
  publicadoEn: string | null;
  esPropio: boolean;
  esNuevo: boolean;
}

export interface ResultadoGuardado {
  ok: boolean;
  mensaje: string;
  /** Errores por campo (clave = nombre del campo). */
  errores?: Record<string, string>;
  id?: string;
  slug?: string;
  estado?: Estado;
  publicadoEn?: string | null;
  actualizadoEn?: string;
}

export interface ResultadoSimple {
  ok: boolean;
  mensaje: string;
}
