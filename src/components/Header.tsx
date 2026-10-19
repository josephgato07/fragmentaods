import Link from "next/link";
import type { Section } from "@/lib/content";
import { paths } from "@/lib/format";
import styles from "./Header.module.css";
import { SearchIcon } from "./Icons";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";

export function Header({ sections }: { sections: Section[] }) {
  return (
    <>
      <div className={styles.strip}>
        <div className={`contenedor ${styles.stripInner}`}>
          <span>
            <strong>Edición demo.</strong> Contenidos de muestra tomados del kit; fechas y horas de ejemplo.
          </span>
          <span className={styles.stripCity}>Montevideo · Uruguay</span>
        </div>
      </div>

      <header className={styles.header}>
        <div className={`contenedor ${styles.bar}`}>
          <Logo />

          <nav className={styles.desktopNav} aria-label="Secciones">
            <NavLinks sections={sections} variant="bar" />
          </nav>

          <div className={styles.actions}>
            <form className={styles.search} action={paths.search()} role="search">
              <label htmlFor="buscar-header" className="solo-lectores">
                Buscar en FRAGMENTADOS
              </label>
              <SearchIcon />
              <input id="buscar-header" name="q" type="search" placeholder="Buscar" autoComplete="off" />
            </form>
            <Link href={paths.search()} className={styles.iconLink} aria-label="Buscar">
              <SearchIcon />
            </Link>
            <MobileMenu sections={sections} />
          </div>
        </div>
        <div className={styles.rule} />
      </header>

      <nav className={styles.chips} aria-label="Secciones (acceso rápido)">
        <div className={`contenedor ${styles.chipsInner}`}>
          <NavLinks sections={sections} variant="chips" />
        </div>
      </nav>
    </>
  );
}
