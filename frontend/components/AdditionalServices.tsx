"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getServices } from "../lib/queries";
import { additionalPublishedServices } from "../lib/service-catalogue";
import type { Service } from "../types/api";

type Pagination = { current_page?: number; last_page?: number };
export default function AdditionalServices({ services, pagination, unavailable = false }: {
  services: Service[];
  pagination?: Pagination;
  unavailable?: boolean;
}) {
  const [items, setItems] = useState(() => additionalPublishedServices(services));
  const [page, setPage] = useState(pagination?.current_page ?? (unavailable ? 0 : 1));
  const [lastPage, setLastPage] = useState(pagination?.last_page ?? 1);
  const [error, setError] = useState(unavailable);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const hasMore = page < lastPage;

  async function loadMore() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(false);
    try {
      const response = await getServices(`?per_page=50&page=${page + 1}`);
      setItems(current => additionalPublishedServices(response.data, current));
      const nextPage = response.meta?.current_page ?? page + 1;
      setPage(nextPage);
      setLastPage(response.meta?.last_page ?? nextPage);
    } catch {
      setError(true);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  if (!items.length && !hasMore && !error && !loading) return null;
  return (
    <section aria-labelledby="additional-services-title" className="border-t border-[#eceef1] py-14 sm:py-16">
      <div className="ml-container">
        <h2 id="additional-services-title" className="font-[var(--font-heading)] text-2xl font-semibold tracking-[-.03em] sm:text-3xl">More from MERITLIVES</h2>
        {items.length > 0 && <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map(service => <article key={service.slug.toLowerCase()} className="rounded-xl border border-[#e5e7eb] p-6">
            <h3 className="text-lg font-semibold text-[#111827]">{service.name}</h3>
            {service.short_description && <p className="mt-3 text-sm leading-7 text-[#596273]">{service.short_description}</p>}
            <Link href={`/services/${encodeURIComponent(service.slug)}`} style={{ color: "#b9151b" }} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#b9151b] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Explore Service<span className="sr-only">: {service.name}</span><span aria-hidden="true">&rarr;</span></Link>
          </article>)}
        </div>}
        {error && <p role="status" className="mt-5 text-sm leading-7 text-[#596273]">Additional services are temporarily unavailable. Our core service overview remains available above.</p>}
        {(hasMore || error) && <button type="button" onClick={loadMore} disabled={loading} className="mt-6 inline-flex min-h-11 items-center rounded-md border border-[#d1d5db] bg-white px-5 py-3 text-sm font-semibold text-[#202938] hover:border-[#d71920] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] disabled:cursor-wait disabled:opacity-60">{loading ? "Loading services..." : error ? "Try again" : "Load more services"}</button>}
        {loading && <p role="status" className="mt-3 text-sm text-[#596273]">Loading additional services.</p>}
      </div>
    </section>
  );
}
