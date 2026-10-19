import Link from "next/link";
import type { Fragment, Section } from "@/lib/content";
import { formatShortDate, formatTime, paths } from "@/lib/format";
import styles from "./Fragments.module.css";
import { Kicker, KeywordBar } from "./Meta";
import { RichText } from "./RichText";

/** Hora y fecha corta de un fragmento: "14:32 · 9 oct." */
export function FragmentStamp({ fragment, tone = "default" }: { fragment: Fragment; tone?: "default" | "inverse" }) {
  return (
    <time dateTime={fragment.publishedAt} className={`${styles.stamp} ${tone === "inverse" ? styles.stampInverse : ""}`}>
      <strong>{formatTime(fragment.publishedAt)}</strong> · {formatShortDate(fragment.publishedAt)}
    </time>
  );
}

/** Fragmento en listados: palabra clave, barra, primer párrafo. Toda la pieza enlaza a su página. */
export function FragmentCard({
  fragment,
  section,
  headingLevel = "h3",
}: {
  fragment: Fragment;
  section?: Section;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <article className={styles.card}>
      <div className={styles.cardMeta}>
        <FragmentStamp fragment={fragment} />
        {section ? <Kicker>{section.name}</Kicker> : null}
      </div>
      <Link href={paths.fragment(fragment.slug)} className={styles.cardLink}>
        <Heading className={styles.cardKeyword}>
          <span className="titular-enlace">{fragment.keyword}</span>
        </Heading>
        <KeywordBar />
        <p className={styles.cardText}>
          <RichText content={fragment.body[0]} />
        </p>
      </Link>
    </article>
  );
}

/** Fragmento compacto, para listas laterales. */
export function FragmentListItem({ fragment }: { fragment: Fragment }) {
  return (
    <li className={styles.item}>
      <Link href={paths.fragment(fragment.slug)} className={styles.itemLink}>
        <FragmentStamp fragment={fragment} />
        <span className={styles.itemKeyword}>
          <span className="titular-enlace">{fragment.keyword}</span>
        </span>
      </Link>
    </li>
  );
}
