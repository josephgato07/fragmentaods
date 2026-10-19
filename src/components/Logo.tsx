import Link from "next/link";
import styles from "./Logo.module.css";

/** Firma circular FRAG del kit. Decorativa: el nombre accesible lo da el contexto. */
export function FragBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`${styles.badge} ${styles[size]}`} aria-hidden="true">
      FRAG
    </span>
  );
}

/** Logotipo provisional: firma FRAG + FRAGMENTADOS en Barlow Condensed Bold Italic. */
export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Link href="/" className={`${styles.logo} ${styles[`logo_${size}`]}`} aria-label="FRAGMENTADOS, ir a la portada">
      <FragBadge size={size === "sm" ? "sm" : "md"} />
      <span className={styles.wordmark} aria-hidden="true">
        Fragmentados
      </span>
    </Link>
  );
}

/** Firma FRAG blanca con subrayado menta, para usar sobre fotos oscuras. */
export function FragOnPhoto() {
  return (
    <span className={styles.onPhoto} aria-hidden="true">
      FRAG
    </span>
  );
}
