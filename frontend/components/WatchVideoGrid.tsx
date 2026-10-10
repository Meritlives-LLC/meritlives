import Image from "next/image";
import Link from "next/link";
import type { WatchVideo } from "../types/watch";

function youtubeUrl(videoId: string): string | null {
  return /^[A-Za-z0-9_-]{11}$/.test(videoId)
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    : null;
}

function thumbnailUrl(value?: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol === "https:" && ["i.ytimg.com", "img.youtube.com"].includes(url.hostname)) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function WatchVideoCard({ video }: { video: WatchVideo }) {
  const href = youtubeUrl(video.youtube_video_id);
  const image = thumbnailUrl(video.thumbnail_url);

  return (
    <article className="group min-w-0">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Watch ${video.title} on YouTube (opens in a new tab)`}
          className="block overflow-hidden bg-[#F0F1F3]"
        >
          {image ? (
            <Image
              src={image}
              alt=""
              width={640}
              height={360}
              className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="grid aspect-video place-items-center text-xs text-[#5D6472]">Thumbnail unavailable</div>
          )}
        </a>
      ) : (
        <div className="grid aspect-video place-items-center bg-[#F0F1F3] text-xs text-[#5D6472]">Video unavailable</div>
      )}

      <div className="pt-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#737B89]">
          {video.source_name && <span>{video.source_name}</span>}
          {video.source_name && video.category && <span aria-hidden="true">·</span>}
          {video.category && <span>{video.category}</span>}
          {video.is_featured && <span className="text-[#CC1111]">Featured</span>}
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight text-[#171A20]">
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#1A3BBF]">
              {video.title}
            </a>
          ) : video.title}
        </h3>
        {video.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#5D6472]">{video.description}</p>}
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-xs font-semibold text-[#1A3BBF] underline underline-offset-4">
            Watch video <span className="sr-only">: {video.title}</span>
          </a>
        )}
      </div>
    </article>
  );
}

export function WatchVideoGrid({ videos }: { videos: WatchVideo[] }) {
  return (
    <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => <WatchVideoCard key={video.id} video={video} />)}
    </div>
  );
}

export function WatchPagination({ currentPage, lastPage }: { currentPage: number; lastPage: number }) {
  if (lastPage <= 1) return null;

  return (
    <nav aria-label="Watch video pages" className="mt-12 flex items-center justify-between border-t border-[#D5D8DE] pt-5 text-sm">
      {currentPage > 1 ? (
        <Link href={`/watch?page=${currentPage - 1}`} rel="prev" className="font-semibold text-[#1A3BBF] underline underline-offset-4">Previous videos</Link>
      ) : <span aria-hidden="true" />}
      <span className="text-xs text-[#737B89]">Page {currentPage} of {lastPage}</span>
      {currentPage < lastPage ? (
        <Link href={`/watch?page=${currentPage + 1}`} rel="next" className="font-semibold text-[#1A3BBF] underline underline-offset-4">Next videos</Link>
      ) : <span aria-hidden="true" />}
    </nav>
  );
}

export function WatchVideoLoading({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-label="Loading Watch videos" aria-live="polite" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: compact ? 3 : 6 }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-video bg-[#ECEEF1]" />
          <div className="mt-4 h-3 w-1/3 bg-[#ECEEF1]" />
          <div className="mt-3 h-5 w-4/5 bg-[#ECEEF1]" />
          <div className="mt-2 h-4 w-full bg-[#ECEEF1]" />
        </div>
      ))}
    </div>
  );
}
