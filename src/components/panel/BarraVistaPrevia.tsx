import Link from "next/link";
import { formatearFechaHora } from "@/lib/panel/fechas";
import { estadoVisible, NOMBRE_ESTADO } from "@/lib/panel/reglas";
import type { Estado } from "@/lib/panel/tipos";
import styles from "./panel.module.css";

export function BarraVistaPrevia({
  estado,
  publicadoEn,
  editar,
  publica,
}: {
  estado: Estado;
  publicadoEn: string | null;
  editar: string;
  publica: string | null;
}) {
  const visible = estadoVisible(estado, publicadoEn);
  return (
    <div className={styles.previa} role="note">
      <div className={`contenedor ${styles.previaInner}`}>
        <span>
          <strong>Vista previa privada</strong> · {NOMBRE_ESTADO[visible]}
          {visible === "programado" ? ` · se publica ${formatearFechaHora(publicadoEn)}` : ""}
          {visible !== "publicado" ? " · no visible en el portal" : ""}
        </span>
        <span style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href={editar} style={{ color: "var(--color-menta)", textDecoration: "underline" }}>
            Volver a editar
          </Link>
          {publica ? (
            <a href={publica} style={{ color: "var(--color-menta)", textDecoration: "underline" }}>
              Ver la versión pública
            </a>
          ) : null}
        </span>
      </div>
    </div>
  );
}
