import type { Metadata } from "next";
import Link from "next/link";
import { FragmentCard } from "@/components/Fragments";
import { SearchIcon } from "@/components/Icons";
import { Dateline, Kicker, ModuleHeader } from "@/components/Meta";
import { Photo } from "@/components/Photo";
import { content } from "@/lib/content";
import { paths } from "@/lib/format";
import styles from "./page.module.css";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

const SUGERENCIAS = ["pobreza", "viáticos", "vivienda", "puente", "JUTEP"];

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim();
  return { robots: { index: false, follow: true }, title: query ? `Resultados para «${query}»` : "Buscar" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const raw = (Array.isArray(q) ? q[0] : q) ?? "";
  const [results, sections] = await Promise.all([content.search(raw), content.getSections()]);
  const query = results.query;
  const total = results.articles.length + results.fragments.length;
  const sectionOf = (slug: string) => sections.find((s) => s.slug === slug);

  return (
    <div className={`contenedor ${styles.page}`}>
      <h1 className={styles.title}>Buscar</h1>

      <form action={paths.search()} role="search" className={styles.form}>
        <label htmlFor="buscar-pagina" className={styles.label}>
          Buscá en notas y fragmentos
        </label>
        <div className={styles.row}>
          <SearchIcon size={20} />
          <input
            id="buscar-pagina"
            name="q"
            type="search"
            defaultValue={query}
            autoComplete="off"
            autoFocus={!query}
            placeholder="Por ejemplo: pobreza"
          />
          <button type="submit">Buscar</button>
        </div>
      </form>

      {!query ? (
        <div className={styles.state}>
          <p>Escribí una o más palabras. Se buscan en titulares, bajadas, textos y palabras clave.</p>
          <Suggestions />
        </div>
      ) : total === 0 ? (
        <div className={styles.state} role="status">
          <p className={styles.emptyTitle}>No encontramos resultados para «{query}».</p>
          <ul className={styles.tips}>
            <li>Revisá la ortografía o probá con menos palabras.</li>
            <li>Usá términos más generales, como el nombre de una institución o un tema.</li>
          </ul>
          <Suggestions />
          <p className={styles.browse}>
            También podés recorrer las secciones:{" "}
            {sections.map((s, i) => (
              <span key={s.slug}>
                <Link href={paths.section(s.slug)} className="enlace">
                  {s.name}
                </Link>
                {i < sections.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </div>
      ) : (
        <>
          <p className={styles.summary} role="status">
            {total} {total === 1 ? "resultado" : "resultados"} para «{query}»
          </p>

          {results.articles.length > 0 ? (
            <section aria-labelledby="res-notas" className={styles.block}>
              <ModuleHeader id="res-notas" title={`Noticias (${results.articles.length})`} />
              <ul className={styles.articleList}>
                {results.articles.map((a) => (
                  <li key={a.slug}>
                    <article className={styles.result}>
                      <Link href={paths.article(a.slug)} className={styles.resultLink}>
                        <div className={styles.resultText}>
                          <Kicker>{a.label}</Kicker>
                          <h2 className={styles.resultTitle}>
                            <span className="titular-enlace">{a.title}</span>
                          </h2>
                          {a.deck ? <p className={styles.resultDeck}>{a.deck}</p> : null}
                        </div>
                        <Photo image={a.image} ratio="3/2" sizes="(min-width: 600px) 220px, 40vw" />
                      </Link>
                      <Dateline place={a.place} publishedAt={a.publishedAt} />
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {results.fragments.length > 0 ? (
            <section aria-labelledby="res-fragmentos" className={styles.block}>
              <ModuleHeader id="res-fragmentos" title={`Fragmentos (${results.fragments.length})`} />
              <ul className={styles.fragmentGrid}>
                {results.fragments.map((f) => (
                  <li key={f.slug}>
                    <FragmentCard fragment={f} section={sectionOf(f.section)} headingLevel="h2" />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function Suggestions() {
  return (
    <div className={styles.suggestions}>
      <p>Búsquedas de ejemplo:</p>
      <ul>
        {SUGERENCIAS.map((s) => (
          <li key={s}>
            <Link href={paths.search(s)}>{s}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
