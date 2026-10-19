import "server-only";

/**
 * Consultas del panel. Usan SIEMPRE el cliente con la sesión del usuario:
 * la base decide qué filas ve cada rol (RLS). Nada de esto se cachea.
 */
import { randomUUID } from "node:crypto";
import { parseParagraph } from "@/lib/content/mappers";
import { normalize } from "@/lib/content/search";
import type { Inline } from "@/lib/content/types";
import { createSessionClient } from "@/lib/supabase/server";
import type { BloqueForm, Estado, EstadoVisible, FragmentoForm, FuenteForm, ImagenForm, NotaForm, Rol } from "./tipos";

export const POR_PAGINA = 30;

export class ErrorDeDatos extends Error {}

function fallo(contexto: string, error: { message: string }): never {
  throw new ErrorDeDatos(`No se pudo cargar ${contexto}: ${error.message}`);
}

/* ——— Resumen del inicio ——— */

export type Resumen = Record<"nota" | "fragmento", Record<EstadoVisible, number>>;

export async function obtenerResumen(): Promise<Resumen> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("resumen_panel");
  if (error) fallo("el resumen", error);
  const vacio = (): Record<EstadoVisible, number> => ({ borrador: 0, en_revision: 0, publicado: 0, programado: 0 });
  const resumen: Resumen = { nota: vacio(), fragmento: vacio() };
  for (const fila of (data ?? []) as Array<{ tipo: "nota" | "fragmento"; estado: EstadoVisible; total: number }>) {
    resumen[fila.tipo][fila.estado] = Number(fila.total);
  }
  return resumen;
}

/* ——— Listados ——— */

export interface FiltrosListado {
  q: string;
  estado: EstadoVisible | "";
  categoria: string;
  pagina: number;
  soloMios?: boolean;
}

export interface FilaListado {
  id: string;
  titulo: string;
  slug: string;
  estado: Estado;
  publicadoEn: string | null;
  actualizadoEn: string;
  categoria: string;
  autor: string;
  autorId: string | null;
}

const terminos = (q: string) =>
  normalize(q)
    .split(" ")
    .filter(Boolean)
    .slice(0, 6)
    .map((t) => `%${t.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);

async function listar(tabla: "notas" | "fragmentos", filtros: FiltrosListado, usuarioId: string) {
  const supabase = await createSessionClient();
  const campoTitulo = tabla === "notas" ? "titulo" : "palabra_clave";
  const fk = tabla === "notas" ? "notas_autor_id_fkey" : "fragmentos_autor_id_fkey";
  const ahora = new Date().toISOString();

  let consulta = supabase
    .from(tabla)
    .select(
      `id, slug, ${campoTitulo}, estado, publicado_en, actualizado_en, autor_id, categoria:categorias!inner(slug, nombre), autor:perfiles!${fk}(nombre_visible)`,
      { count: "exact" },
    );

  if (filtros.estado === "programado") consulta = consulta.eq("estado", "publicado").gt("publicado_en", ahora);
  else if (filtros.estado === "publicado") consulta = consulta.eq("estado", "publicado").lte("publicado_en", ahora);
  else if (filtros.estado) consulta = consulta.eq("estado", filtros.estado);
  if (filtros.categoria) consulta = consulta.eq("categoria.slug", filtros.categoria);
  if (filtros.soloMios) consulta = consulta.eq("autor_id", usuarioId);
  for (const t of terminos(filtros.q)) consulta = consulta.like("busqueda", t);

  const desde = (Math.max(1, filtros.pagina) - 1) * POR_PAGINA;
  const { data, error, count } = await consulta
    .order("actualizado_en", { ascending: false })
    .range(desde, desde + POR_PAGINA - 1);
  if (error) fallo(tabla === "notas" ? "las notas" : "los fragmentos", error);

  const filas: FilaListado[] = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    titulo: r[campoTitulo] as string,
    slug: r.slug as string,
    estado: r.estado as Estado,
    publicadoEn: (r.publicado_en as string | null) ?? null,
    actualizadoEn: r.actualizado_en as string,
    categoria: (r.categoria as { nombre: string } | null)?.nombre ?? "—",
    autor: (r.autor as { nombre_visible: string } | null)?.nombre_visible || "—",
    autorId: (r.autor_id as string | null) ?? null,
  }));
  return { filas, total: count ?? filas.length };
}

export const listarNotas = (f: FiltrosListado, usuarioId: string) => listar("notas", f, usuarioId);
export const listarFragmentos = (f: FiltrosListado, usuarioId: string) => listar("fragmentos", f, usuarioId);

/* ——— Categorías ——— */

export interface CategoriaPanel {
  id: string;
  slug: string;
  nombre: string;
  orden: number;
  enPortada: boolean;
}

export async function listarCategorias(): Promise<CategoriaPanel[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("categorias").select("id, slug, nombre, orden, en_portada").order("orden").order("nombre");
  if (error) fallo("las categorías", error);
  return (data ?? []).map((c) => ({ id: c.id, slug: c.slug, nombre: c.nombre, orden: c.orden, enPortada: c.en_portada }));
}

/* ——— Edición: filas → formularios ——— */

export interface MetaContenido {
  id: string;
  estado: Estado;
  publicadoEn: string | null;
  actualizadoEn: string;
  autorId: string | null;
  autorNombre: string;
  esDemo: boolean;
}

function imagenDeColumnas(r: Record<string, unknown>): ImagenForm | null {
  if (!r.imagen_ruta) return null;
  return {
    ruta: r.imagen_ruta as string,
    alt: (r.imagen_alt as string) ?? "",
    ancho: (r.imagen_ancho as number) ?? 0,
    alto: (r.imagen_alto as number) ?? 0,
    credito: (r.imagen_credito as string) ?? "",
    pie: (r.imagen_pie as string) ?? "",
    foco: (r.imagen_foco as string) ?? null,
    ajuste: r.imagen_ajuste === "contain" ? "contain" : "cover",
  };
}

function imagenDeJson(v: unknown): ImagenForm | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.ruta !== "string") return null;
  return {
    ruta: o.ruta,
    alt: typeof o.alt === "string" ? o.alt : "",
    ancho: Number(o.ancho) || 0,
    alto: Number(o.alto) || 0,
    credito: typeof o.credito === "string" ? o.credito : "",
    pie: typeof o.pie === "string" ? o.pie : "",
    foco: typeof o.foco === "string" ? o.foco : null,
    ajuste: o.ajuste === "contain" ? "contain" : "cover",
  };
}

function fuentesDeJson(v: unknown): FuenteForm[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .map((f) => ({ label: typeof f.label === "string" ? f.label : "", url: typeof f.url === "string" ? f.url : "" }));
}

function cuerpoNotaDeJson(v: unknown): BloqueForm[] {
  if (!Array.isArray(v)) return [];
  const bloques: BloqueForm[] = [];
  for (const b of v) {
    if (!b || typeof b !== "object") continue;
    const o = b as Record<string, unknown>;
    if (o.type === "parrafo") bloques.push({ id: randomUUID(), type: "parrafo", content: parseParagraph(o.content) ?? [] });
    else if (o.type === "imagen") bloques.push({ id: randomUUID(), type: "imagen", imagen: imagenDeJson(o.imagen) });
    else if (o.type === "pendiente" && typeof o.note === "string") bloques.push({ id: randomUUID(), type: "pendiente", note: o.note });
  }
  return bloques;
}

const COLUMNAS_IMAGEN = "imagen_ruta, imagen_alt, imagen_credito, imagen_pie, imagen_ancho, imagen_alto, imagen_foco, imagen_ajuste";

export async function obtenerNotaParaEditar(id: string): Promise<{ form: NotaForm; meta: MetaContenido } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("notas")
    .select(
      `id, slug, titulo, bajada, etiqueta, cuerpo, lugar, firma, fuentes, categoria_id, ${COLUMNAS_IMAGEN}, estado, publicado_en, actualizado_en, autor_id, es_demo, autor:perfiles!notas_autor_id_fkey(nombre_visible)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) fallo("la nota", error);
  if (!data) return null;
  const r = data as unknown as Record<string, unknown>;
  return {
    form: {
      id: r.id as string,
      titulo: r.titulo as string,
      slug: r.slug as string,
      bajada: (r.bajada as string) ?? "",
      etiqueta: (r.etiqueta as string) ?? "",
      lugar: r.lugar as string,
      firma: r.firma as string,
      categoriaId: r.categoria_id as string,
      fuentes: fuentesDeJson(r.fuentes),
      imagen: imagenDeColumnas(r),
      cuerpo: cuerpoNotaDeJson(r.cuerpo),
      programarPara: "",
    },
    meta: metaDe(r),
  };
}

export async function obtenerFragmentoParaEditar(id: string): Promise<{ form: FragmentoForm; meta: MetaContenido } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("fragmentos")
    .select(
      `id, slug, palabra_clave, cuerpo, lugar, firma, fuentes, categoria_id, nota_id, ${COLUMNAS_IMAGEN}, estado, publicado_en, actualizado_en, autor_id, es_demo, autor:perfiles!fragmentos_autor_id_fkey(nombre_visible)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) fallo("el fragmento", error);
  if (!data) return null;
  const r = data as unknown as Record<string, unknown>;
  const parrafos = Array.isArray(r.cuerpo) ? (r.cuerpo as unknown[]) : [];
  return {
    form: {
      id: r.id as string,
      palabraClave: r.palabra_clave as string,
      slug: r.slug as string,
      lugar: r.lugar as string,
      firma: r.firma as string,
      categoriaId: r.categoria_id as string,
      fuentes: fuentesDeJson(r.fuentes),
      imagen: imagenDeColumnas(r),
      parrafos: parrafos.map((p) => ({ id: randomUUID(), content: (parseParagraph(p) ?? []) as Inline[] })),
      notaId: (r.nota_id as string) ?? "",
      programarPara: "",
    },
    meta: metaDe(r),
  };
}

function metaDe(r: Record<string, unknown>): MetaContenido {
  return {
    id: r.id as string,
    estado: r.estado as Estado,
    publicadoEn: (r.publicado_en as string | null) ?? null,
    actualizadoEn: r.actualizado_en as string,
    autorId: (r.autor_id as string | null) ?? null,
    autorNombre: (r.autor as { nombre_visible: string } | null)?.nombre_visible || "—",
    esDemo: Boolean(r.es_demo),
  };
}

/** Notas que un fragmento puede enlazar como «nota completa». */
export async function opcionesDeNotas(): Promise<Array<{ id: string; titulo: string; estado: Estado; publicadoEn: string | null }>> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("notas")
    .select("id, titulo, estado, publicado_en")
    .order("actualizado_en", { ascending: false })
    .limit(200);
  if (error) fallo("las notas", error);
  return (data ?? []).map((n) => ({ id: n.id, titulo: n.titulo, estado: n.estado, publicadoEn: n.publicado_en }));
}

/* ——— Portada ——— */

export interface OpcionPortada {
  id: string;
  titulo: string;
  publicadoEn: string | null;
  detalle?: string;
}

export interface DatosPortada {
  apertura: string | null;
  secundarias: string[];
  destacados: string[];
  notas: OpcionPortada[];
  opcionesDestacados: OpcionPortada[];
}

export async function obtenerPortada(): Promise<DatosPortada> {
  const supabase = await createSessionClient();
  const [ubic, notas, dest] = await Promise.all([
    supabase.from("ubicaciones_portada").select("zona, posicion, nota_id, destacado_id").order("posicion"),
    supabase
      .from("notas")
      .select("id, titulo, publicado_en")
      .eq("estado", "publicado")
      .order("publicado_en", { ascending: false })
      .limit(150),
    supabase
      .from("destacados")
      .select("id, tipo, valor, cita, titulo, publicado_en")
      .eq("estado", "publicado")
      .order("publicado_en", { ascending: false })
      .limit(100),
  ]);
  if (ubic.error) fallo("la portada", ubic.error);
  if (notas.error) fallo("las notas publicadas", notas.error);
  if (dest.error) fallo("los destacados", dest.error);

  const filas = ubic.data ?? [];
  const nombreTipo: Record<string, string> = { cifra: "Cifra", cita: "Cita", foto: "Fotografía" };
  return {
    apertura: filas.find((u) => u.zona === "apertura")?.nota_id ?? null,
    secundarias: filas.filter((u) => u.zona === "secundaria").map((u) => u.nota_id as string),
    destacados: filas.filter((u) => u.zona === "destacado").map((u) => u.destacado_id as string),
    notas: (notas.data ?? []).map((n) => ({ id: n.id, titulo: n.titulo, publicadoEn: n.publicado_en })),
    opcionesDestacados: (dest.data ?? []).map((d) => ({
      id: d.id,
      publicadoEn: d.publicado_en,
      detalle: nombreTipo[d.tipo as string] ?? d.tipo,
      titulo:
        d.tipo === "cifra"
          ? `${d.valor}`
          : d.tipo === "cita"
            ? `“${String(d.cita ?? "").slice(0, 70)}${String(d.cita ?? "").length > 70 ? "…" : ""}”`
            : String(d.titulo ?? ""),
    })),
  };
}

/* ——— Equipo (administrador) ——— */

export interface Miembro {
  id: string;
  email: string;
  nombreVisible: string;
  rol: Rol;
  activo: boolean;
  ultimoIngreso: string | null;
}

export async function listarEquipo(): Promise<Miembro[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("listar_equipo");
  if (error) fallo("el equipo", error);
  return ((data ?? []) as Array<Record<string, unknown>>).map((m) => ({
    id: m.id as string,
    email: (m.email as string) ?? "",
    nombreVisible: (m.nombre_visible as string) ?? "",
    rol: m.rol as Rol,
    activo: Boolean(m.activo),
    ultimoIngreso: (m.ultimo_ingreso as string | null) ?? null,
  }));
}
