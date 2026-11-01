"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BlogPost, NewsItem } from "../types/api";

type Result = { type: "NEWS"; item: NewsItem } | { type: "BLOG"; item: BlogPost };

function resultHref(result: Result) {
  return `/${result.type === "NEWS" ? "news" : "blog"}/${result.item.slug}`;
}

export default function EditorialSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const latestRequest = useRef(0);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const term = debouncedQuery;
    if (!open || term.length < 2) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }

    const requestId = ++latestRequest.current;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`/api/editorial-search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Search failed");
        return response.json() as Promise<{ data: { news: NewsItem[]; blog: BlogPost[] } }>;
      })
      .then(({ data }) => {
        if (requestId !== latestRequest.current) return;
        const combined: Result[] = [
          ...data.news.map((item) => ({ type: "NEWS" as const, item })),
          ...data.blog.map((item) => ({ type: "BLOG" as const, item })),
        ].sort((a, b) => {
          const dateA = new Date(a.item.published_at ?? 0).getTime();
          const dateB = new Date(b.item.published_at ?? 0).getTime();
          return dateB - dateA;
        });
        setResults(combined.slice(0, 6));
        setActiveIndex(-1);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name === "AbortError") return;
        if (requestId === latestRequest.current) {
          setResults([]);
          setError(true);
        }
      })
      .finally(() => {
        if (requestId === latestRequest.current) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }, []);

  const allResultsHref = `/search?q=${encodeURIComponent(query.trim())}`;
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && query.trim().length >= 2) {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        window.location.assign(resultHref(results[activeIndex]));
      } else {
        window.location.assign(allResultsHref);
      }
    }
  };

  return (
    <section className="relative z-20 bg-white text-[#0D0D0D]" aria-label="Search news and stories">
      <div className="ml-container flex justify-end py-2 sm:py-3">
        <div ref={rootRef} className={`relative w-full transition-[width] duration-300 ease-out sm:w-auto ${open ? "sm:w-[min(100%,34rem)]" : ""}`}>
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group ml-auto flex h-11 w-full items-center justify-between gap-3 rounded-sm border border-[#D5D8DE] px-3.5 text-sm font-medium text-[#252832] transition-colors hover:border-[#1A3BBF] hover:text-[#1A3BBF] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF] sm:w-[200px]"
              aria-expanded="false"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#5D6472]" stroke="currentColor" strokeWidth="1.8"><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></svg>
              <span className="flex-1 text-left">Search stories</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          ) : (
            <div className="animate-[search-in_180ms_ease-out]">
              <div className="flex h-12 items-center gap-3 border-b border-[#0D0D0D]">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="ml-1 h-5 w-5 shrink-0 text-[#5D6472]" stroke="currentColor" strokeWidth="1.8"><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search news & stories..."
                  aria-label="Search news and stories"
                  aria-controls="editorial-search-results"
                  aria-expanded={query.trim().length >= 2}
                  aria-activedescendant={activeIndex >= 0 ? `editorial-result-${activeIndex}` : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#0D0D0D] outline-none placeholder:text-[#747987]"
                />
                {query && <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="px-2 text-xs text-[#5D6472] underline underline-offset-4 hover:text-[#1A3BBF]">Clear</button>}
                <button type="button" onClick={close} aria-label="Close search" className="px-1 text-xl leading-none text-[#5D6472] hover:text-[#0D0D0D]">×</button>
              </div>
              {query.trim().length >= 2 && (
                <div id="editorial-search-results" role="listbox" aria-label="Search results" className="absolute left-0 right-0 top-full z-30 mt-2 border border-[#D5D8DE] bg-white shadow-[0_12px_32px_rgba(13,13,13,0.08)]">
                  {loading ? (
                    <p className="px-4 py-4 text-sm text-[#5D6472]" role="status"><span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border border-[#D5D8DE] border-t-[#1A3BBF] align-[-2px]" />Searching stories...</p>
                  ) : error ? (
                    <p className="px-4 py-4 text-sm text-[#5D6472]" role="status">Search is temporarily unavailable.</p>
                  ) : results.length ? (
                    <>
                      <ul className="divide-y divide-[#ECEEF2]">
                        {results.map((result, index) => (
                          <li key={`${result.type}-${result.item.id}`}>
                            <Link
                              id={`editorial-result-${index}`}
                              role="option"
                              aria-selected={activeIndex === index}
                              href={resultHref(result)}
                              onClick={close}
                              className={`block px-4 py-3 transition-colors hover:bg-[#F8F9FB] focus-visible:bg-[#F8F9FB] focus-visible:outline-none ${activeIndex === index ? "bg-[#F8F9FB]" : ""}`}
                            >
                              <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#1A3BBF]">{result.type}</span>
                              <span className="mt-1 block text-sm font-medium leading-snug text-[#0D0D0D]">{result.item.title}</span>
                              <span className="mt-1 block text-xs text-[#747987]">{result.item.category?.name || (result.type === "BLOG" ? "Insights" : "News")}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link href={allResultsHref} onClick={close} className="flex items-center justify-between border-t border-[#D5D8DE] px-4 py-3 text-sm font-medium text-[#252832] hover:text-[#1A3BBF] focus-visible:outline-2 focus-visible:outline-[#1A3BBF]">
                        View all results <span aria-hidden="true">→</span>
                      </Link>
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-3 px-4 py-4 text-sm text-[#5D6472]">
                      <span>No stories found for “{query.trim()}”</span>
                      <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="shrink-0 text-[#1A3BBF] underline underline-offset-4">Clear search</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`@keyframes search-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </section>
  );
}
