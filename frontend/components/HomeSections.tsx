import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import type { NewsItem, Product, Service } from "../types/api";
import { formatNewsDate, getExternalNewsSource, getNewsCategoryLabel } from "../lib/news-presentation";
import { getWatchVideos } from "../lib/watch-queries";
import ProductsList from "./ProductsList";
import ServicesList from "./ServicesList";
import { WatchVideoGrid, WatchVideoLoading } from "./WatchVideoGrid";

function StoryMetadata({ story }: { story: NewsItem }) {
  const date = formatNewsDate(story.published_at);
  const author = story.author_name?.trim();
  const source = getExternalNewsSource(story);

  if (!author && !source && !date) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-[#5D6472]">
      {(author || date) && (
        <span>
          {author && <><span className="font-semibold text-[#252832]">By </span>{author}</>}
          {author && date && <> {"\u00b7"} </>}
          {date && <><span className="font-semibold text-[#252832]">Published </span><time dateTime={story.published_at || undefined}>{date}</time></>}
        </span>
      )}
      {source && <span className="wrap-break-word">Source: {source.name}</span>}
    </div>
  );
}

function StoryImage({ story }: { story: NewsItem }) {
  const imageUrl = story.featured_image || story.image_url;

  return (
    <div className="relative aspect-16/10 overflow-hidden bg-[#F2F4F8]">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none"
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
  const [leadStory, ...supportingStories] = stories;
  const sideStories = supportingStories.slice(0, 1);
  const additionalStories = supportingStories.slice(1);

  return (
    <section aria-labelledby="featured-stories-title" className="bg-white text-[#0D0D0D]">
      <div className="ml-container py-16 md:py-20 lg:py-24">
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

        {leadStory ? (
          <>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.75fr)] lg:gap-10 xl:gap-14">
              <article>
                <Link
                  href={`/news/${leadStory.slug}`}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]"
                  aria-label={`Read featured story: ${leadStory.title}`}
                >
                  <StoryImage story={leadStory} />
                  <div className="mt-5 max-w-3xl md:mt-6">
                    {getNewsCategoryLabel(leadStory) && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1A3BBF]">
                        {getNewsCategoryLabel(leadStory)}
                      </p>
                    )}
                    <h3
                      className="mt-2 text-[2rem] font-semibold leading-[1.04] tracking-tighter transition-colors group-hover:text-[#1A3BBF] sm:text-4xl md:text-5xl xl:text-[3.5rem]"
                      style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
                    >
                      {leadStory.title}
                    </h3>
                    {leadStory.excerpt && (
                      <p className="mt-4 max-w-2xl text-base leading-7 text-[#3A3F52] md:text-[1.0625rem]">
                        {leadStory.excerpt}
                      </p>
                    )}
                    <StoryMetadata story={leadStory} />
                  </div>
                </Link>
              </article>

              {sideStories.length > 0 && (
                <aside aria-label="More featured stories" className="border-t border-[#D5D8DE] lg:border-l lg:border-t-0 lg:pl-8">
                  <div className="divide-y divide-[#D5D8DE]">
                    {sideStories.map((story) => (
                      <article key={story.id} className="py-6 first:pt-6 lg:py-6 lg:first:pt-0">
                        <Link
                          href={`/news/${story.slug}`}
                          className="group grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF] sm:grid-cols-[9rem_minmax(0,1fr)] lg:grid-cols-1"
                          aria-label={`Read story: ${story.title}`}
                        >
                          <StoryImage story={story} />
                          <div>
                            {getNewsCategoryLabel(story) && (
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#CC1111]">
                                {getNewsCategoryLabel(story)}
                              </p>
                            )}
                            <h3
                              className="mt-1 text-lg font-semibold leading-snug tracking-tight text-[#0D0D0D] transition-colors group-hover:text-[#1A3BBF] sm:text-xl"
                              style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
                            >
                              {story.title}
                            </h3>
                            <StoryMetadata story={story} />
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </aside>
              )}
            </div>

            {additionalStories.length > 0 && (
              <div className="mt-10 border-t border-[#D5D8DE] pt-7 md:mt-12 md:pt-9">
                {additionalStories.map((story, index) => (
                  <article key={story.id} className={index > 0 ? "mt-7 border-t border-[#D5D8DE] pt-7" : ""}>
                    <Link
                      href={`/news/${story.slug}`}
                      className="group grid items-center gap-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF] sm:grid-cols-[minmax(0,1fr)_minmax(15rem,0.8fr)] sm:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:gap-12"
                      aria-label={`Read story: ${story.title}`}
                    >
                      <div className="sm:py-3">
                        {getNewsCategoryLabel(story) && (
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1A3BBF]">
                            {getNewsCategoryLabel(story)}
                          </p>
                        )}
                        <h3
                          className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.04em] transition-colors group-hover:text-[#CC1111] sm:text-3xl md:text-4xl"
                          style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
                        >
                          {story.title}
                        </h3>
                        {story.excerpt && <p className="mt-3 max-w-2xl text-sm leading-6 text-[#3A3F52] sm:text-base sm:leading-7">{story.excerpt}</p>}
                        <StoryMetadata story={story} />
                      </div>
                      <StoryImage story={story} />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </>
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
    const result = await getWatchVideos(1, 3);

    if (result.data.length === 0) {
      return (
        <WatchSectionFrame>
          <p className="border-y border-[#D5D8DE] py-8 text-sm text-[#5D6472]">No Watch videos are available right now.</p>
        </WatchSectionFrame>
      );
    }

    return <WatchSectionFrame><WatchVideoGrid videos={result.data} /></WatchSectionFrame>;
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
    <Suspense fallback={<WatchSectionFrame><WatchVideoLoading compact /></WatchSectionFrame>}>
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
