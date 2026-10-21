import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/views/ArticleView";
import { content } from "@/lib/content";
import { absoluteUrl, articleDescription, articleJsonLd, publicRobots, serializeJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

// Se genera al primer pedido y se refresca cada 60 s: no hace falta recompilar al publicar.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await content.getArticle(slug).catch(() => null);
  if (!article) return {};
  const description = articleDescription(article);
  const url = absoluteUrl(`/nota/${article.slug}`);
  return {
    alternates: { canonical: url },
    robots: publicRobots(article.isDemo),
    title: article.title,
    description,
    openGraph: {
      type: "article",
      url,
      siteName: "FRAGMENTADOS",
      locale: "es_UY",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
      title: article.title,
      description,
      images: [{ url: article.image.src, width: article.image.width, height: article.image.height, alt: article.image.alt }],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await content.getArticle(slug);
  if (!article) notFound();

  const [section, related, linkedFragments, latest] = await Promise.all([
    content.getSection(article.section),
    content.getRelatedArticles(article, 3),
    content.getFragmentsForArticle(article.slug),
    content.getFragments(),
  ]);

  return (
    <>
    {!article.isDemo && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd(article, section?.name)) }} />}
    <ArticleView
      article={article}
      section={section}
      related={related}
      linkedFragments={linkedFragments}
      latestFragments={latest}
    />
    </>
  );
}
