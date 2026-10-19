import Link from "next/link";
import { FragmentListItem } from "@/components/Fragments";
import { FragBadge } from "@/components/Logo";
import { Dateline, ModuleHeader, Tag } from "@/components/Meta";
import { Photo } from "@/components/Photo";
import { RichText } from "@/components/RichText";
import { ShareButtons } from "@/components/ShareButtons";
import { StoryCard } from "@/components/Stories";
import type { Article, Fragment, Section } from "@/lib/content/types";
import { formatTime, paths } from "@/lib/format";
import styles from "./ArticleView.module.css";

/**
 * Nota completa. La usan la página pública /nota/[slug] y la vista previa privada del panel.
 */
export function ArticleView({
  article,
  section,
  related,
  linkedFragments,
  latestFragments,
  preview = false,
}: {
  article: Article;
  section: Section | null;
  related: Article[];
  linkedFragments: Fragment[];
  latestFragments: Fragment[];
  preview?: boolean;
}) {
  const asideFragments = linkedFragments.length > 0 ? linkedFragments : latestFragments.slice(0, 5);

  return (
    <article className={styles.article}>
      <header className={`contenedor ${styles.header}`}>
        <div className={styles.topMeta}>
          <Tag href={paths.section(article.section)}>{article.label}</Tag>
          {section && section.name !== article.label ? (
            <Link href={paths.section(section.slug)} className={styles.sectionLink}>
              {section.name}
            </Link>
          ) : null}
          {article.isDemo ? <span className={styles.demo}>Contenido de muestra</span> : null}
        </div>
        <h1 className={styles.title}>{article.title}</h1>
        {article.deck ? <p className={styles.deck}>{article.deck}</p> : null}
        <div className={styles.byline}>
          <p>
            Por <strong>{article.author}</strong>
          </p>
          <Dateline place={article.place} publishedAt={article.publishedAt} withTime rule />
        </div>
      </header>

      <div className={`contenedor ${styles.lead}`}>
        <Photo
          image={article.image}
          ratio={article.image.fit === "contain" ? "auto" : "16/9"}
          mobileRatio={article.image.fit === "contain" ? "auto" : "4/5"}
          sizes="(min-width: 1320px) 1224px, 100vw"
          priority
          withCaption
        />
      </div>

      <div className={`contenedor ${styles.layout}`}>
        <div className={styles.body}>
          {article.body.map((block, i) => {
            if (block.type === "parrafo") {
              return (
                <p key={i} className={styles.paragraph}>
                  <RichText content={block.content} />
                </p>
              );
            }
            if (block.type === "imagen") {
              return (
                <Photo
                  key={i}
                  image={block.image}
                  ratio={block.image.fit === "contain" ? "auto" : "3/2"}
                  sizes="(min-width: 1024px) 680px, 100vw"
                  withCaption
                  className={styles.inlinePhoto}
                />
              );
            }
            return (
              <p key={i} className={styles.pending} role="note">
                <strong>Texto pendiente.</strong> {block.note}
              </p>
            );
          })}

          <section className={styles.sources} aria-labelledby="fuentes">
            <h2 id="fuentes">Fuentes</h2>
            {article.sources.length > 0 ? (
              <ul>
                {article.sources.map((s) => (
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
              <p className={styles.noSources}>
                {article.isDemo ? "Fuentes pendientes de carga en esta versión de muestra." : "Esta nota no indica fuentes."}
              </p>
            )}
          </section>

          <div className={styles.end}>
            {preview ? (
              <p className={styles.noSources}>Vista previa: los botones para compartir aparecen al publicar.</p>
            ) : (
              <ShareButtons path={paths.article(article.slug)} title={article.title} />
            )}
            <span className={styles.endMark}>
              <FragBadge size="md" />
              <span className="solo-lectores">Fin de la nota</span>
            </span>
          </div>
        </div>

        <aside className={styles.aside} aria-labelledby="aside-fragmentos">
          <div className={styles.asideInner}>
            <h2 id="aside-fragmentos" className={styles.asideTitle}>
              {linkedFragments.length > 0 ? "Fragmentos de esta nota" : "Últimos fragmentos"}
            </h2>
            <ul>
              {asideFragments.map((f) => (
                <FragmentListItem key={f.slug} fragment={f} />
              ))}
            </ul>
            <Link href={paths.fragments()} className="enlace">
              Ver todos los fragmentos
            </Link>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className={`contenedor ${styles.related}`} aria-labelledby="relacionadas">
          <ModuleHeader id="relacionadas" title="Notas relacionadas" />
          <div className={styles.relatedGrid}>
            {related.map((a) => (
              <StoryCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="solo-lectores">Publicado a las {formatTime(article.publishedAt)}.</p>
    </article>
  );

}
