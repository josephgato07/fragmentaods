import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BotonEliminar } from "@/components/panel/BotonEliminar";
import { EstadoChip } from "@/components/panel/EstadoChip";
import { SinPermiso } from "@/components/panel/SinPermiso";
import { perfilDelPanel } from "@/lib/panel/sesion";
import { createSessionClient } from "@/lib/supabase/server";
import { formatearFechaHora } from "@/lib/panel/fechas";
import { NOMBRE_ESTADO } from "@/lib/panel/reglas";
import type { Estado, EstadoVisible } from "@/lib/panel/tipos";
import styles from "@/components/panel/panel.module.css";

export const metadata: Metadata = { title: "Destacados" };
const POR_PAGINA = 30;
const ESTADOS: EstadoVisible[] = ["borrador", "en_revision", "publicado", "programado"];
const TIPOS = { foto: "Fotografía / noticia", cifra: "Cifra", cita: "Cita" };
type Parametros = { q?: string; estado?: string; tipo?: string; pagina?: string };

export default async function ListadoDestacados({ searchParams }: { searchParams: Promise<Parametros> }) {
  const perfil = (await perfilDelPanel())!;
  if (perfil.rol === "redactor") return <SinPermiso texto="Los destacados los administran editores y administradores." />;
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const estado = ESTADOS.includes(params.estado as EstadoVisible) ? params.estado! : "";
  const tipo = ["foto", "cifra", "cita"].includes(params.tipo ?? "") ? params.tipo! : "";
  const pagina = Math.min(100000, Math.max(1, parseInt(params.pagina ?? "1", 10) || 1));
  const ahora = new Date();
  const db = await createSessionClient();
  let consulta = db.from("destacados").select("id, tipo, titulo, texto, valor, cita, estado, publicado_en, creado_en, actualizado_en", { count: "exact" });
  if (estado === "programado") consulta = consulta.eq("estado", "publicado").gt("publicado_en", ahora.toISOString());
  else if (estado === "publicado") consulta = consulta.eq("estado", "publicado").lte("publicado_en", ahora.toISOString());
  else if (estado) consulta = consulta.eq("estado", estado);
  if (tipo) consulta = consulta.eq("tipo", tipo);
  // Solo letras/números/espacios en la expresión PostgREST; no acepta operadores del usuario.
  const busqueda = q.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().replace(/\s+/g, " ");
  if (busqueda) consulta = consulta.or(["titulo", "texto", "valor", "cita"].map(c => `${c}.ilike.%${busqueda}%`).join(","));
  const { data, error, count } = await consulta.order("actualizado_en", { ascending: false }).order("id").range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  if (error) return <p role="alert">No se pudo cargar el listado de destacados. Recargá la página e intentá nuevamente.</p>;
  const paginas = Math.max(1, Math.ceil((count ?? 0) / POR_PAGINA));
  const url = (n: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q); if (estado) sp.set("estado", estado); if (tipo) sp.set("tipo", tipo); if (n > 1) sp.set("pagina", String(n));
    return `/panel/destacados${sp.size ? `?${sp}` : ""}`;
  };
  if (pagina > paginas) redirect(url(paginas));
  return <>
    <div className={styles.cabecera}><div><h1 className={styles.titulo}>Destacados</h1><p className={styles.subtitulo}>Todos tus destacados guardados, incluidos borradores y publicaciones anteriores.</p></div><Link className={styles.boton} href="/panel/destacados/nuevo">+ Nuevo destacado</Link></div>
    <form className={styles.filtros} role="search" action="/panel/destacados">
      <div className={styles.filtrosFila}>
        <div className={styles.campo}><label className={styles.etiqueta} htmlFor="q">Buscar</label><input id="q" name="q" type="search" className={styles.input} defaultValue={q} placeholder="Título, texto, cifra o cita" /></div>
        <div className={styles.campo}><label className={styles.etiqueta} htmlFor="estado">Estado</label><select id="estado" name="estado" className={styles.select} defaultValue={estado}><option value="">Todos</option>{ESTADOS.map(e => <option key={e} value={e}>{NOMBRE_ESTADO[e]}</option>)}</select></div>
        <div className={styles.campo}><label className={styles.etiqueta} htmlFor="tipo">Formato</label><select id="tipo" name="tipo" className={styles.select} defaultValue={tipo}><option value="">Todos</option>{Object.entries(TIPOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
        <button className={styles.boton} type="submit">Filtrar</button>
      </div>
      {q || tipo || estado ? <Link className="enlace" href="/panel/destacados">Limpiar filtros</Link> : null}
    </form>
    <p className={styles.ayuda} role="status">{count ?? 0} resultados · página {pagina} de {paginas}</p>
    {!data.length ? <p className={styles.vacio}>No hay destacados con estos filtros.</p> : <ul className={styles.lista}>{data.map(f => {
      const titulo = f.tipo === "cifra" ? `${f.valor ?? ""} ${f.texto ?? ""}` : f.tipo === "cita" ? f.cita : f.titulo;
      return <li key={f.id} className={styles.fila}>
        <h2 className={styles.filaTitulo}><Link href={`/panel/destacados/${f.id}`}>{titulo || "Sin título"}</Link></h2>
        <div className={styles.filaMeta}><EstadoChip estado={f.estado as Estado} publicadoEn={f.publicado_en} ahora={ahora} /><span>{TIPOS[f.tipo as keyof typeof TIPOS]}</span><span>Creado {formatearFechaHora(f.creado_en)}</span><span>Editado {formatearFechaHora(f.actualizado_en)}</span></div>
        <div className={styles.filaAcciones}><Link className={`${styles.boton} ${styles.botonChico}`} href={`/panel/destacados/${f.id}`}>Editar</Link>{perfil.rol === "administrador" ? <BotonEliminar tipo="destacado" id={f.id} titulo={titulo || "Sin título"} /> : null}</div>
      </li>;
    })}</ul>}
    {paginas > 1 ? <nav className={styles.paginacion} aria-label="Páginas de destacados">{pagina > 1 ? <Link href={url(pagina - 1)}>← Anterior</Link> : <span />}{pagina < paginas ? <Link href={url(pagina + 1)}>Siguiente →</Link> : <span />}</nav> : null}
  </>;
}
