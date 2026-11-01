import EditorialNewsletterSection from "../../../components/EditorialNewsletterSection";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNews, getNewsItem } from "../../../lib/queries";
import NewsShareButtons from "../../../components/NewsShareButtons";
import type { NewsItem } from "../../../types/api";
import {
  formatNewsDate,
  getExternalNewsSource,
  getNewsCategoryLabel,
  getValidModifiedTime,
} from "../../../lib/news-presentation";

type NewsPageProps = { params: Promise<{ slug: string }> };

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

async function loadRelatedNews(item: NewsItem): Promise<NewsItem[]> {
  if (!item.category?.id) return [];

  try {
    const result = await getNews("?per_page=12");
    return result.data
      .filter((story) => story.id !== item.id && story.category?.id === item.category?.id)
      .slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params: paramsPromise }: NewsPageProps): Promise<Metadata> {
  const params = await paramsPromise;
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

export default async function NewsDetailPage({ params: paramsPromise }: NewsPageProps) {
  const params = await paramsPromise;
  const item = await loadNewsItem(params.slug);
  const relatedStories = await loadRelatedNews(item);
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
            <img src={image} alt={item.featured_image_alt || item.title} className="h-auto w-full" />
            {item.featured_image_disclosure && <figcaption className="mt-2 text-sm text-[#596273]">{item.featured_image_disclosure}</figcaption>}
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

      {relatedStories.length > 0 && (
        <section aria-labelledby="related-news-title" className="mt-12 border-t border-[#DDE2ED] pt-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#CC1111]">More from {categoryName || "News"}</p>
              <h2 id="related-news-title" className="mt-2 text-2xl font-semibold tracking-tight text-[#0D0D0D]">Related stories</h2>
            </div>
            <Link href="/news" className="shrink-0 text-sm font-medium text-[#1A3BBF] underline underline-offset-4">All news</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedStories.map((story) => (
              <article key={story.id}>
                <Link href={`/news/${story.slug}`} className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]">
                  {(story.featured_image || story.image_url) ? (
                    <img src={story.featured_image || story.image_url || ""} alt={story.featured_image_alt || ""} loading="lazy" className="aspect-[16/10] w-full rounded-lg bg-[#F2F4F8] object-cover" />
                  ) : (
                    <div aria-hidden="true" className="aspect-[16/10] w-full rounded-lg bg-[#F2F4F8]" />
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-semibold uppercase tracking-[0.1em] text-[#CC1111]">{getNewsCategoryLabel(story) || "News"}</span>
                    <time className="shrink-0 text-[#687080]" dateTime={story.published_at || undefined}>{formatNewsDate(story.published_at)}</time>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug text-[#0D0D0D] transition-colors group-hover:text-[#1A3BBF]">{story.title}</h3>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    <EditorialNewsletterSection />
      </main>
  );
}
