import { notFound } from "next/navigation";
import { getProduct } from "../../../lib/queries";
import Link from "next/link";
import { getCatalogueProduct } from "../../../lib/product-catalogue";

export default async function ProductPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = await paramsPromise;
  const catalogueProduct = getCatalogueProduct(params.slug);

  if (catalogueProduct) {
    return (
      <main className="min-h-[60vh] bg-white text-[#111827]">
        <section className="border-b border-[#eceef1] bg-[radial-gradient(ellipse_at_78%_28%,rgba(215,25,32,.08),transparent_36%),linear-gradient(180deg,#fff_0%,#fafafa_100%)] py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_.55fr] lg:items-center">
            <div>
              <Link href="/products" className="text-sm font-semibold text-[#a81419] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">← All products</Link>
              <p className="mt-10 text-xs font-bold uppercase tracking-[.18em] text-[#b9151b]">MERITLIVES product</p>
              <h1 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.05em] text-[#111827] sm:text-5xl">{catalogueProduct.name}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#596273]">{catalogueProduct.description}</p>
              <p className="mt-5 inline-flex rounded-full bg-[#f3f4f6] px-3 py-1.5 text-xs font-semibold text-[#596273]">
                {catalogueProduct.destinationVerified ? "Access link provided" : "Platform destination being verified"}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {catalogueProduct.destination ? (
                  <a href={catalogueProduct.destination} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[#d71920] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">
                    Visit {catalogueProduct.name}<span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[#d71920] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Ask about this product<span aria-hidden="true">↗</span></Link>
                )}
                <Link href="/contact" className="inline-flex min-h-12 items-center rounded-md border border-[#d1d5db] bg-white px-5 py-3 text-sm font-semibold text-[#202938] transition hover:border-[#d71920] hover:text-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Contact MERITLIVES</Link>
              </div>
            </div>
            <div aria-hidden="true" className="relative mx-auto grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-[2rem] border border-[#e5e7eb] bg-white shadow-[0_24px_70px_rgba(17,24,39,.10)]">
              <div className="absolute h-[75%] w-[75%] rounded-full border border-[#d71920]/10" />
              <div className="absolute h-[55%] w-[55%] rounded-full border border-[#111827]/[0.07]" />
              <span className="relative grid h-24 w-24 place-items-center rounded-2xl bg-[#d71920] text-3xl font-bold tracking-[-.06em] text-white shadow-[0_20px_45px_rgba(215,25,32,.25)]" aria-hidden="true">{catalogueProduct.name.slice(0, 1)}</span>
              <span className="absolute bottom-6 text-[10px] font-bold uppercase tracking-[.18em] text-[#7b8492]">Illustrative brand visual</span>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="max-w-3xl rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-[#111827]">Product information</h2>
            <p className="mt-2 text-sm leading-7 text-[#596273]">We’re confirming current product details before publishing feature descriptions. Contact MERITLIVES for accurate information about availability and access.</p>
          </div>
        </section>
      </main>
    );
  }

  try {
    const result = await getProduct(params.slug);
    const product = result.data;

    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider">Product</p>
        <h1 className="mt-3 text-5xl font-bold">{product.name}</h1>
        {product.short_description && (
          <p className="mt-5 max-w-3xl text-xl opacity-75">{product.short_description}</p>
        )}
        {product.description && (
          <div
            className="prose mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}
        {product.features?.length ? (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Features</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {product.features.map((feature) => (
                <div key={feature.id} className="rounded-2xl border p-5">
                  <h3 className="font-semibold">{feature.name}</h3>
                  {feature.description && (
                    <p className="mt-2 opacity-75">{feature.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    );
  } catch {
    notFound();
  }
}
