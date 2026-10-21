import type { Metadata } from "next";
import { AdminDestacados } from "@/components/panel/AdminDestacados";
import { SinPermiso } from "@/components/panel/SinPermiso";
import { perfilDelPanel } from "@/lib/panel/sesion";
import { createSessionClient } from "@/lib/supabase/server";
import { DESTACADO_COLUMNS, type DestacadoRow } from "@/lib/content/mappers";
import type { DestacadoForm, NotaDestacable } from "@/lib/panel/destacados";
import type { ImagenForm } from "@/lib/panel/tipos";
import styles from "@/components/panel/panel.module.css";
export const metadata: Metadata = { title: "Destacados" };
function imagen(r: { imagen_ruta: string | null; imagen_alt: string | null; imagen_ancho: number | null; imagen_alto: number | null; imagen_credito: string | null; imagen_foco: string | null; imagen_ajuste: string | null }): ImagenForm | null {
  return r.imagen_ruta ? { ruta: r.imagen_ruta, alt: r.imagen_alt ?? "", ancho: r.imagen_ancho ?? 1, alto: r.imagen_alto ?? 1, credito: r.imagen_credito ?? "", foco: r.imagen_foco, ajuste: r.imagen_ajuste === "contain" ? "contain" : "cover", pie: "" } : null;
}
export default async function PaginaDestacados() {
  const perfil = (await perfilDelPanel())!;
  if (perfil.rol === "redactor") return <SinPermiso texto="Los destacados los administran editores y administradores." />;
  const db = await createSessionClient();
  const [destacados, notas] = await Promise.all([
    db.from("destacados").select(`${DESTACADO_COLUMNS}, nota_id, estado`).order("actualizado_en", { ascending: false }),
    db.from("notas").select("id, titulo, imagen_ruta, imagen_alt, imagen_ancho, imagen_alto, imagen_credito, imagen_foco, imagen_ajuste").eq("estado", "publicado").lte("publicado_en", new Date().toISOString()).order("publicado_en", { ascending: false }),
  ]);
  if (destacados.error || notas.error) return <p role="alert">No se pudieron cargar los destacados. Comprobá que aplicaste la migración de destacados y recargá la página.</p>;
  const filas = destacados.data as unknown as (DestacadoRow & { nota_id: string | null; estado: string })[];
  const items: DestacadoForm[] = filas.map(r => ({
    id: r.id, tipo: r.tipo, titulo: r.titulo ?? "", texto: r.texto ?? "", valor: r.valor ?? "", cita: r.cita ?? "", atribucion: r.atribucion ?? "", acento: r.acento ?? "", notaId: r.nota_id ?? "", imagen: imagen(r), publicado: r.estado === "publicado",
    fuentes: Array.isArray(r.fuentes) ? r.fuentes.map(f => ({ label: f.label, url: f.url ?? "" })) : [],
  }));
  const opciones: NotaDestacable[] = notas.data.map(r => ({ id: r.id, titulo: r.titulo, imagen: imagen(r) }));
  return <><div className={styles.cabecera}><h1 className={styles.titulo}>Destacados</h1></div><AdminDestacados items={items} notas={opciones} /></>;
}
