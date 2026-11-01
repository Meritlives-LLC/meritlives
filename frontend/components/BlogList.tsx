"use client";

import Link from "next/link";
import EditorialNewsletterSection from "./EditorialNewsletterSection";
import { useRef, useState } from "react";
import { formatNewsDate } from "../lib/news-presentation";
import { getBlogPosts } from "../lib/queries";
import type { BlogPost, Category, Paginated } from "../types/api";

const PAGE_SIZE = 12;

const BLOG_CATEGORY_ORDER = [
  { name: "Company Updates", slug: "company-updates" },
  { name: "Projects & Operations", slug: "projects-operations" },
  { name: "Industry Insights & Thought Leadership", slug: "industry-insights-thought-leadership" },
  { name: "Team & Culture", slug: "team-culture" },
  { name: "Knowledge Base", slug: "knowledge-base" },
  { name: "Policies & Procedures", slug: "policies-procedures" },
] as const;

type RetryRequest = { page: number; category: string | null };

function categoryNameForPost(post: BlogPost) {
  return BLOG_CATEGORY_ORDER.find((category) => category.slug === post.category?.slug)?.name ?? "Blog";
}

function BlogCard({ post, compact = false }: { post: BlogPost; compact?: boolean }) {
  const published = formatNewsDate(post.published_at);
  const image = post.featured_image;

  return (
    <article className={`h-full ${compact ? "lg:mx-auto lg:max-w-3xl" : ""}`}>
      <Link
        href={`/blog/${encodeURIComponent(post.slug)}`}
        aria-label={`Read blog article: ${post.title}`}
        className="group flex h-full flex-col rounded-xl border border-[#DDE2ED] bg-white p-3 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF] sm:p-4"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#F2F4F8]">
          {image ? (
            <img
              src={image}
              alt={post.featured_image_alt || ""}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
            />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-[#F2F4F8] to-[#E8ECF3]" />
          )}
        </div>

        {post.featured_image_disclosure && <p className="mt-2 text-xs leading-5 text-[#596273]">{post.featured_image_disclosure}</p>}
        <div className="flex flex-1 flex-col px-1 pt-5">
          <div className="flex min-h-5 items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="truncate font-semibold uppercase tracking-[0.12em] text-[#CC1111]">
              {categoryNameForPost(post)}
            </span>
            <time className="shrink-0 text-[#687080]" dateTime={post.published_at || undefined}>
              {published || "Date unavailable"}
            </time>
          </div>

          <h2
            className="mt-3 line-clamp-3 text-xl font-semibold leading-snug tracking-[-0.025em] text-[#0D0D0D] transition-colors group-hover:text-[#1A3BBF] sm:text-2xl"
            style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
          >
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#4B5260] sm:text-base sm:leading-7">
              {post.excerpt}
            </p>
          )}

          <span className="mt-auto inline-flex w-fit items-center gap-2 pt-5 text-sm font-semibold text-[#0D0D0D] underline decoration-[#8892A4] underline-offset-4 transition-colors group-hover:text-[#1A3BBF] group-hover:decoration-[#1A3BBF]">
            Read Article <span aria-hidden="true">&#8594;</span>
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function BlogList({
  initialPage,
  categories,
  categoriesUnavailable = false,
  initialCategory = null,
}: {
  initialPage: Paginated<BlogPost>;
  categories: Category[];
  categoriesUnavailable?: boolean;
  initialCategory?: string | null;
}) {
  const availableCategories = BLOG_CATEGORY_ORDER.filter((expected) =>
    categories.some((category) =>
      category.type === "blog" && category.status === "active" &&
      category.slug === expected.slug && category.name === expected.name
    )
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const [items, setItems] = useState(initialPage.data);
  const [page, setPage] = useState(initialPage.meta?.current_page ?? 1);
  const [lastPage, setLastPage] = useState(initialPage.meta?.last_page ?? 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null);
  const loadingRef = useRef(false);
  const hasMore = page < lastPage;
  const activeCategoryName = activeCategory
    ? availableCategories.find((category) => category.slug === activeCategory)?.name ?? "this category"
    : "all categories";

  async function requestPage(targetPage: number, category: string | null) {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setRetryRequest(null);

    try {
      const categoryParam = category ? `&category=${encodeURIComponent(category)}` : "";
      const result = await getBlogPosts(`?page=${targetPage}&per_page=${PAGE_SIZE}${categoryParam}`, { cache: "no-store" });
      setItems((current) => {
        const base = targetPage === 1 ? [] : current;
        const existingIds = new Set(base.map((post) => post.id));
        return [...base, ...result.data.filter((post) => !existingIds.has(post.id))];
      });
      setPage(result.meta?.current_page ?? targetPage);
      setLastPage(result.meta?.last_page ?? targetPage);
      setActiveCategory(category);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Blog posts could not be loaded. Please try again.");
      setRetryRequest({ page: targetPage, category });
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  function selectCategory(category: string | null) {
    if (category === activeCategory || loadingRef.current) return;
    setActiveCategory(category);
    setItems([]);
    setPage(1);
    setLastPage(1);
    void requestPage(1, category);
  }

  function loadMore() {
    if (!hasMore || loadingRef.current) return;
    void requestPage(page + 1, activeCategory);
  }

  function retry() {
    if (retryRequest) void requestPage(retryRequest.page, retryRequest.category);
    else loadMore();
  }

  const gridColumns = items.length === 1
    ? "grid-cols-1"
    : items.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div>
      <nav aria-label="Filter Blog posts by category" className="mb-9 border-y border-[#DDE2ED] sm:mb-12">
        <div className="flex min-w-0 gap-2 overflow-x-auto py-3 [scrollbar-width:thin]">
          {[{ name: "All Blog Posts", slug: null as string | null }, ...availableCategories].map((category) => {
            const active = activeCategory === category.slug;
            return (
              <button
                key={category.slug ?? "all-blog-posts"}
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

      {categoriesUnavailable && (
        <p role="status" className="-mt-5 mb-6 text-sm text-[#5D6472]">
          Blog categories are temporarily unavailable. Showing all publicly available posts.
        </p>
      )}

      {items.length > 0 ? (
        <div className={`grid ${gridColumns} gap-x-8 gap-y-10 sm:gap-x-7 sm:gap-y-12 lg:gap-x-9 lg:gap-y-14`}>
          {items.map((post) => <BlogCard key={post.id} post={post} compact={items.length === 1} />)}
        </div>
      ) : (
        <p role="status" className="border-y border-[#DDE2ED] py-10 text-[#3A3F52]">
          {loading ? "Loading articles…" : `No blog posts in ${activeCategoryName} yet.`}
        </p>
      )}

      <EditorialNewsletterSection compact />
      <div className="mt-12 flex min-h-16 flex-col items-center justify-center gap-3 text-center">
        {error && <p role="alert" className="text-sm text-[#A20D0D]">{error}</p>}
        {loading && <p role="status" aria-live="polite" className="text-sm text-[#5D6472]">Loading articles…</p>}
        {(hasMore || retryRequest) && (
          <button
            type="button"
            onClick={retry}
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
