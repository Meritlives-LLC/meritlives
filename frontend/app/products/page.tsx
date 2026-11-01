import Link from "next/link";
import ProductsList from "../../components/ProductsList";

export const metadata = {
  title: "Products | MERITLIVES LLC",
  description: "Explore digital products from MERITLIVES and find verified platform access details.",
};

export default function ProductsPage() {
  return (
    <main className="bg-white text-[#111827]">
      <section className="border-b border-[#eceef1] bg-[radial-gradient(ellipse_at_78%_28%,rgba(215,25,32,.08),transparent_36%),linear-gradient(180deg,#fff_0%,#fafafa_100%)] py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#b9151b]">MERITLIVES products</p>
            <h1 className="mt-5 max-w-3xl font-[var(--font-heading)] text-4xl font-semibold leading-[1.05] tracking-[-.05em] text-[#111827] sm:text-5xl lg:text-6xl">Technology Products Built to Move Business Forward.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#596273] sm:text-lg">Explore the MERITLIVES product ecosystem: digital platforms built for different needs. We clearly mark details that still need confirmation.</p>
            <a href="#catalogue" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-md bg-[#d71920] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Explore products<span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>

      <section id="catalogue" className="scroll-mt-24 py-14 sm:py-18 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-9 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">Product catalogue</p>
              <h2 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] text-[#111827] sm:text-4xl">Find a product</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#596273]">Platform links are shown only where their destination has been provided and verified. Other product details remain clearly marked.</p>
          </div>
          <ProductsList />
        </div>
      </section>

      <section className="bg-[#f7f7f6] py-14 sm:py-18 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-7 px-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">Have an idea?</p>
            <h2 className="mt-3 max-w-3xl font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] text-[#111827] sm:text-4xl">Need a digital product built for your business?</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#596273]">Tell us about the people it should serve, the problem it should address, and any systems it needs to work with.</p>
          </div>
          <Link href="/contact" className="inline-flex min-h-12 w-fit items-center gap-3 rounded-md bg-[#d71920] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Discuss a product idea<span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  );
}
