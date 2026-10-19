import Link from "next/link";
import { FragmentCard } from "@/components/Fragments";
import { ArrowLeft, ArrowRight } from "@/components/Icons";
import { FragBadge } from "@/components/Logo";
import { KeywordBar, ModuleHeader, Tag } from "@/components/Meta";
import { Photo } from "@/components/Photo";
import { RichText } from "@/components/RichText";
import { ShareButtons } from "@/components/ShareButtons";
import type { Article, Fragment, Section } from "@/lib/content/types";
import { formatDate, formatTime, paths } from "@/lib/format";
import styles from "./FragmentView.module.css";

/**
 * Fragmento. Lo usan la página pública /fragmento/[slug] y la vista previa privada del panel.
 */
export function FragmentView({
  fragment,
  section,
  article,
  adjacent,
  more,
  sections,
  preview = false,
}: {
  fragment: Fragment;
  section: Section | null;
  article: Article | null;
  adjacent: { newer: Fragment | null; older: Fragment | null };
  more: Fragment[];
  sections: Section[];
  preview?: boolean;
}) {
  const sectionOf = (s: string) => sections.find((x) => x.slug === s);

  return (
    <>
      <article className={`contenedor ${styles.fragment}`}>
        <div className={styles.meta}>
          <Link href={paths.fragments()} className={styles.kind}>
            Fragmento
          </Link>
          {section ? <Tag href={paths.section(section.slug)}>{section.name}</Tag> : null}
          <time dateTime={fragment.publishedAt} className={styles.when}>
            {fragment.place} · {formatDate(fragment.publishedAt)} · <strong>{formatTime(fragment.publishedAt)}</strong>
          </time>
          {fragment.isDemo ? <span className={styles.demo}>Contenido de muestra</span> : null}
        </div>

        <h1 className={styles.keyword}>{fragment.keyword}</h1>
        <KeywordBar />

        <div className={styles.body}>
          {fragment.body.map((paragraph, i) => (
            <p key={i}>
              <RichText content={paragraph} />
            </p>
          ))}
        </div>

        {fragment.image ? (
          <Photo
            image={fragment.image}
            ratio={fragment.image.fit === "contain" ? "auto" : "3/2"}
            sizes="(min-width: 800px) 760px, 100vw"
            withCaption
          />
        ) : null}

        <div className={styles.source}>
          <span>{fragment.sources.length > 1 ? "Fuentes:" : "Fuente:"}</span>{" "}
          {fragment.sources.length > 0 ? (
            <ul className={styles.sourceList}>
              {fragment.sources.map((s) => (
                <li key={s.label}>
                  {s.url ? (
                    <a href={s.url} className="enlace" target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <em>{fragment.isDemo ? "pendiente de carga en esta versión de muestra" : "no indicada"}</em>
          )}
        </div>

        {article ? (
          <Link href={paths.article(article.slug)} className={styles.fullStory}>
            <span className={styles.fullLabel}>Leer la nota completa</span>
            <span className={styles.fullTitle}>
              <span className="titular-enlace">{article.title}</span>
            </span>
            <ArrowRight size={22} />
          </Link>
        ) : null}

        <div className={styles.end}>
          {preview ? (
            <p className={styles.source}>Vista previa: los botones para compartir aparecen al publicar.</p>
          ) : (
            <ShareButtons path={paths.fragment(fragment.slug)} title={`${fragment.keyword} · FRAGMENTADOS`} />
          )}
          <span className={styles.endMark}>
            <FragBadge size="md" />
            <span className="solo-lectores">Fin del fragmento</span>
          </span>
        </div>

        <nav className={styles.pager} aria-label="Otros fragmentos">
          {adjacent.newer ? (
            <Link href={paths.fragment(adjacent.newer.slug)} className={styles.pagerLink} rel="prev">
              <span className={styles.pagerDir}>
                <ArrowLeft size={16} /> Más reciente
              </span>
              <span className={styles.pagerKeyword}>{adjacent.newer.keyword}</span>
            </Link>
          ) : (
            <span />
          )}
          {adjacent.older ? (
            <Link href={paths.fragment(adjacent.older.slug)} className={`${styles.pagerLink} ${styles.pagerNext}`} rel="next">
              <span className={styles.pagerDir}>
                Anterior <ArrowRight size={16} />
              </span>
              <span className={styles.pagerKeyword}>{adjacent.older.keyword}</span>
            </Link>
          ) : null}
        </nav>
      </article>

      {more.length > 0 ? (
        <section className={`contenedor ${styles.more}`} aria-labelledby="mas-fragmentos">
          <ModuleHeader id="mas-fragmentos" title="Más fragmentos" href={paths.fragments()} linkLabel="Ver todos" />
          <div className={styles.moreGrid}>
            {more.map((f) => (
              <FragmentCard key={f.slug} fragment={f} section={sectionOf(f.section)} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );

}
