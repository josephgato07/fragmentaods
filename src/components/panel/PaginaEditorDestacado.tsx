import { notFound } from "next/navigation";
import { AdminDestacados } from "@/components/panel/AdminDestacados";
import { SinPermiso } from "@/components/panel/SinPermiso";
import { perfilDelPanel } from "@/lib/panel/sesion";
import { createSessionClient } from "@/lib/supabase/server";
import { DESTACADO_COLUMNS, type DestacadoRow } from "@/lib/content/mappers";
import { destacadoVacio, type DestacadoForm, type NotaDestacable } from "@/lib/panel/destacados";
import type { ImagenForm } from "@/lib/panel/tipos";
import styles from "@/components/panel/panel.module.css";
function imagen(r: { imagen_ruta: string | null; imagen_alt: string | null; imagen_ancho: number | null; imagen_alto: number | null; imagen_credito: string | null; imagen_foco: string | null; imagen_ajuste: string | null }): ImagenForm | null {
  return r.imagen_ruta ? { ruta: r.imagen_ruta, alt: r.imagen_alt ?? "", ancho: r.imagen_ancho ?? 1, alto: r.imagen_alto ?? 1, credito: r.imagen_credito ?? "", foco: r.imagen_foco, ajuste: r.imagen_ajuste === "contain" ? "contain" : "cover", pie: "" } : null;
}
export async function PaginaEditorDestacado({ id }: { id?: string }) {
  const perfil = (await perfilDelPanel())!;
  if (perfil.rol === "redactor") return <SinPermiso texto="Los destacados los administran editores y administradores." />;
  if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const db = await createSessionClient();
  const [destacados, notas] = await Promise.all([
    id ? db.from("destacados").select(`${DESTACADO_COLUMNS}, nota_id, estado`).eq("id", id) : Promise.resolve({ data: [], error: null }),
    db.from("notas").select("id, titulo, imagen_ruta, imagen_alt, imagen_ancho, imagen_alto, imagen_credito, imagen_foco, imagen_ajuste").eq("estado", "publicado").lte("publicado_en", new Date().toISOString()).order("publicado_en", { ascending: false }),
  ]);
  if (destacados.error || notas.error) return <p role="alert">No se pudieron cargar los destacados. Comprobá que aplicaste la migración de destacados y recargá la página.</p>;
  if (id && !destacados.data?.length) notFound();
  const filas = destacados.data as unknown as (DestacadoRow & { nota_id: string | null; estado: string })[];
  const items: DestacadoForm[] = filas.map(r => ({
    id: r.id, tipo: r.tipo, titulo: r.titulo ?? "", texto: r.texto ?? "", valor: r.valor ?? "", cita: r.cita ?? "", atribucion: r.atribucion ?? "", acento: r.acento ?? "", notaId: r.nota_id ?? "", imagen: imagen(r), publicado: r.estado === "publicado",
    fuentes: Array.isArray(r.fuentes) ? r.fuentes.map(f => ({ label: f.label, url: f.url ?? "" })) : [],
  }));
  const opciones: NotaDestacable[] = notas.data.map(r => ({ id: r.id, titulo: r.titulo, imagen: imagen(r) }));
  return <><div className={styles.cabecera}><h1 className={styles.titulo}>{id ? "Editar destacado" : "Nuevo destacado"}</h1></div><AdminDestacados key={id ?? "nuevo"} inicial={items[0] ?? destacadoVacio()} notas={opciones} /></>;
}
