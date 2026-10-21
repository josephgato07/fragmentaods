import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FragmentView } from "@/components/views/FragmentView";
import { content } from "@/lib/content";
import { absoluteUrl, publicRobots } from "@/lib/seo";
import { inlineToText } from "@/lib/content/search";
type Props = { params: Promise<{ slug: string }> };

// Se genera al primer pedido y se refresca cada 60 s: no hace falta recompilar al publicar.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fragment = await content.getFragment(slug).catch(() => null);
  if (!fragment) return {};
  const description = inlineToText(fragment.body[0] ?? []).slice(0, 180);
  return {
    alternates: { canonical: absoluteUrl(`/fragmento/${fragment.slug}`) },
    robots: publicRobots(fragment.isDemo),
    title: `${fragment.keyword} (fragmento)`,
    description,
    openGraph: { type: "article", title: fragment.keyword, description, url: absoluteUrl(`/fragmento/${fragment.slug}`), publishedTime: fragment.publishedAt, ...(fragment.image ? { images: [{ url: fragment.image.src, alt: fragment.image.alt }] } : {}) },
  };
}

export default async function FragmentPage({ params }: Props) {
  const { slug } = await params;
  const fragment = await content.getFragment(slug);
  if (!fragment) notFound();

  const [section, article, adjacent, all, sections] = await Promise.all([
    content.getSection(fragment.section),
    fragment.articleSlug ? content.getArticle(fragment.articleSlug) : Promise.resolve(null),
    content.getAdjacentFragments(fragment.slug),
    content.getFragments(),
    content.getSections(),
  ]);
  const more = all.filter((f) => f.slug !== fragment.slug).slice(0, 3);

  return (
    <FragmentView
      fragment={fragment}
      section={section}
      article={article}
      adjacent={adjacent}
      more={more}
      sections={sections}
    />
  );
}
