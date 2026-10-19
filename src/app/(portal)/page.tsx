import { FragmentRail } from "@/components/FragmentRail";
import { Highlights } from "@/components/Highlights";
import { SectionModule } from "@/components/SectionModule";
import { HeroStory, SideStory, StoryCard } from "@/components/Stories";
import { content } from "@/lib/content";
import { paths } from "@/lib/format";
import Link from "next/link";
import styles from "./page.module.css";

// La portada se refresca cada 60 s con lo publicado y el orden editorial vigente.
export const revalidate = 60;

export default async function HomePage() {
  const home = await content.getHomePage();

  if (!home.lead) {
    return (
      <section className={`contenedor ${styles.empty}`} aria-labelledby="portada-vacia">
        <p className={styles.emptyEyebrow}>Portada</p>
        <h1 id="portada-vacia" className={styles.emptyTitle}>
          Todavía no hay noticias publicadas
        </h1>
        <p className={styles.emptyText}>
          Cuando la redacción publique la primera nota, va a aparecer acá.{" "}
          {home.latestFragments.length > 0 ? (
            <Link href={paths.fragments()} className="enlace">
              Mientras tanto, leé los últimos fragmentos
            </Link>
          ) : null}
        </p>
      </section>
    );
  }

  return (
    <>
      <h1 className="solo-lectores">FRAGMENTADOS, portada</h1>

      <section className={`contenedor ${styles.opening}`} aria-label="Noticias principales">
        <HeroStory article={home.lead} />

        {/* Escritorio: columna lateral con miniaturas */}
        <div className={styles.aside}>
          {home.secondary.map((a) => (
            <SideStory key={a.slug} article={a} />
          ))}
        </div>

        {/* Celular y tablet: las mismas tres notas con foto grande */}
        <div className={styles.secondary}>
          {home.secondary.map((a) => (
            <StoryCard key={a.slug} article={a} />
          ))}
        </div>
      </section>

      {home.latestFragments.length > 0 ? <FragmentRail fragments={home.latestFragments} /> : null}

      <div className={`contenedor ${styles.modules}`}>
        {home.modules.map((m, i) => (
          <div key={m.section.slug} className={styles.moduleSlot}>
            <SectionModule data={m} />
            {i === 0 ? <Highlights items={home.highlights} /> : null}
          </div>
        ))}
      </div>
    </>
  );
}
