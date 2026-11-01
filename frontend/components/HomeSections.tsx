import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import type { NewsItem, Product, Service } from "../types/api";
import { formatNewsDate, getExternalNewsSource, getNewsCategoryLabel } from "../lib/news-presentation";
import { getWatchVideos } from "../lib/watch-queries";
import ProductsList from "./ProductsList";
import ServicesList from "./ServicesList";
import { FeaturedWatchCarousel, FeaturedWatchLoading } from "./FeaturedWatchCarousel";

function StoryMetadata({ story }: { story: NewsItem }) {
  const author = story.author_name?.trim();
  const source = getExternalNewsSource(story);

  if (!author && !source) return null;

  return (
    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-5 text-sm leading-5 text-[#5D6472]">
      {author && <span><span className="font-medium text-[#252832]">By </span>{author}</span>}
      {source && <span className="wrap-break-word">Source: {source.name}</span>}
    </div>
  );
}

function StoryImage({ story }: { story: NewsItem }) {
  const imageUrl = story.featured_image || story.image_url;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#F2F4F8]">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="h-12 w-12 border border-[#1A3BBF]/25 rotate-45" />
          <span className="absolute h-8 w-8 border border-[#CC1111]/45" />
        </div>
      )}
    </div>
  );
}

export function FeaturedStories({ stories }: { stories: NewsItem[] }) {
  return (
    <section aria-labelledby="featured-stories-title" className="bg-white text-[#0D0D0D]">
      <div className="ml-container pt-3 pb-16 md:pt-5 md:pb-20 lg:pt-6 lg:pb-24">
        <div className="mb-9 flex flex-col gap-5 border-b border-[#D5D8DE] pb-6 sm:flex-row sm:items-end sm:justify-between md:mb-11">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#CC1111]">MERITLIVES / Newsroom</p>
            <h2
              id="featured-stories-title"
              className="mt-3 text-3xl font-semibold uppercase leading-none tracking-[-0.055em] sm:text-4xl md:text-6xl"
              style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
            >
              Featured Stories
            </h2>
          </div>
          <Link
            href="/news"
            className="group inline-flex w-fit items-center gap-2 border-b border-[#0D0D0D] pb-1 text-sm font-medium text-[#252832] transition-colors hover:border-[#1A3BBF] hover:text-[#1A3BBF] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]"
          >
            All news <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {stories.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-x-7 lg:grid-cols-3 lg:gap-x-9 lg:gap-y-14">
            {stories.map((story) => {
              const category = getNewsCategoryLabel(story);
              const published = formatNewsDate(story.published_at);

              return (
                <article key={story.id} className="h-full">
                  <Link
                    href={`/news/${story.slug}`}
                    className="group flex h-full flex-col rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]"
                    aria-label={`Read news article: ${story.title}`}
                  >
                    <StoryImage story={story} />
                    <div className="flex flex-1 flex-col pt-5">
                      <div className="flex min-h-5 items-center justify-between gap-3 text-xs sm:text-sm">
                        <span className="truncate font-semibold uppercase tracking-[0.12em] text-[#CC1111]">
                          {category || "News"}
                        </span>
                        <time className="shrink-0 text-[#687080]" dateTime={story.published_at || undefined}>
                          {published || "Date unavailable"}
                        </time>
                      </div>
                      <h3
                        className="mt-3 line-clamp-3 text-xl font-semibold leading-snug tracking-[-0.025em] text-[#0D0D0D] transition-colors group-hover:text-[#1A3BBF] sm:text-2xl"
                        style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
                      >
                        {story.title}
                      </h3>
                      {story.excerpt && (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#4B5260] sm:text-base sm:leading-7">
                          {story.excerpt}
                        </p>
                      )}
                      <StoryMetadata story={story} />
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border-y border-[#DDE2ED] py-12">
            <p className="text-lg text-[#3A3F52]">There are no featured stories available right now.</p>
            <Link href="/news" className="mt-4 inline-flex text-sm font-medium text-[#1A3BBF] underline underline-offset-4">
              Visit MERITLIVES News
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function BigNews({ story }: { story: NewsItem | null }) {
  if (!story) return null;
  const category = getNewsCategoryLabel(story);
  const published = formatNewsDate(story.published_at);

  return (
    <section aria-labelledby="big-news-title" className="bg-white text-[#0D0D0D]">
      <div className="ml-container pt-8 pb-10 md:pt-12 md:pb-14">
        <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#CC1111]">Big News</p>
        <article className="grid gap-6 border-y border-[#D5D8DE] py-6 md:grid-cols-[1.2fr_0.8fr] md:items-center md:gap-10 md:py-8">
          <Link href={`/news/${story.slug}`} className="group block overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]" aria-label={`Read featured story: ${story.title}`}>
            <StoryImage story={story} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
              <span className="font-semibold uppercase tracking-[0.12em] text-[#CC1111]">{category || "News"}</span>
              <time className="text-[#687080]" dateTime={story.published_at || undefined}>{published || "Date unavailable"}</time>
            </div>
            <Link href={`/news/${story.slug}`} className="group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]">
              <h2 id="big-news-title" className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.045em] transition-colors group-hover:text-[#1A3BBF] md:text-4xl" style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}>{story.title}</h2>
            </Link>
            {story.excerpt && <p className="mt-3 text-sm leading-6 text-[#4B5260] sm:text-base sm:leading-7">{story.excerpt}</p>}
            {story.author_name?.trim() && <p className="mt-4 text-sm font-medium text-[#252832]">By {story.author_name.trim()}</p>}
          </div>
        </article>
      </div>
    </section>
  );
}

function WatchSectionFrame({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="meritlives-watch-title" className="border-t border-[#D5D8DE] bg-white text-[#0D0D0D]">
      <div className="ml-container py-14 md:py-18 lg:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[#D5D8DE] pb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#CC1111]">Stories in motion</p>
            <h2
              id="meritlives-watch-title"
              className="mt-3 text-4xl font-medium leading-none tracking-[-0.06em] sm:text-5xl md:text-6xl"
              style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
            >
              MERITLIVES <span className="text-[#CC1111]">Watch</span>
            </h2>
          </div>
          <Link href="/watch" className="text-sm font-semibold text-[#1A3BBF] underline underline-offset-4">Explore all videos</Link>
        </div>
        {children}
      </div>
    </section>
  );
}

async function WatchSectionContent() {
  try {
    const result = await getWatchVideos(1, 12);
    return <WatchSectionFrame><FeaturedWatchCarousel videos={result.data} /></WatchSectionFrame>;
  } catch {
    return (
      <WatchSectionFrame>
        <p role="status" className="border-y border-[#D5D8DE] py-8 text-sm text-[#5D6472]">
          MERITLIVES Watch is temporarily unavailable. Please try again later.
        </p>
      </WatchSectionFrame>
    );
  }
}

export function MeritlivesWatch() {
  return (
    <Suspense fallback={<WatchSectionFrame><FeaturedWatchLoading /></WatchSectionFrame>}>
      <WatchSectionContent />
    </Suspense>
  );
}
export function IntroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#0B0F17]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "linear-gradient(to bottom, black, transparent 85%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)",
        }}
      />

      <div className="ml-container relative z-10 py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <p className="ml-eyebrow text-[#8fb0ff]">What we do</p>
            <h2 className="mt-5 max-w-xl text-3xl font-medium tracking-tight text-white md:text-5xl">
              Technology that solves something real.
            </h2>
          </div>

          <div className="max-w-2xl">
            <p className="text-base leading-7 text-white/70 md:text-lg">
              We work across digital products, software engineering and practical innovation to help organisations turn opportunity into action.
            </p>

            <div className="mt-6">
              <Link
                href="/services"
                className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/75 transition-colors duration-200 hover:text-[#8fb0ff]"
              >
                Discover our capabilities
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#0D0D0D]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-20 h-90 w-90 rounded-full bg-[#CC1111]/10 blur-3xl" />

      <div className="ml-container relative z-10 py-16 lg:py-20">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ml-eyebrow text-[#8fb0ff]">Selected products</p>
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-white md:text-5xl">
              Products designed for everyday value.
            </h2>
          </div>

          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/75 transition-colors duration-200 hover:text-[#CC1111]"
          >
            View all products
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#101827] p-2 md:p-3">
          <ProductsList products={products.slice(0, 2)} />
        </div>
      </div>
    </section>
  );
}

export function FeaturedServices({ services }: { services: Service[] }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#0D0D0D]">
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-10 h-75 w-75 rounded-full border border-[#1A3BBF]/30" />

      <div className="ml-container relative z-10 py-16 lg:py-20">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ml-eyebrow text-[#8fb0ff]">Selected services</p>
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-white md:text-5xl">
              Services built for momentum.
            </h2>
          </div>

          <Link
            href="/services"
            className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/75 transition-colors duration-200 hover:text-[#8fb0ff]"
          >
            Explore all services
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#101827] p-2 md:p-3">
          <ServicesList services={services.slice(0, 2)} />
        </div>
      </div>
    </section>
  );
}
