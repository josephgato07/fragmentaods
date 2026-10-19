"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Section } from "@/lib/content";
import { paths } from "@/lib/format";
import { CloseIcon, MenuIcon, SearchIcon } from "./Icons";
import { FragBadge } from "./Logo";
import styles from "./MobileMenu.module.css";
import { NavLinks } from "./NavLinks";

/**
 * Menú de celular y tablet.
 * Diálogo modal: atrapa el foco, se cierra con Escape, al tocar un enlace o al cambiar de página,
 * y devuelve el foco al botón que lo abrió.
 */
export function MobileMenu({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Cerrar al navegar (sin mover el foco: la nueva página ya lo gestiona).
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    searchRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  const onPanelClick = (event: React.MouseEvent) => {
    // Un enlace a la página actual no cambia la ruta: cerrar igual.
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
        <span className="solo-lectores">Abrir menú</span>
      </button>

      <div
        ref={panelRef}
        id={panelId}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        hidden={!open}
        onClick={onPanelClick}
      >
        <div className={`contenedor ${styles.top}`}>
          <span className={styles.brand}>
            <FragBadge size="sm" />
            <span id={titleId}>Menú</span>
          </span>
          <button type="button" className={styles.trigger} onClick={close}>
            <CloseIcon />
            <span className="solo-lectores">Cerrar menú</span>
          </button>
        </div>

        <div className={`contenedor ${styles.body}`}>
          <form action={paths.search()} role="search" className={styles.search}>
            <label htmlFor={`${panelId}-q`} className={styles.searchLabel}>
              Buscar notas y fragmentos
            </label>
            <div className={styles.searchRow}>
              <SearchIcon />
              <input ref={searchRef} id={`${panelId}-q`} name="q" type="search" autoComplete="off" />
              <button type="submit">Buscar</button>
            </div>
          </form>

          <nav aria-label="Secciones">
            <NavLinks sections={sections} variant="menu" />
          </nav>
        </div>
      </div>
    </>
  );
}
