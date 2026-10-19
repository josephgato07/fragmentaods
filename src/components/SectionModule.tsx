import type { SectionModuleData } from "@/lib/content";
import { paths } from "@/lib/format";
import { FragmentListItem } from "./Fragments";
import { ModuleHeader } from "./Meta";
import styles from "./SectionModule.module.css";
import { ListStory, StoryCard } from "./Stories";

/** Módulo de categoría en portada: rótulo + nota principal + lista de titulares y fragmentos. */
export function SectionModule({ data }: { data: SectionModuleData }) {
  const { section, lead, items } = data;
  const headingId = `modulo-${section.slug}`;
  return (
    <section className={styles.module} aria-labelledby={headingId}>
      <ModuleHeader id={headingId} title={section.name} href={paths.section(section.slug)} />
      <div className={`${styles.grid} ${lead ? "" : styles.noLead}`}>
        {lead ? (
          <div className={styles.lead}>
            <StoryCard article={lead} sizes="(min-width: 900px) 55vw, 100vw" />
          </div>
        ) : null}
        {items.length > 0 ? (
          <ul className={styles.list}>
            {items.map((item) =>
              item.kind === "articulo" ? (
                <li key={item.slug}>
                  <ListStory article={item} />
                </li>
              ) : (
                <FragmentListItem key={item.slug} fragment={item} />
              ),
            )}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
