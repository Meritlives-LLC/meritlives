"use client";

import Link from "next/link";
import EditorialNewsletterSection from "./EditorialNewsletterSection";
import { useRef, useState } from "react";
import { getNews } from "../lib/queries";
import { formatNewsDate, getNewsCategoryLabel } from "../lib/news-presentation";
import type { Category, NewsItem, Paginated } from "../types/api";

type CategoryFilter = string;
const PAGE_SIZE = 6;

function categorySlug(category: CategoryFilter) {
  return !category ? "" : `&category=${encodeURIComponent(category)}`;
}

function NewsCard({ story }: { story: NewsItem }) {
  const image = story.featured_image || story.image_url;
  const category = getNewsCategoryLabel(story);
  const published = formatNewsDate(story.published_at);
  const author = story.author_name?.trim();

  return (
    <article className="h-full">
      <Link
        href={`/news/${story.slug}`}
        aria-label={`Read news article: ${story.title}`}
        className="group flex h-full flex-col rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#F2F4F8]">
          {image ? (
            <img
              src={image}
              alt={story.featured_image_alt || ""}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
            />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-[#F2F4F8] to-[#E8ECF3]" />
          )}
        </div>

        {story.featured_image_disclosure && <p className="mt-2 text-xs leading-5 text-[#596273]">{story.featured_image_disclosure}</p>}
        <div className="flex flex-1 flex-col pt-5">
          <div className="flex min-h-5 items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="truncate font-semibold uppercase tracking-[0.12em] text-[#CC1111]">
              {category || "News"}
            </span>
            <time className="shrink-0 text-[#687080]" dateTime={story.published_at || undefined}>
              {published || "Date unavailable"}
            </time>
          </div>

          <h2
            className="mt-3 line-clamp-3 text-xl font-semibold leading-snug tracking-[-0.025em] text-[#0D0D0D] transition-colors group-hover:text-[#1A3BBF] sm:text-2xl"
            style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
          >
            {story.title}
          </h2>

          {story.excerpt && (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#4B5260] sm:text-base sm:leading-7">
              {story.excerpt}
            </p>
          )}

          {author && <p className="mt-auto pt-5 text-sm font-medium text-[#252832]">By {author}</p>}
        </div>
      </Link>
    </article>
  );
}

export default function NewsList({
  initialPage,
  initialCategory = "",
  categories = [],
}: {
  initialPage: Paginated<NewsItem>;
  initialCategory?: CategoryFilter;
  categories?: Pick<Category, "name" | "slug">[];
}) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(initialCategory);
  const [items, setItems] = useState(initialPage.data);
  const [page, setPage] = useState(initialPage.meta?.current_page ?? 1);
  const [lastPage, setLastPage] = useState(initialPage.meta?.last_page ?? 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryRequest, setRetryRequest] = useState<{ page: number; category: CategoryFilter } | null>(null);
  const loadingRef = useRef(false);

  const hasMore = page < lastPage;

  async function requestPage(targetPage: number, category: CategoryFilter) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setRetryRequest(null);

    try {
      const result = await getNews(`?page=${targetPage}&per_page=${PAGE_SIZE}${categorySlug(category)}`, { cache: "no-store" });
      setItems((current) => {
        if (targetPage === 1) return result.data;
        const existingIds = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !existingIds.has(item.id))];
      });
      setPage(result.meta?.current_page ?? targetPage);
      setLastPage(result.meta?.last_page ?? targetPage);
      setActiveCategory(category);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "News could not be loaded. Please try again.");
      setRetryRequest({ page: targetPage, category });
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  function selectCategory(category: CategoryFilter) {
    if (category === activeCategory || loadingRef.current) return;
    void requestPage(1, category);
  }

  function loadMore() {
    if (!hasMore || loadingRef.current) return;
    void requestPage(page + 1, activeCategory);
  }

  function retryOrLoadMore() {
    if (retryRequest) {
      void requestPage(retryRequest.page, retryRequest.category);
      return;
    }

    loadMore();
  }

  return (
    <div>
      <nav aria-label="Filter News by category" className="mb-9 border-y border-[#DDE2ED] sm:mb-12">
        <div className="flex min-w-0 gap-2 overflow-x-auto py-3 [scrollbar-width:thin]">
          {[{ name: "All News", slug: "" }, ...categories].map((category) => {
            const active = activeCategory === category.slug;
            return (
              <button
                key={category.slug}
                type="button"
                aria-pressed={active}
                disabled={loading}
                onClick={() => selectCategory(category.slug)}
                className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3BBF] disabled:cursor-wait ${active ? "border-[#CC1111] text-[#CC1111]" : "border-transparent text-[#3A3F52] hover:border-[#CC1111]/50 hover:text-[#0D0D0D]"}`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </nav>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-x-7 lg:grid-cols-3 lg:gap-x-9 lg:gap-y-14">
          {items.map((story) => <NewsCard key={story.id} story={story} />)}
        </div>
      ) : (
        <p role="status" className="border-y border-[#DDE2ED] py-10 text-[#3A3F52]">
          {loading ? "Loading news…" : `No stories in ${categories.find(category => category.slug === activeCategory)?.name ?? "All News"} yet.`}
        </p>
      )}

      <EditorialNewsletterSection compact />
      <div className="mt-14 flex min-h-16 flex-col items-center justify-center gap-3 text-center">
        {error && <p role="alert" className="text-sm text-[#A20D0D]">{error}</p>}
        {loading && <p role="status" aria-live="polite" className="text-sm text-[#5D6472]">Loading news…</p>}
        {(hasMore || retryRequest) && (
          <button
            type="button"
            onClick={retryOrLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-[#D5D8DE] px-6 py-3 text-sm font-semibold text-[#0D0D0D] transition-colors hover:border-[#CC1111] hover:text-[#CC1111] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF] disabled:cursor-wait disabled:opacity-60"
          >
            {retryRequest ? "Retry loading" : loading ? "Loading…" : "Load more"}
            <svg aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} viewBox="0 0 16 16" fill="none">
              {loading ? <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" opacity=".35" /> : <path d="M8 2.5v10m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
