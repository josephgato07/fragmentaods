import styles from "../estados.module.css";

/** Se muestra mientras se consultan los resultados de búsqueda. (Las demás páginas salen de la caché.) */
export default function Loading() {
  return (
    <div className={`contenedor ${styles.loading}`} role="status" aria-live="polite">
      <span className="solo-lectores">Cargando contenidos…</span>
      <div className={styles.skeletonPhoto} aria-hidden="true" />
      <div className={styles.skeletonTitle} aria-hidden="true" />
      <div className={styles.skeletonTitleShort} aria-hidden="true" />
      <div className={styles.skeletonLine} aria-hidden="true" />
    </div>
  );
}
