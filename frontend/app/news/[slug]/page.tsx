import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsItem } from "../../../lib/queries";
import NewsShareButtons from "../../../components/NewsShareButtons";
import {
  formatNewsDate,
  getExternalNewsSource,
  getNewsCategoryLabel,
  getValidModifiedTime,
} from "../../../lib/news-presentation";

type NewsPageProps = { params: { slug: string } };

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL;
}

function getCanonicalUrl(slug: string) {
  const base = getSiteUrl();
  return base ? new URL(`/news/${encodeURIComponent(slug)}`, base).toString() : undefined;
}

function getAbsoluteImageUrl(image?: string | null) {
  if (!image) return undefined;

  try {
    return new URL(image, getSiteUrl()).toString();
  } catch {
    return undefined;
  }
}

async function loadNewsItem(slug: string) {
  try {
    const result = await getNewsItem(slug);
    return result.data;
  } catch {
    notFound();
  }
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const item = await loadNewsItem(params.slug);
  const canonical = getCanonicalUrl(item.slug);
  const image = getAbsoluteImageUrl(item.featured_image || item.image_url);
  const description = item.excerpt?.trim() || undefined;
  const publishedTime = item.published_at || undefined;
  const modifiedTime = getValidModifiedTime(item.published_at, item.updated_at);

  return {
    title: item.title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      title: item.title,
      description,
      url: canonical,
      publishedTime,
      modifiedTime,
      images: image ? [{ url: image, alt: item.title }] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: NewsPageProps) {
  const item = await loadNewsItem(params.slug);
  const canonical = getCanonicalUrl(item.slug);
  const image = getAbsoluteImageUrl(item.featured_image || item.image_url);
  const publishedDate = formatNewsDate(item.published_at);
  const modifiedTime = getValidModifiedTime(item.published_at, item.updated_at);
  const updatedDate = formatNewsDate(modifiedTime);
  const externalSource = getExternalNewsSource(item);
  const categoryName = getNewsCategoryLabel(item);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    ...(item.excerpt?.trim() ? { description: item.excerpt.trim() } : {}),
    ...(image ? { image: [image] } : {}),
    ...(item.published_at ? { datePublished: item.published_at } : {}),
    ...(modifiedTime ? { dateModified: modifiedTime } : {}),
    ...(item.author_name?.trim()
      ? { author: { "@type": "Person", name: item.author_name.trim() } }
      : {}),
    publisher: {
      "@type": "Organization",
      name: "MERITLIVES LLC",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      ...(canonical ? { "@id": canonical } : {}),
    },
  };

  return (
    <main className="mx-auto max-w-4xl bg-white px-6 py-16 text-[#3A3F52]">
      <article>
        <header>
          {categoryName && (
            <p className="text-sm font-semibold uppercase tracking-wider text-[#1A3BBF]">
              {categoryName}
            </p>
          )}
          <h1 className="mt-3 text-4xl font-bold leading-tight text-[#0D0D0D] sm:text-5xl">{item.title}</h1>
          {item.excerpt && <p className="mt-5 text-xl leading-relaxed text-[#3A3F52]">{item.excerpt}</p>}

          {(item.author_name?.trim() || publishedDate || updatedDate || externalSource) && (
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-y border-[#DDE2ED] py-4 text-sm text-[#8892A4]">
              {(item.author_name?.trim() || publishedDate) && (
                <p>
                  {item.author_name?.trim() && <><span className="font-semibold text-[#0D0D0D]">By </span>{item.author_name.trim()}</>}
                  {item.author_name?.trim() && publishedDate && <span className="mx-2">·</span>}
                  {publishedDate && <><span className="font-semibold text-[#0D0D0D]">Published </span><time dateTime={item.published_at || undefined}>{publishedDate}</time></>}
                </p>
              )}
              {updatedDate && (
                <p>
                  <span className="font-semibold text-[#0D0D0D]">Updated: </span>
                  <time dateTime={modifiedTime}>{updatedDate}</time>
                </p>
              )}
              {externalSource && (
                <p>
                  <span className="font-semibold text-[#0D0D0D]">Source: </span>
                  <a href={externalSource.url} target="_blank" rel="noopener noreferrer" className="text-[#1A3BBF] underline underline-offset-4 hover:text-[#CC1111] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3BBF]">
                    {externalSource.name}
                  </a>
                </p>
              )}
            </div>
          )}
        </header>

        {canonical && <NewsShareButtons title={item.title} url={canonical} />}

        {image && (
          <figure className="mt-8">
            {/* Keep the API-provided image URL; do not substitute a logo or placeholder. */}
            <img src={image} alt={item.title} className="h-auto w-full" />
          </figure>
        )}

        {item.content && (
          <div
            className="prose prose-lg prose-headings:text-[#0D0D0D] prose-p:text-[#3A3F52] prose-li:text-[#3A3F52] prose-strong:text-[#0D0D0D] prose-a:text-[#1A3BBF] prose-a:decoration-[#1A3BBF] prose-a:transition-colors hover:prose-a:text-[#CC1111] prose-blockquote:text-[#3A3F52] prose-th:text-[#0D0D0D] prose-td:text-[#3A3F52] prose-code:text-[#0D0D0D] mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      </article>
    </main>
  );
}
