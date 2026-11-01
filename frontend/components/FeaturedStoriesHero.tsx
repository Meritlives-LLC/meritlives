"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeaturedStory } from "../types/api";
import { formatNewsDate } from "../lib/news-presentation";

const AUTOPLAY_INTERVAL_MS = 7000;

function FeaturedPostImage({ story, isPriority }: { story: FeaturedStory; isPriority: boolean }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#E8EBF2]">
      {story.image && !hasError ? (
        <img
          src={story.image}
          alt={story.title}
          fetchPriority={isPriority ? "high" : "auto"}
          loading={isPriority ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
          style={{ height: "100%", width: "100%" }}
          onError={() => setHasError(true)}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <span className="h-16 w-16 rotate-45 border border-[#1A3BBF]/25" />
          <span className="absolute h-11 w-11 border border-[#CC1111]/45" />
        </div>
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
    </div>
  );
}

export default function FeaturedStoriesHero({ stories }: { stories: FeaturedStory[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [canAutoplay, setCanAutoplay] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateAutoplayAvailability = () => {
      setCanAutoplay(!motionPreference.matches && document.visibilityState === "visible");
    };

    updateAutoplayAvailability();
    motionPreference.addEventListener("change", updateAutoplayAvailability);
    document.addEventListener("visibilitychange", updateAutoplayAvailability);

    return () => {
      motionPreference.removeEventListener("change", updateAutoplayAvailability);
      document.removeEventListener("visibilitychange", updateAutoplayAvailability);
    };
  }, []);

  useEffect(() => {
    if (stories.length < 2 || !canAutoplay || isHovered || hasFocus) return;

    const timeout = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % stories.length);
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, canAutoplay, hasFocus, isHovered, stories.length]);

  if (!stories.length) return null;

  const activeStory = stories[activeIndex] ?? stories[0];
  const showNavigation = stories.length > 1;

  function moveBy(offset: number) {
    setActiveIndex((index) => (index + offset + stories.length) % stories.length);
  }

  function handleBlur(event: React.FocusEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setHasFocus(false);
    }
  }

  return (
    <section
      aria-label="Featured news and blog stories"
      aria-roledescription="carousel"
      className="bg-[#F4F5F7] px-4 py-8 sm:px-6 md:py-10 lg:px-8 lg:py-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={handleBlur}
    >
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 overflow-hidden rounded-3xl border border-[#1A3BBF] bg-[#1A3BBF] shadow-[0_18px_60px_rgba(13,13,13,0.12)] md:h-[33rem] md:grid-cols-2">
        <div className="order-2 flex min-h-[24rem] min-w-0 flex-col px-6 py-7 sm:px-9 sm:py-8 md:order-1 md:h-full md:min-h-0 md:px-8 md:py-8 lg:px-10 lg:pt-12 lg:pb-10 xl:px-12">
          <div className="grid min-h-0 flex-1">
            {stories.map((story, index) => {
              const isActive = index === activeIndex;
              const date = formatNewsDate(story.publishedAt);

              return (
                <article
                  key={story.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${stories.length}: ${story.type}`}
                  aria-hidden={!isActive}
                  className={`min-w-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
                    isActive
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-2 opacity-0"
                  }`}
                  style={{ gridArea: "1 / 1" }}
                >
                  <Link
                    href={story.url}
                    tabIndex={isActive ? 0 : -1}
                    aria-label={`Read featured ${story.type === "news" ? "news" : "blog post"}: ${story.title}`}
                    className="group flex h-full min-w-0 flex-col justify-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#1A3BBF]"
                  >
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E8ECF7]">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#CC1111]" />
                        {story.type === "news" ? "News" : "Blog"}
                      </span>
                      <span aria-hidden="true" className="h-3 w-px bg-white/25" />
                      <span className="rounded-full border border-white/25 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#E8ECF7]">
                        Featured
                      </span>
                      {story.category?.name && (
                        <>
                          <span aria-hidden="true" className="h-3 w-px bg-white/25" />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E8ECF7]">
                            {story.category.name}
                          </span>
                        </>
                      )}
                    </div>

                    <h1
                      className="mt-5 line-clamp-5 text-[clamp(1.875rem,7vw,2.375rem)] font-semibold leading-[1.06] tracking-[-0.055em] text-white transition-colors group-hover:text-[#E8ECF7] md:mt-4 md:line-clamp-5 md:text-[clamp(2.25rem,4.3vw,2.75rem)] lg:line-clamp-4 lg:text-[clamp(3rem,3.7vw,3.25rem)]"
                      style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
                    >
                      {story.title}
                    </h1>

                    {story.excerpt && (
                      <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-[#E8ECF7] md:mt-2">
                        {story.excerpt}
                      </p>
                    )}

                    {(date || story.author || story.source) && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-[#E8ECF7] md:mt-3">
                        {date && <time dateTime={story.publishedAt || undefined}>{date}</time>}
                        {date && (story.author || story.source) && <span aria-hidden="true" className="h-3 w-px bg-white/30" />}
                        {story.author && <span>By {story.author}</span>}
                        {story.author && story.source && <span aria-hidden="true" className="h-3 w-px bg-white/30" />}
                        {story.source && <span>Source: {story.source}</span>}
                      </div>
                    )}

                    <span className="mt-4 inline-flex w-fit items-center gap-2 border-b border-white/60 pb-1 text-sm font-medium text-white transition-colors group-hover:border-[#CC1111] group-hover:text-[#E8ECF7]">
                      Read story <span aria-hidden="true">&#8599;</span>
                    </span>
                  </Link>
                </article>
              );
            })}
          </div>

          {showNavigation && (
            <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-white/20 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E8ECF7]">
                <span className="text-white">{String(activeIndex + 1).padStart(2, "0")}</span>
                <span aria-hidden="true" className="px-2 text-white/55">/</span>
                {String(stories.length).padStart(2, "0")}
                <span className="sr-only">: {activeStory.title}</span>
              </p>

              <div className="flex items-center gap-2" role="group" aria-label="Choose featured story">
                {stories.map((story, index) => (
                  <button
                    key={story.id}
                    type="button"
                    aria-label={`Show featured ${story.type === "news" ? "news" : "blog post"} ${index + 1}: ${story.title}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    onClick={() => setActiveIndex(index)}
                    className={`h-2.5 rounded-full border transition-[width,background-color] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white motion-reduce:transition-none ${
                      index === activeIndex
                        ? "w-7 border-[#CC1111] bg-[#CC1111]"
                        : "w-2.5 border-white/65 bg-transparent hover:border-[#CC1111]"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Previous featured story"
                  onClick={() => moveBy(-1)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/35 text-white transition-colors hover:border-[#CC1111] hover:text-[#E8ECF7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true">&larr;</span>
                </button>
                <button
                  type="button"
                  aria-label="Next featured story"
                  onClick={() => moveBy(1)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/35 text-white transition-colors hover:border-[#CC1111] hover:text-[#E8ECF7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="order-1 relative h-56 min-w-0 overflow-hidden bg-[#E8EBF2] sm:h-72 md:order-2 md:h-full">
          {stories.map((story, index) => (
            <div
              key={story.id}
              aria-hidden={index !== activeIndex}
              className={`group absolute inset-0 min-w-0 transition-opacity duration-500 ease-out motion-reduce:transition-none ${
                index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <FeaturedPostImage story={story} isPriority={index === 0} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
