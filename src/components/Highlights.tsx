import Link from "next/link";
import { paths } from "@/lib/format";
import type { Highlight } from "@/lib/content";
import styles from "./Highlights.module.css";
import { FragOnPhoto } from "./Logo";
import { KeywordBar } from "./Meta";
import { Photo } from "./Photo";

/** Destacados de portada: cifra, cita y fotografía de impacto (formatos del kit). */
export function Highlights({ items }: { items: Highlight[] }) {
  if (items.length === 0) return null;
  return (
    <section className={styles.wrap} aria-labelledby="destacados">
      <h2 id="destacados" className="solo-lectores">
        Destacados
      </h2>
      <div className={styles.grid}>
        {items.map((item) => {
          if (item.type === "cifra") return <FigureHighlight key={item.id} item={item} />;
          if (item.type === "cita") return <QuoteHighlight key={item.id} item={item} />;
          return <PhotoHighlight key={item.id} item={item} />;
        })}
      </div>
    </section>
  );
}

function EnlaceNota({ slug }: { slug?: string | null }) {
  return slug ? <Link href={paths.article(slug)} className="enlace">Leer noticia →</Link> : null;
}

function FigureHighlight({ item }: { item: Extract<Highlight, { type: "cifra" }> }) {
  return (
    <figure className={`${styles.cell} ${styles.figure}`}>
      <p className={styles.value}>{item.value}</p>
      <figcaption>
        <p className={styles.figureText}>{item.text}</p>
        <p className={styles.source}>Fuente: {item.source?.label ?? "pendiente de carga"}</p>
        <EnlaceNota slug={item.articleSlug} />
      </figcaption>
    </figure>
  );
}

function QuoteHighlight({ item }: { item: Extract<Highlight, { type: "cita" }> }) {
  return (
    <figure className={`${styles.cell} ${styles.quote}`}>
      {item.image ? (
        <Photo image={item.image} ratio="3/2" sizes="(min-width: 1024px) 30vw, 100vw" className={styles.quotePhoto} />
      ) : null}
      <blockquote className={styles.quoteText}>
        <p>“{item.quote}”</p>
      </blockquote>
      <span className={styles.quoteRule} aria-hidden="true" />
      <figcaption className={styles.attribution}>{item.attribution ?? "Atribución pendiente de carga"}</figcaption>
      <EnlaceNota slug={item.articleSlug} />
    </figure>
  );
}

function PhotoHighlight({ item }: { item: Extract<Highlight, { type: "foto" }> }) {
  return (
    <figure className={`${styles.cell} ${styles.impact}`}>
      <Photo image={item.image} ratio="auto" sizes="(min-width: 1024px) 34vw, 100vw" className={styles.impactPhoto} />
      <div className={styles.impactText}>
        <p className={styles.impactTitle}>
          {item.title}
          {item.accent ? <span>{item.accent}</span> : null}
        </p>
        <EnlaceNota slug={item.articleSlug} />
        <KeywordBar tone="menta" />
        <div className={styles.impactFoot}>
          {item.caption ? <figcaption>{item.caption}</figcaption> : null}
          <FragOnPhoto />
        </div>
      </div>
    </figure>
  );
}
