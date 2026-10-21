import Link from "next/link";
import type { FilaListado } from "@/lib/panel/datos";
import { formatearFechaHora } from "@/lib/panel/fechas";
import { accionesPermitidas, estadoVisible } from "@/lib/panel/reglas";
import type { Rol } from "@/lib/panel/tipos";
import { BotonEliminar } from "./BotonEliminar";
import { EstadoChip } from "./EstadoChip";
import styles from "./panel.module.css";

/** Listado de noticias o fragmentos con estado, autor, fechas y accesos. */
export function ListaContenidos({
  tipo,
  filas,
  vacio,
  rol,
  usuarioId,
}: {
  tipo: "nota" | "fragmento";
  filas: FilaListado[];
  vacio: string;
  rol: Rol;
  usuarioId: string;
}) {
  if (filas.length === 0) return <p className={styles.vacio}>{vacio}</p>;
  const ahora = new Date();
  const base = tipo === "nota" ? "/panel/notas" : "/panel/fragmentos";
  const publica = tipo === "nota" ? "/nota" : "/fragmento";

  return (
    <ul className={styles.lista}>
      {filas.map((f) => {
        const puedeEditar =
          accionesPermitidas(rol, { estado: f.estado, publicadoEn: f.publicadoEn, esPropio: f.autorId === usuarioId, esNuevo: false }, ahora).length >
          0;
        const visible = estadoVisible(f.estado, f.publicadoEn, ahora);
        return (
          <li key={f.id} className={styles.fila}>
            <h3 className={styles.filaTitulo}>
              <Link href={`${base}/${f.id}`}>{f.titulo || "(sin título)"}</Link>
            </h3>
            <div className={styles.filaMeta}>
              <EstadoChip estado={f.estado} publicadoEn={f.publicadoEn} ahora={ahora} />
              <span>{tipo === "nota" ? "Noticia" : "Fragmento"}</span>
              <span>{f.categoria}</span>
              <span>Autor: {f.autor}</span>
              <span>
                {visible === "programado"
                  ? `Se publica ${formatearFechaHora(f.publicadoEn)}`
                  : visible === "publicado"
                    ? `Publicado ${formatearFechaHora(f.publicadoEn)}`
                    : `Editado ${formatearFechaHora(f.actualizadoEn)}`}
              </span>
            </div>
            <div className={styles.filaAcciones}>
              <Link href={`${base}/${f.id}`} className={`${styles.boton} ${styles.botonChico}`}>
                {puedeEditar ? "Editar" : "Ver"}
              </Link>
              <Link
                href={`/panel/vista-previa/${tipo === "nota" ? "nota" : "fragmento"}/${f.id}`}
                className={`${styles.botonSecundario} ${styles.botonChico}`}
                target="_blank"
              >
                Vista previa
              </Link>
              {visible === "publicado" ? (
                <a href={`${publica}/${f.slug}`} className={`${styles.botonSecundario} ${styles.botonChico}`} target="_blank" rel="noopener">
                  En el portal
                </a>
              ) : null}
              {rol === "administrador" ? <BotonEliminar tipo={tipo} id={f.id} titulo={f.titulo} /> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
