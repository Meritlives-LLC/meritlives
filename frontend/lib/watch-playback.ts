import type { WatchVideo } from "../types/watch";

export function getWatchEmbedUrl(video: Pick<WatchVideo, "video_url" | "youtube_video_id">): string | null {
  const expectedId = video.youtube_video_id;
  if (!/^[A-Za-z0-9_-]{11}$/.test(expectedId) || !video.video_url) return null;

  try {
    const url = new URL(video.video_url);
    if (url.protocol !== "https:" || url.port) return null;

    const watchId = ["youtube.com", "www.youtube.com"].includes(url.hostname)
      && url.pathname === "/watch"
      ? url.searchParams.get("v")
      : null;
    const shortId = url.hostname === "youtu.be"
      ? url.pathname.replace(/^\//, "").split("/")[0]
      : null;
    const validatedId = watchId ?? shortId;

    if (validatedId !== expectedId) return null;

    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(validatedId)}?autoplay=1&rel=0`;
  } catch {
    return null;
  }
}
