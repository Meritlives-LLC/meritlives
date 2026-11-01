"use client";

import { useEffect, useRef } from "react";
import { getWatchEmbedUrl } from "../lib/watch-playback";
import type { WatchVideo } from "../types/watch";

export function WatchVideoPlayer({ video, onClose }: { video: WatchVideo | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const embedUrl = video ? getWatchEmbedUrl(video) : null;
  const isOpen = video !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [isOpen, video?.id]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={video ? `Playing ${video.title}` : "Video player"}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[min(92dvh,56rem)] w-[min(96vw,80rem)] max-w-none overflow-visible border-0 bg-transparent p-0 text-white backdrop:bg-black/85"
    >
      {video && (
        <section className="overflow-hidden rounded-xl bg-[#111827] shadow-2xl">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
            <h2 className="min-w-0 truncate text-sm font-semibold sm:text-base">{video.title}</h2>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Close video player"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          {embedUrl ? (
            <div className="aspect-video w-full bg-black">
              <iframe
                key={video.id}
                src={embedUrl}
                title={video.title}
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <p role="status" className="px-6 py-10 text-center text-sm text-white/75">This video is unavailable.</p>
          )}
        </section>
      )}
    </dialog>
  );
}
