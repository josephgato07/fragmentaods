import Link from "next/link";
import { listarCategorias, listarFragmentos, listarNotas, POR_PAGINA, type FiltrosListado } from "@/lib/panel/datos";
import { NOMBRE_ESTADO } from "@/lib/panel/reglas";
import type { EstadoVisible } from "@/lib/panel/tipos";
import type { PerfilActual } from "@/lib/auth/perfil";
import { ListaContenidos } from "./ListaContenidos";
import styles from "./panel.module.css";

const ESTADOS: EstadoVisible[] = ["borrador", "en_revision", "programado", "publicado"];

export type ParamsListado = { q?: string; estado?: string; categoria?: string; pagina?: string; mios?: string };

/** Listado con búsqueda y filtros por estado y categoría (formulario GET: funciona sin JavaScript). */
export async function PaginaListado({ tipo, params, perfil }: { tipo: "nota" | "fragmento"; params: ParamsListado; perfil: PerfilActual }) {
  const filtros: FiltrosListado = {
    q: (params.q ?? "").slice(0, 120),
    estado: ESTADOS.includes(params.estado as EstadoVisible) ? (params.estado as EstadoVisible) : "",
    categoria: (params.categoria ?? "").slice(0, 60),
    pagina: Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1),
    soloMios: params.mios === "1",
  };
  const [categorias, resultado] = await Promise.all([
    listarCategorias(),
    tipo === "nota" ? listarNotas(filtros, perfil.id) : listarFragmentos(filtros, perfil.id),
  ]);
  const paginas = Math.max(1, Math.ceil(resultado.total / POR_PAGINA));
  const base = tipo === "nota" ? "/panel/notas" : "/panel/fragmentos";
  const enlacePagina = (n: number) => {
    const sp = new URLSearchParams();
    if (filtros.q) sp.set("q", filtros.q);
    if (filtros.estado) sp.set("estado", filtros.estado);
    if (filtros.categoria) sp.set("categoria", filtros.categoria);
    if (filtros.soloMios) sp.set("mios", "1");
    if (n > 1) sp.set("pagina", String(n));
    const s = sp.toString();
    return s ? `${base}?${s}` : base;
  };
  const hayFiltros = Boolean(filtros.q || filtros.estado || filtros.categoria || filtros.soloMios);

  return (
    <>
      <div className={styles.cabecera}>
        <div>
          <p className={styles.antetitulo}>{tipo === "nota" ? "Noticias" : "Fragmentos"}</p>
          <h1 className={styles.titulo}>{tipo === "nota" ? "Noticias" : "Fragmentos"}</h1>
          {perfil.rol === "redactor" ? (
            <p className={styles.subtitulo}>Ves tus contenidos y todo lo publicado. Los borradores de otros redactores no aparecen.</p>
          ) : null}
        </div>
        <Link href={tipo === "nota" ? "/panel/notas/nueva" : "/panel/fragmentos/nuevo"} className={styles.boton}>
          {tipo === "nota" ? "+ Nueva noticia" : "+ Nuevo fragmento"}
        </Link>
      </div>

      <form className={styles.filtros} role="search" action={base}>
        <div className={styles.filtrosFila}>
          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="q">
              Buscar
            </label>
            <input id="q" name="q" type="search" className={styles.input} defaultValue={filtros.q} placeholder="Título, texto o palabra clave" />
          </div>
          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="estado">
              Estado
            </label>
            <select id="estado" name="estado" className={styles.select} defaultValue={filtros.estado}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {NOMBRE_ESTADO[e]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="categoria">
              Categoría
            </label>
            <select id="categoria" name="categoria" className={styles.select} defaultValue={filtros.categoria}>
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={styles.boton}>
            Filtrar
          </button>
        </div>
        <div className={styles.accesos}>
          <label className={styles.check}>
            <input type="checkbox" name="mios" value="1" defaultChecked={filtros.soloMios} />
            Solo los míos
          </label>
          {hayFiltros ? (
            <Link href={base} className="enlace" style={{ fontSize: "0.875rem" }}>
              Limpiar filtros
            </Link>
          ) : null}
        </div>
      </form>

      <p className={styles.ayuda} role="status">
        {resultado.total} {resultado.total === 1 ? "resultado" : "resultados"}
        {paginas > 1 ? ` · página ${filtros.pagina} de ${paginas}` : ""}
      </p>

      <ListaContenidos
        tipo={tipo}
        filas={resultado.filas}
        vacio={hayFiltros ? "No hay resultados con esos filtros." : tipo === "nota" ? "Todavía no hay noticias." : "Todavía no hay fragmentos."}
        rol={perfil.rol}
        usuarioId={perfil.id}
      />

      {paginas > 1 ? (
        <nav className={styles.paginacion} aria-label="Páginas">
          {filtros.pagina > 1 ? <Link href={enlacePagina(filtros.pagina - 1)}>← Anterior</Link> : <span />}
          {filtros.pagina < paginas ? <Link href={enlacePagina(filtros.pagina + 1)}>Siguiente →</Link> : <span />}
        </nav>
      ) : null}
    </>
  );
}
