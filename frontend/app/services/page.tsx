import Link from "next/link";
import ServicesList from "../../components/ServicesList";
import { getServices } from "../../lib/queries";
import type { Paginated, Service } from "../../types/api";

export const metadata = {
  title: "Technology Services",
  description: "Explore MERITLIVES services in software development, fintech, e-learning, automation, cybersecurity and ongoing technology support.",
};

export default async function ServicesPage() {
  let catalogue: Paginated<Service> | null = null;
  try {
    catalogue = await getServices("?per_page=50&page=1");
  } catch {
    // Curated marketing content remains available during a CMS/API outage.
  }

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <header className="bg-white">
        <div className="ml-container py-14 sm:py-20 lg:py-24">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#b9151b]">What we do</p>
          <h1 className="mt-5 max-w-5xl font-[var(--font-heading)] text-4xl font-semibold leading-[1.07] tracking-[-.05em] text-[#111827] sm:text-6xl lg:text-7xl">Technology services built around your ambitions.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#596273] sm:text-lg">From custom software and digital learning platforms to business automation and cybersecurity, MERITLIVES helps organizations build, improve and maintain the technology they depend on.</p>
        </div>
      </header>
      <ServicesList services={catalogue?.data ?? []} pagination={catalogue?.meta} unavailable={!catalogue} />
      <section aria-labelledby="services-contact-title" className="border-t border-[#f0d7d7] bg-[#fff3f2] py-14 sm:py-20">
        <div className="ml-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">Start a conversation</p><h2 id="services-contact-title" className="mt-4 font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] text-[#111827] sm:text-4xl lg:text-5xl">Have a technology project in mind?</h2><p className="mt-5 text-base leading-8 text-[#596273]">Tell us what you want to build, improve or secure.</p></div>
          <Link href="/contact" style={{ color: "#ffffff" }} className="inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-md bg-[#d71920] px-7 py-3 text-sm font-semibold text-[#ffffff] shadow-sm transition hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] motion-reduce:transition-none">Let&apos;s Talk<span aria-hidden="true">&rarr;</span></Link>
        </div>
      </section>
    </main>
  );
}
