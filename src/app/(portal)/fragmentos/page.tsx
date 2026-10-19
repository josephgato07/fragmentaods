import type { Metadata } from "next";
import { FragmentCard } from "@/components/Fragments";
import { content } from "@/lib/content";
import styles from "./page.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Fragmentos",
  description: "Fragmentos informativos breves, del más reciente al más antiguo.",
};

export default async function FragmentsPage() {
  const [fragments, sections] = await Promise.all([content.getFragments(), content.getSections()]);
  const sectionOf = (slug: string) => sections.find((s) => s.slug === slug);

  return (
    <div className={`contenedor ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fragmentos</h1>
        <p className={styles.lead}>Información breve, al punto. Del más reciente al más antiguo.</p>
      </header>
      {fragments.length > 0 ? (
        <ol className={styles.grid}>
          {fragments.map((f) => (
            <li key={f.slug}>
              <FragmentCard fragment={f} section={sectionOf(f.section)} headingLevel="h2" />
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>Todavía no hay fragmentos publicados.</p>
      )}
    </div>
  );
}
