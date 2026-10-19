"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Fragment } from "@/lib/content";
import { inlineToText } from "@/lib/content/search";
import { paths } from "@/lib/format";
import { FragmentStamp } from "./Fragments";
import { ArrowLeft, ArrowRight } from "./Icons";
import { KeywordBar } from "./Meta";
import styles from "./FragmentRail.module.css";

/**
 * Banda negra "Últimos fragmentos" (decisión 5).
 * - Celular: la tarjeta siguiente asoma por el borde, hay una indicación "Deslizá" y una barra de avance.
 * - Teclado: la lista es una región enfocable; las flechas ← → avanzan de a una tarjeta,
 *   Inicio/Fin van a los extremos, y Tab recorre los enlaces (el navegador los trae a la vista).
 * - Botones anterior/siguiente en todos los tamaños.
 */
export function FragmentRail({ fragments }: { fragments: Fragment[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState({ from: 1, to: 1 });
  const titleId = useId();
  const listId = useId();
  const helpId = useId();

  const behavior = (): ScrollBehavior =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  const update = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
    setProgress(max > 0 ? el.scrollLeft / max : 1);

    const box = el.getBoundingClientRect();
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
    const shown = cards
      .map((c, i) => {
        const r = c.getBoundingClientRect();
        const overlap = Math.min(r.right, box.right) - Math.max(r.left, box.left);
        return overlap >= r.width * 0.6 ? i + 1 : 0;
      })
      .filter(Boolean);
    if (shown.length) setVisible({ from: shown[0], to: shown[shown.length - 1] });
  }, []);

  useEffect(() => {
    update();
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const step = () => {
    const el = viewportRef.current;
    const card = el?.querySelector<HTMLElement>("[data-card]");
    if (!el || !card) return 0;
    const gap = parseFloat(getComputedStyle(card.parentElement!).columnGap || "0");
    return card.getBoundingClientRect().width + gap;
  };

  const scrollByCards = (direction: 1 | -1) => {
    viewportRef.current?.scrollBy({ left: direction * step(), behavior: behavior() });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByCards(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByCards(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      el.scrollTo({ left: 0, behavior: behavior() });
    } else if (event.key === "End") {
      event.preventDefault();
      el.scrollTo({ left: el.scrollWidth, behavior: behavior() });
    }
  };

  return (
    <section className={styles.band} aria-labelledby={titleId}>
      <div className={`contenedor ${styles.head}`}>
        <h2 id={titleId} className={styles.title}>
          <span className={styles.dot} aria-hidden="true" />
          Últimos fragmentos
        </h2>
        <div className={styles.controls}>
          <Link href={paths.fragments()} className={styles.all}>
            Ver todos
          </Link>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => scrollByCards(-1)}
            disabled={atStart}
            aria-controls={listId}
          >
            <ArrowLeft />
            <span className="solo-lectores">Fragmentos anteriores</span>
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => scrollByCards(1)}
            disabled={atEnd}
            aria-controls={listId}
          >
            <ArrowRight />
            <span className="solo-lectores">Fragmentos siguientes</span>
          </button>
        </div>
      </div>

      <div className={styles.viewportWrap} data-at-end={atEnd}>
        <div
          ref={viewportRef}
          className={styles.viewport}
          role="region"
          aria-roledescription="carrusel"
          aria-label="Lista de últimos fragmentos"
          aria-describedby={helpId}
          tabIndex={0}
          onScroll={update}
          onKeyDown={onKeyDown}
        >
          <ol id={listId} className={styles.track}>
            {fragments.map((fragment, i) => (
              <li key={fragment.slug} data-card className={styles.card}>
                <Link
                  href={paths.fragment(fragment.slug)}
                  className={styles.cardLink}
                  aria-label={`${fragment.keyword}. Fragmento ${i + 1} de ${fragments.length}`}
                >
                  <FragmentStamp fragment={fragment} tone="inverse" />
                  <h3 className={styles.keyword}>{fragment.keyword}</h3>
                  <KeywordBar tone="crema" />
                  <p className={styles.excerpt}>{inlineToText(fragment.body[0])}</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className={`contenedor ${styles.foot}`}>
        <div className={styles.progress} aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.max(progress, 0.08)})` }} />
        </div>
        <p id={helpId} className={styles.help}>
          <span className={styles.helpTouch}>Deslizá para ver más</span>
          <span className={styles.helpKeys}>Usá las flechas ← → para recorrer</span>
          <span aria-live="polite" className={styles.count}>
            {visible.from === visible.to ? visible.from : `${visible.from}–${visible.to}`} de {fragments.length}
          </span>
        </p>
      </div>
    </section>
  );
}
