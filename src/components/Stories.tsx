import Link from "next/link";
import type { Article } from "@/lib/content";
import { paths } from "@/lib/format";
import { Dateline, Kicker, Tag } from "./Meta";
import { Photo } from "./Photo";
import styles from "./Stories.module.css";

/** Apertura de portada: foto horizontal y titular compacto completo. */
export function HeroStory({ article }: { article: Article }) {
  return (
    <article className={styles.hero}>
      <Link href={paths.article(article.slug)} className={styles.heroLink}>
        <Photo
          image={article.image}
          ratio="16/9"
          sizes="(min-width: 1416px) 666px, (min-width: 1024px) 50vw, 100vw"
          priority
          overlay={<Tag>{article.label}</Tag>}
        />
        <h2 className={styles.heroTitle}>
          <span className="titular-enlace">{article.title}</span>
        </h2>
      </Link>
      {article.deck ? <p className={styles.deck}>{article.deck}</p> : null}
      <Dateline place={article.place} publishedAt={article.publishedAt} rule />
    </article>
  );
}

/** Nota secundaria: foto 3:2 con etiqueta, titular H2 en grafito y fecha. */
export function StoryCard({
  article,
  headingLevel = "h3",
  sizes = "(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw",
}: {
  article: Article;
  headingLevel?: "h2" | "h3";
  sizes?: string;
}) {
  const Heading = headingLevel;
  return (
    <article className={styles.card}>
      <Link href={paths.article(article.slug)} className={styles.cardLink}>
        <Photo image={article.image} ratio="3/2" sizes={sizes} overlay={<Tag>{article.label}</Tag>} />
        <Heading className={styles.cardTitle}>
          <span className="titular-enlace">{article.title}</span>
        </Heading>
      </Link>
      <Dateline place={article.place} publishedAt={article.publishedAt} />
    </article>
  );
}

/** Nota en columna lateral: texto a la izquierda, miniatura cuadrada a la derecha. */
export function SideStory({ article }: { article: Article }) {
  return (
    <article className={styles.side}>
      <Link href={paths.article(article.slug)} className={styles.sideLink}>
        <div className={styles.sideText}>
          <Kicker>{article.label}</Kicker>
          <h3 className={styles.sideTitle}>
            <span className="titular-enlace">{article.title}</span>
          </h3>
        </div>
        <Photo image={article.image} ratio="1/1" sizes="128px" className={styles.sideThumb} />
      </Link>
      <Dateline place={article.place} publishedAt={article.publishedAt} />
    </article>
  );
}

/** Titular sin foto, para listas separadas por líneas finas. */
export function ListStory({ article, showLabel = true }: { article: Article; showLabel?: boolean }) {
  return (
    <article className={styles.list}>
      <Link href={paths.article(article.slug)} className={styles.listLink}>
        {showLabel ? <Kicker>Nota · {article.label}</Kicker> : null}
        <h3 className={styles.listTitle}>
          <span className="titular-enlace">{article.title}</span>
        </h3>
      </Link>
      <Dateline place={article.place} publishedAt={article.publishedAt} />
    </article>
  );
}
