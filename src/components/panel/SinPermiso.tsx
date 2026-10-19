import Link from "next/link";
import styles from "./panel.module.css";

export function SinPermiso({ texto = "Tu rol no tiene acceso a esta sección." }: { texto?: string }) {
  return (
    <div className={styles.sinPermiso}>
      <h1 className={styles.titulo}>Sin acceso</h1>
      <p className={styles.aviso}>{texto}</p>
      <Link href="/panel" className="enlace">
        Volver al inicio del panel
      </Link>
    </div>
  );
}
