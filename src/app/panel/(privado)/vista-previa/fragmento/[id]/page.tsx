import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarraVistaPrevia } from "@/components/panel/BarraVistaPrevia";
import { FragmentView } from "@/components/views/FragmentView";
import { content } from "@/lib/content";
import { estadoVisible } from "@/lib/panel/reglas";
import { previaFragmento } from "@/lib/panel/vista-previa";

export const metadata: Metadata = { title: "Vista previa", robots: { index: false, follow: false } };

export default async function PreviaFragmento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const previa = await previaFragmento(id);
  if (!previa) notFound();
  const fragment = previa.contenido;

  const [section, article, sections, all] = await Promise.all([
    content.getSection(fragment.section).catch(() => null),
    // El enlace a la nota completa aparece solo si esa nota es pública, igual que en el portal.
    previa.notaSlug ? content.getArticle(previa.notaSlug).catch(() => null) : Promise.resolve(null),
    content.getSections().catch(() => []),
    content.getFragments().catch(() => []),
  ]);

  return (
    <div style={{ marginInline: "calc(var(--page-margin) * -1)", marginTop: "calc(var(--space-6) * -1)" }}>
      <BarraVistaPrevia
        estado={previa.estado}
        publicadoEn={previa.publicadoEn}
        editar={`/panel/fragmentos/${id}`}
        publica={estadoVisible(previa.estado, previa.publicadoEn) === "publicado" ? `/fragmento/${previa.slug}` : null}
      />
      <FragmentView
        fragment={fragment}
        section={section}
        article={article}
        adjacent={{ newer: null, older: null }}
        more={all.filter((f) => f.slug !== fragment.slug).slice(0, 3)}
        sections={sections}
        preview
      />
    </div>
  );
}
