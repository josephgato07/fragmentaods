import Link from "next/link";
import { formatDate, formatTime } from "@/lib/format";
import styles from "./Meta.module.css";

/** Etiqueta verde de categoría. Texto negro sobre menta (decisión 1). */
export function Tag({ children, href }: { children: React.ReactNode; href?: string }) {
  if (href) {
    return (
      <Link href={href} className={styles.tag}>
        {children}
      </Link>
    );
  }
  return <span className={styles.tag}>{children}</span>;
}

/** Antetítulo en menta tinta, para cuando no hay foto donde apoyar la etiqueta. */
export function Kicker({ children }: { children: React.ReactNode }) {
  return <span className={styles.kicker}>{children}</span>;
}

/** "Lugar · fecha", con hora opcional y línea menta del kit. */
export function Dateline({
  place,
  publishedAt,
  withTime = false,
  rule = false,
  tone = "default",
}: {
  place: string;
  publishedAt: string;
  withTime?: boolean;
  rule?: boolean;
  tone?: "default" | "inverse";
}) {
  return (
    <div className={`${styles.dateline} ${tone === "inverse" ? styles.inverse : ""}`}>
      <p>
        <span>{place}</span>
        <span aria-hidden="true"> · </span>
        <time dateTime={publishedAt}>
          {formatDate(publishedAt)}
          {withTime ? ` · ${formatTime(publishedAt)}` : null}
        </time>
      </p>
      {rule ? <span className={styles.rule} aria-hidden="true" /> : null}
    </div>
  );
}

/** Rótulo de módulo: título grande, regla negra y enlace opcional. */
export function ModuleHeader({
  title,
  href,
  linkLabel = "Ver todo",
  as: Heading = "h2",
  id,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  as?: "h1" | "h2";
  id?: string;
}) {
  return (
    <div className={styles.moduleHeader}>
      <Heading id={id} className={styles.moduleTitle}>
        {title}
      </Heading>
      {href ? (
        <Link href={href} className="enlace">
          {linkLabel}
          <span className="solo-lectores">: {title}</span>
        </Link>
      ) : null}
    </div>
  );
}

/** Barra negra corta del kit, debajo de las palabras clave. */
export function KeywordBar({ tone = "negro" }: { tone?: "negro" | "crema" | "menta" }) {
  return <span className={`${styles.bar} ${styles[`bar_${tone}`]}`} aria-hidden="true" />;
}
