"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatNewsDate,
  getExternalNewsSource,
  getNewsCategoryLabel,
  getValidModifiedTime,
} from "../lib/news-presentation";
import type { NewsItem } from "../types/api";

const categories = ["Technology", "Business", "Digital Innovation"] as const;
type CategoryFilter = "All News" | (typeof categories)[number];

function StoryImage({ story, priority = false }: { story: NewsItem; priority?: boolean }) {
  const imageUrl = story.featured_image || story.image_url;

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-[#F2F4F8]">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading={priority ? "eager" : "lazy"}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none"
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="h-12 w-12 rotate-45 border border-[#1A3BBF]/25" />
          <span className="absolute h-8 w-8 border border-[#CC1111]/45" />
        </div>
      )}
    </div>
  );
}

function StoryMetadata({ story, compact = false }: { story: NewsItem; compact?: boolean }) {
  const author = story.author_name?.trim();
  const published = formatNewsDate(story.published_at);
  const updatedAt = getValidModifiedTime(story.published_at, story.updated_at);
  const updated = formatNewsDate(updatedAt);
  const source = getExternalNewsSource(story);

  if (!author && !published && !updated && !source) return null;

  return (
    <div className={`mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-[#3A3F52] ${compact ? "sm:text-[11px]" : "sm:text-sm"}`}>
      {(author || published) && (
        <span>
          {author && <><span className="font-semibold text-[#0D0D0D]">By </span>{author}</>}
          {author && published && <> <span aria-hidden="true">·</span> </>}
          {published && <><span className="font-semibold text-[#0D0D0D]">Published </span><time dateTime={story.published_at || undefined}>{published}</time></>}
        </span>
      )}
      {updated && <span><span className="font-semibold text-[#0D0D0D]">Updated </span>{updated}</span>}
      {source && <span>Source: {source.name}</span>}
    </div>
  );
}

function StoryCategory({ story }: { story: NewsItem }) {
  const category = getNewsCategoryLabel(story);
  return category ? (
    <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#CC1111]">{category}</p>
  ) : null;
}

export default function NewsList({ items }: { items: NewsItem[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All News");
  const filteredItems = useMemo(() => {
    const visible = activeCategory === "All News"
      ? items
      : items.filter((item) => getNewsCategoryLabel(item) === activeCategory);
    const lead = visible.find((item) => item.featured) || visible[0];
    return lead ? [lead, ...visible.filter((item) => item.id !== lead.id)] : [];
  }, [activeCategory, items]);

  if (!items.length) {
    return <p className="border-y border-[#DDE2ED] py-10 text-[#3A3F52]">No news is available yet.</p>;
  }

  const [leadStory, ...otherStories] = filteredItems;
  const supportingStories = otherStories.slice(0, 2);
  const remainingStories = otherStories.slice(2);

  return (
    <div>
      <nav aria-label="Filter News by category" className="mb-9 border-y border-[#DDE2ED] bg-white sm:mb-12">
        <div className="flex min-w-0 gap-2 overflow-x-auto py-3 [scrollbar-width:thin]">
          {(["All News", ...categories] as const).map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3BBF] ${active ? "border-[#CC1111] text-[#CC1111]" : "border-transparent text-[#3A3F52] hover:border-[#CC1111]/50 hover:text-[#0D0D0D]"}`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </nav>

      {leadStory ? (
        <>
          <section aria-label="Lead News story" className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.8fr)] lg:gap-12">
            <article>
              <Link
                href={`/news/${leadStory.slug}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]"
                aria-label={`Read featured story: ${leadStory.title}`}
              >
                <StoryImage story={leadStory} priority />
                <div className="mt-5 max-w-3xl sm:mt-6">
                  <StoryCategory story={leadStory} />
                  <h2 className="mt-2 text-3xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#0D0D0D] transition-colors group-hover:text-[#1A3BBF] sm:text-4xl md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
                    {leadStory.title}
                  </h2>
                  {leadStory.excerpt && <p className="mt-4 max-w-2xl text-base leading-7 text-[#3A3F52] sm:text-lg sm:leading-8">{leadStory.excerpt}</p>}
                  <StoryMetadata story={leadStory} />
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1A3BBF] transition-colors group-hover:text-[#CC1111]">
                    Read story <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            </article>

            {supportingStories.length > 0 && (
              <aside aria-label="More News stories" className="border-t border-[#DDE2ED] lg:border-l lg:border-t-0 lg:pl-8">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-[#DDE2ED]">
                  {supportingStories.map((story) => (
                    <article key={story.id} className="pt-6 first:pt-6 lg:py-6 lg:first:pt-0">
                      <Link href={`/news/${story.slug}`} className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]" aria-label={`Read story: ${story.title}`}>
                        <StoryImage story={story} />
                        <div className="mt-4">
                          <StoryCategory story={story} />
                          <h3 className="mt-2 text-xl font-semibold leading-snug tracking-[-0.025em] text-[#0D0D0D] transition-colors group-hover:text-[#1A3BBF] sm:text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                            {story.title}
                          </h3>
                          <StoryMetadata story={story} compact />
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </aside>
            )}
          </section>

          {remainingStories.length > 0 && (
            <section aria-labelledby="more-news-title" className="mt-12 border-t border-[#DDE2ED] pt-8 sm:mt-16 sm:pt-10">
              <div className="mb-7 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#CC1111]">The newsroom</p>
                  <h2 id="more-news-title" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0D0D0D] sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
                    More stories
                  </h2>
                </div>
                <span className="pb-1 text-xs text-[#8892A4]">{remainingStories.length} {remainingStories.length === 1 ? "story" : "stories"}</span>
              </div>
              <div className="grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-9 lg:gap-y-12">
                {remainingStories.map((story) => (
                  <article key={story.id}>
                    <Link href={`/news/${story.slug}`} className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]" aria-label={`Read story: ${story.title}`}>
                      <StoryImage story={story} />
                      <div className="mt-4">
                        <StoryCategory story={story} />
                        <h3 className="mt-2 text-xl font-semibold leading-snug tracking-[-0.025em] text-[#0D0D0D] transition-colors group-hover:text-[#1A3BBF]" style={{ fontFamily: "var(--font-heading)" }}>
                          {story.title}
                        </h3>
                        <StoryMetadata story={story} compact />
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <p role="status" className="border-y border-[#DDE2ED] py-10 text-[#3A3F52]">No stories in {activeCategory} yet.</p>
      )}
    </div>
  );
}
