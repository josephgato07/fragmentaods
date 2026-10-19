import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarraVistaPrevia } from "@/components/panel/BarraVistaPrevia";
import { ArticleView } from "@/components/views/ArticleView";
import { content } from "@/lib/content";
import { estadoVisible } from "@/lib/panel/reglas";
import { previaNota } from "@/lib/panel/vista-previa";

export const metadata: Metadata = { title: "Vista previa", robots: { index: false, follow: false } };

export default async function PreviaNota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Solo lo que el rol puede ver según RLS; si no, 404.
  const previa = await previaNota(id);
  if (!previa) notFound();
  const article = previa.contenido;

  const [section, related, linked, latest] = await Promise.all([
    content.getSection(article.section).catch(() => null),
    content.getRelatedArticles(article, 3).catch(() => []),
    content.getFragmentsForArticle(article.slug).catch(() => []),
    content.getFragments().catch(() => []),
  ]);

  return (
    <div style={{ marginInline: "calc(var(--page-margin) * -1)", marginTop: "calc(var(--space-6) * -1)" }}>
      <BarraVistaPrevia
        estado={previa.estado}
        publicadoEn={previa.publicadoEn}
        editar={`/panel/notas/${id}`}
        publica={estadoVisible(previa.estado, previa.publicadoEn) === "publicado" ? `/nota/${previa.slug}` : null}
      />
      <ArticleView article={article} section={section} related={related} linkedFragments={linked} latestFragments={latest} preview />
    </div>
  );
}
