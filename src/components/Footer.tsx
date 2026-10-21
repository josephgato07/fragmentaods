import Link from "next/link";
import type { Section } from "@/lib/content";
import { paths } from "@/lib/format";
import styles from "./Footer.module.css";
import { Logo } from "./Logo";

export function Footer({ sections }: { sections: Section[] }) {
  return (
    <footer className={styles.footer}>
      <div className={`contenedor ${styles.inner}`}>
        <div className={styles.brand}>
          <Logo size="sm" />
          <p>Portal periodístico digital. Noticias completas y fragmentos informativos breves.</p>
        </div>

        <nav aria-label="Secciones (pie de página)">
          <ul className={styles.links}>
            {sections.map((s) => (
              <li key={s.slug}>
                <Link href={paths.section(s.slug)}>{s.name}</Link>
              </li>
            ))}
            <li>
              <Link href={paths.fragments()}>Fragmentos</Link>
            </li>
            <li>
              <Link href={paths.search()}>Buscar</Link>
            </li>
          </ul>
        </nav>


      </div>
    </footer>
  );
}
