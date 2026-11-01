import Link from "next/link";
import Image from "next/image";
import { productCatalogue } from "../lib/product-catalogue";
import type { Product } from "../types/api";

function ProductIcon({ name }: { name: (typeof productCatalogue)[number]["icon"] }) {
  const common = {
    "aria-hidden": true as const,
    focusable: false as const,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-8 w-8",
  };

  switch (name) {
    case "learning":
      return <svg {...common}><path d="m2.5 9 9.5-5 9.5 5-9.5 5-9.5-5Z" /><path d="M6.5 11.2v5.1c3.4 2.4 7.6 2.4 11 0v-5.1M21.5 9v6" /></svg>;
    case "book":
      return <svg {...common}><path d="M12 7.5c-2.1-2-5-2.7-9-2.5v13c4-.2 6.9.5 9 2.5 2.1-2 5-2.7 9-2.5V5c-4-.2-6.9.5-9 2.5Z" /><path d="M12 7.5v13" /></svg>;
    case "messages":
      return <svg {...common}><path d="M20.5 11.5a7.8 7.8 0 0 1-8.2 7.5 9 9 0 0 1-3.7-.8L3 20l1.6-4.4A7.1 7.1 0 0 1 3.5 11.5 7.8 7.8 0 0 1 12 4a7.8 7.8 0 0 1 8.5 7.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" strokeWidth={2.5} /></svg>;
    case "audio":
      return <svg {...common}><path d="M3 13v-2a9 9 0 0 1 18 0v2" /><path d="M3 12h3v7H5a2 2 0 0 1-2-2v-5ZM21 12h-3v7h1a2 2 0 0 0 2-2v-5Z" /><path d="M10 10v4M13 8v8M16 10v4" /></svg>;
    case "people":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1.3A5.5 5.5 0 0 1 9 13.2a5.5 5.5 0 0 1 5.5 5.5V20M16 5.3a3 3 0 0 1 0 5.7M17 13.4a4.7 4.7 0 0 1 3.5 4.5V20" /></svg>;
  }
}

function ArrowIcon() {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M4.5 15.5 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function ProductsList({ products }: { products?: Product[] }) {
  // Keep the existing API-backed card presentation intact for its HomeSections use.
  if (products) {
    if (!products.length) return <p>No products are available yet.</p>;

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="rounded-2xl border p-6">
            {product.logo && <img src={product.logo} alt={`${product.name} logo`} className="mb-5 h-16 w-auto object-contain" />}
            <h2 className="text-xl font-semibold">{product.name}</h2>
            {product.short_description && <p className="mt-2 opacity-75">{product.short_description}</p>}
            <Link href={`/products/${product.slug}`} className="mt-5 inline-block font-medium underline">
              {product.cta_text || "Learn More"}
            </Link>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {productCatalogue.map((product) => (
        <article key={product.slug} id={product.slug} className="group overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_8px_30px_rgba(17,24,39,.04)] transition duration-200 hover:-translate-y-1 hover:border-[#efb8ba] hover:shadow-[0_18px_44px_rgba(17,24,39,.09)]">
          <Image src={product.image} alt={product.imageAlt} width={1200} height={900} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
          <div className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#fff1f1] text-[#d71920]"><ProductIcon name={product.icon} /></span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${product.destinationVerified ? "bg-[#edf7f0] text-[#286a3c]" : "bg-[#f3f4f6] text-[#596273]"}`}>
                {product.destinationVerified ? "Platform link provided" : "External link needs confirmation"}
              </span>
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-[-.025em] text-[#111827]">{product.name}</h2>
            <p className="mt-3 min-h-[4.5rem] text-sm leading-7 text-[#596273]">{product.description}</p>
            {product.destination ? (
              <a href={product.destination} target="_blank" rel="noopener noreferrer" aria-label={`Visit Product: ${product.name} (opens in a new tab)`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#d71920] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d71920]">
                Visit Product<ArrowIcon />
              </a>
            ) : (
              <Link href={`/products/${product.slug}`} aria-label={`Visit Product: ${product.name}. External destination pending confirmation.`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-[#d1d5db] bg-white px-4 py-2.5 text-sm font-semibold text-[#202938] transition hover:border-[#d71920] hover:text-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d71920]">
                Visit Product<ArrowIcon />
              </Link>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
