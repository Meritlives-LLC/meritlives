"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { getWatchEmbedUrl } from "../lib/watch-playback";
import type { WatchVideo } from "../types/watch";
import { WatchVideoPlayer } from "./WatchVideoPlayer";

function safeThumbnailUrl(value?: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["i.ytimg.com", "img.youtube.com"].includes(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function formatPublishedDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9">
      <path d="M8 5.5v13l10-6.5-10-6.5Z" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
      {direction === "previous" ? <path d="m14.5 5-7 7 7 7M8 12h13" /> : <path d="m9.5 5 7 7-7 7M3 12h13" />}
    </svg>
  );
}

function ExpandableDescription({ storyId, description }: { storyId: number; description: string }) {
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element) return;

    const measure = () => {
      const probe = element.cloneNode(true) as HTMLParagraphElement;
      const desktop = window.matchMedia("(min-width: 640px)").matches;
      probe.style.position = "fixed";
      probe.style.left = "-10000px";
      probe.style.top = "0";
      probe.style.width = `${element.getBoundingClientRect().width}px`;
      probe.style.height = "auto";
      probe.style.maxHeight = "none";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      probe.style.display = "-webkit-box";
      probe.style.webkitBoxOrient = "vertical";
      probe.style.webkitLineClamp = desktop ? "5" : "4";
      probe.style.overflow = "hidden";
      document.body.appendChild(probe);
      const exceedsLimit = probe.scrollHeight > probe.clientHeight + 1;
      probe.remove();
      setCanExpand(exceedsLimit);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [description]);

  return (
    <div className="mt-4">
      <p
        id={`watch-description-${storyId}`}
        ref={descriptionRef}
        className={`break-words text-sm leading-7 text-[#3A3F52] sm:text-base ${expanded ? "" : "line-clamp-4 sm:line-clamp-5"}`}
      >
        {description}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={`watch-description-${storyId}`}
          className="mt-2 inline-flex min-h-8 items-center text-sm font-semibold text-[#1A3BBF] underline underline-offset-4 hover:text-[#0D2280] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3BBF]"
        >
          Read {expanded ? "less" : "more"}
        </button>
      )}
    </div>
  );
}

export function FeaturedWatchCarousel({ videos }: { videos: WatchVideo[] }) {
  const [activeId, setActiveId] = useState<number | null>(videos[0]?.id ?? null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabVisible, setTabVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [manualPauseUntil, setManualPauseUntil] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<WatchVideo | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const foundIndex = videos.findIndex((video) => video.id === activeId);
  const activeIndex = foundIndex >= 0 ? foundIndex : 0;
  const video = videos[activeIndex];
  const thumbnail = video ? safeThumbnailUrl(video.thumbnail_url) : null;
  const canPlay = video ? getWatchEmbedUrl(video) !== null : false;
  const category = video?.category?.trim();
  const source = video?.source_name?.trim();
  const publishedDate = formatPublishedDate(video?.published_at);
  const validStoryIndexes = useMemo(() => videos.reduce<number[]>((indexes, story, index) => {
    if (getWatchEmbedUrl(story)) indexes.push(index);
    return indexes;
  }, []), [videos]);
  const autoplayPaused = hovered || focused || !tabVisible || reducedMotion || playingVideo !== null || manualPauseUntil > Date.now();

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const update = () => {
      const visible = document.visibilityState === "visible";
      setTabVisible(visible);
      if (visible) {
        setManualPauseUntil((until) => until > 0 && until <= Date.now() ? 0 : until);
      }
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (manualPauseUntil <= 0) return;
    const remaining = manualPauseUntil - Date.now();
    if (remaining <= 0) {
      setManualPauseUntil(0);
      return;
    }
    const timeout = window.setTimeout(() => setManualPauseUntil(0), remaining);
    return () => window.clearTimeout(timeout);
  }, [manualPauseUntil]);

  useEffect(() => {
    if (videos.length < 2 || validStoryIndexes.length < 2 || autoplayPaused) return;

    const interval = window.setInterval(() => {
      setActiveId((currentId) => {
        const currentIndex = videos.findIndex((story) => story.id === currentId);
        const nextIndex = validStoryIndexes.find((index) => index > currentIndex) ?? validStoryIndexes[0];
        return videos[nextIndex].id;
      });
    }, 7000);

    return () => window.clearInterval(interval);
  }, [activeId, autoplayPaused, validStoryIndexes, videos]);

  function select(index: number) {
    setManualPauseUntil(Date.now() + 10_000);
    setActiveId(videos[index].id);
  }

  function move(direction: -1 | 1) {
    select((activeIndex + direction + videos.length) % videos.length);
  }

  if (!video) {
    return <p role="status" className="border-y border-[#D5D8DE] py-8 text-sm text-[#5D6472]">No Watch videos are available right now.</p>;
  }

  return (
    <>
      <div
        ref={carouselRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClickCapture={() => setManualPauseUntil(Date.now() + 10_000)}
        onFocusCapture={(event) => {
          setFocused(event.target instanceof HTMLElement && event.target.matches(":focus-visible"));
        }}
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget;
          setFocused(nextTarget instanceof HTMLElement
            && event.currentTarget.contains(nextTarget)
            && nextTarget.matches(":focus-visible"));
        }}
        className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.35fr)] lg:items-stretch lg:gap-12 xl:gap-16"
      >
      <article aria-live="polite" className="order-1 flex min-w-0 flex-col lg:py-3">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A3BBF] sm:text-xs">
            {category && <span>{category}</span>}
            {category && source && <span aria-hidden="true" className="text-[#A5AAB4]">/</span>}
            {source && <span className="text-[#737B89]">{source}</span>}
            {!category && !source && <span className="text-[#737B89]">MERITLIVES Watch</span>}
          </div>

          <h3 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#111827] sm:text-4xl xl:text-[2.8rem]" style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}>
            {video.title || "Video title unavailable"}
          </h3>
          <ExpandableDescription key={video.id} storyId={video.id} description={video.description?.trim() || "No description is available for this video."} />

          {(category || source || publishedDate) && (
            <div className="mt-5 border-t border-[#D5D8DE] pt-4">
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-[#5D6472]">
                {category && <span><span className="font-semibold text-[#252832]">Category </span>{category}</span>}
                {source && <span><span className="font-semibold text-[#252832]">Source </span>{source}</span>}
                {publishedDate && <span><span className="font-semibold text-[#252832]">Published </span><time dateTime={video.published_at ?? undefined}>{publishedDate}</time></span>}
              </p>
            </div>
          )}
        </div>

        <nav aria-label="Featured Watch video navigation" className="mt-8 flex items-center gap-3 lg:mt-auto lg:pt-8">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={videos.length < 2}
            aria-label="Previous video"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#D5D8DE] text-[#111827] transition-colors hover:border-[#1A3BBF] hover:text-[#1A3BBF] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1A3BBF] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowIcon direction="previous" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={videos.length < 2}
            aria-label="Next video"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#D5D8DE] text-[#111827] transition-colors hover:border-[#1A3BBF] hover:text-[#1A3BBF] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1A3BBF] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowIcon direction="next" />
          </button>
          <span className="ml-2 text-xs tabular-nums text-[#737B89]" aria-live="off">{activeIndex + 1} / {videos.length}</span>
        </nav>
      </article>

      <div className="order-2 min-w-0 lg:row-span-1">
        <div role="group" aria-label="Choose a featured video" className="mb-5 flex gap-3 overflow-x-auto py-1 pr-1 lg:justify-end">
          {videos.map((story, index) => {
            const selectorThumbnail = safeThumbnailUrl(story.thumbnail_url);
            const selected = index === activeIndex;

            return (
              <button
                key={story.id}
                type="button"
                onClick={() => select(index)}
                aria-label={`Show story: ${story.title}`}
                aria-pressed={selected}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-[3px] bg-[#F2F4F8] transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1A3BBF] sm:h-[4.25rem] sm:w-[4.25rem] ${selected ? "border-[#1A3BBF]" : "border-transparent hover:border-[#A9B8EA]"}`}
              >
                {selectorThumbnail ? (
                  <Image src={selectorThumbnail} alt="" fill sizes="68px" className="object-cover" />
                ) : (
                  <span aria-hidden="true" className="grid h-full w-full place-items-center text-[10px] font-semibold uppercase tracking-wider text-[#737B89]">Video</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative aspect-video overflow-hidden rounded-xl bg-[#F2F4F8]">
          {thumbnail ? (
            <Image
              key={thumbnail}
              src={thumbnail}
              alt={`Video thumbnail for ${video.title}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          ) : (
            <div role="img" aria-label={`Thumbnail unavailable for ${video.title}`} className="absolute inset-0 grid place-items-center text-sm text-[#5D6472]">
              Thumbnail unavailable
            </div>
          )}
          {canPlay ? (
            <button
              type="button"
              onClick={() => setPlayingVideo(video)}
              aria-label={`Play ${video.title} in the MERITLIVES video player`}
              className="absolute inset-0 grid place-items-center bg-black/10 transition-colors hover:bg-black/20 focus-visible:outline-4 focus-visible:outline-offset-[-6px] focus-visible:outline-white"
            >
              <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-white text-[#CC1111] shadow-sm sm:h-20 sm:w-20">
                <PlayIcon />
              </span>
            </button>
          ) : (
            <p role="status" className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-2 text-center text-xs text-white">Video playback is unavailable.</p>
          )}
        </div>
      </div>
      </div>
      <WatchVideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />
    </>
  );
}

export function FeaturedWatchLoading() {
  return (
    <div aria-label="Loading Watch videos" aria-live="polite" className="grid animate-pulse gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.35fr)] lg:gap-12">
      <div className="order-1 space-y-4 py-3">
        <div className="h-3 w-1/3 bg-[#ECEEF1]" />
        <div className="h-10 w-5/6 bg-[#ECEEF1]" />
        <div className="h-4 w-full bg-[#ECEEF1]" />
        <div className="h-4 w-4/5 bg-[#ECEEF1]" />
      </div>
      <div className="order-2">
        <div className="mb-5 ml-auto flex w-fit gap-3">
          {Array.from({ length: 5 }, (_, index) => <span key={index} className="h-14 w-14 rounded-full bg-[#ECEEF1] sm:h-[4.25rem] sm:w-[4.25rem]" />)}
        </div>
        <div className="aspect-video rounded-xl bg-[#ECEEF1]" />
      </div>
    </div>
  );
}
