import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FragmentCard } from "@/components/Fragments";
import { ModuleHeader } from "@/components/Meta";
import { HeroStory, StoryCard } from "@/components/Stories";
import { content } from "@/lib/content";
import { paths } from "@/lib/format";
import styles from "./page.module.css";

type Props = { params: Promise<{ slug: string }> };

// Se genera al primer pedido y se refresca cada 60 s: no hace falta recompilar al publicar.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Los metadatos no son críticos: si la base no responde, la página muestra su estado de error.
  const section = await content.getSection(slug).catch(() => null);
  return section ? { alternates: { canonical: `/seccion/${section.slug}` }, title: section.name, description: `Noticias y fragmentos de ${section.name}.` } : {};
}

export default async function SectionPage({ params }: Props) {
  const { slug } = await params;
  const section = await content.getSection(slug);
  if (!section) notFound();

  const [articles, fragments] = await Promise.all([
    content.getArticlesBySection(section.slug),
    content.getFragmentsBySection(section.slug),
  ]);
  const [lead, ...rest] = articles;

  return (
    <div className={`contenedor ${styles.page}`}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Sección</p>
        <h1 className={styles.title}>{section.name}</h1>
        <p className={styles.count}>
          {articles.length} {articles.length === 1 ? "nota" : "notas"} · {fragments.length}{" "}
          {fragments.length === 1 ? "fragmento" : "fragmentos"}
        </p>
      </header>

      <div className={styles.layout}>
        <section aria-labelledby="notas" className={styles.news}>
          <ModuleHeader id="notas" title="Noticias" />
          {lead ? (
            <>
              <HeroStory article={lead} />
              {rest.length > 0 ? (
                <div className={styles.grid}>
                  {rest.map((a) => (
                    <StoryCard key={a.slug} article={a} sizes="(min-width: 1024px) 30vw, (min-width: 600px) 50vw, 100vw" />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className={styles.empty}>Todavía no hay noticias en esta sección.</p>
          )}
        </section>

        <section aria-labelledby="fragmentos-seccion" className={styles.fragments}>
          <ModuleHeader id="fragmentos-seccion" title="Fragmentos" />
          {fragments.length > 0 ? (
            <ul className={styles.fragmentList}>
              {fragments.map((f) => (
                <li key={f.slug}>
                  <FragmentCard fragment={f} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>
              Todavía no hay fragmentos en {section.name}.{" "}
              <Link href={paths.fragments()} className="enlace">
                Ver todos los fragmentos
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
