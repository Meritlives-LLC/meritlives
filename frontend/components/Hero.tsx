import Link from "next/link";
import type { NewsItem, Product, Service } from "../types/api";

function getPreviewTitle(item: Product | Service | NewsItem | undefined, fallback: string) {
  if (!item) return fallback;

  if ("name" in item && typeof item.name === "string" && item.name.trim()) {
    return item.name;
  }

  if ("title" in item && typeof item.title === "string" && item.title.trim()) {
    return item.title;
  }

  return fallback;
}

export default function Hero({
  products = [],
  services = [],
  news = [],
}: {
  products?: Product[];
  services?: Service[];
  news?: NewsItem[];
}) {
  const featuredProduct = products[0];
  const featuredService = services[0];
  const latestNews = news[0];

  const discoveryItems = [
    {
      index: "01",
      title: "Products",
      href: "/products",
      accent: "text-[#1A3BBF]",
      marker: "bg-[#1A3BBF]",
      summary: featuredProduct
        ? featuredProduct.short_description || "Digital products built for real-world impact."
        : "Digital products built for real-world impact.",
      detail: featuredProduct ? featuredProduct.name : "Explore the MERITLIVES product portfolio",
    },
    {
      index: "02",
      title: "Services",
      href: "/services",
      accent: "text-[#CC1111]",
      marker: "bg-[#CC1111]",
      summary: featuredService
        ? featuredService.short_description || "Technology services designed around practical needs."
        : "Technology services designed around practical needs.",
      detail: featuredService ? featuredService.name : "See how we help teams build and scale",
    },
    {
      index: "03",
      title: "News",
      href: "/news",
      accent: "text-[#3A3F52]",
      marker: "bg-[#3A3F52]",
      summary: latestNews
        ? latestNews.excerpt || "A closer look at ideas, launches and momentum across the ecosystem."
        : "A closer look at ideas, launches and momentum across the ecosystem.",
      detail: latestNews ? getPreviewTitle(latestNews, "Latest updates") : "Latest updates",
    },
  ];

  return (
    <section className="relative overflow-hidden border-b border-[#DDE2ED] bg-white text-[#0D0D0D]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[8%] top-[-10rem] hidden h-[34rem] w-[34rem] rounded-full border border-[#DDE2ED] lg:block" />
        <div className="absolute right-[12%] top-[-6rem] hidden h-[25rem] w-[25rem] rounded-full border border-[#1A3BBF]/15 lg:block" />
        <div className="absolute right-[calc(12%+12.45rem)] top-0 hidden h-24 w-px bg-[#CC1111]/70 lg:block" />
      </div>

      <div className="relative mx-auto w-full max-w-[1440px] px-6 py-14 sm:px-10 md:py-20 lg:px-16 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_0.7fr] lg:items-end lg:gap-20">
          <div className="relative">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3A3F52]">
              <span className="h-px w-9 bg-[#CC1111]" aria-hidden="true" />
              MERITLIVES · Technology for Africa
            </p>

            <h1
              className="mt-8 text-[clamp(3.6rem,9vw,8.5rem)] font-medium leading-[0.91] tracking-[-0.075em] text-[#0D0D0D]"
              style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
            >
              <span className="block">Built on Merit.</span>
              <span className="block">Built for <span className="text-[#CC1111]">Africa.</span></span>
            </h1>

            <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <p className="max-w-xl text-base leading-7 text-[#3A3F52] md:text-lg md:leading-8">
                We build technology, digital products and solutions that contribute to Africa’s digital future.
              </p>
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 justify-self-start border-b border-[#8892A4] pb-1 text-sm font-medium text-[#0D0D0D] transition-colors hover:border-[#CC1111] hover:text-[#CC1111] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A3BBF]"
              >
                About MERITLIVES
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">↗</span>
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.18em] text-[#8892A4]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1A3BBF]" aria-hidden="true" />
              Abuja, Nigeria
              <span className="mx-1 h-3 w-px bg-[#DDE2ED]" aria-hidden="true" />
              Built for the continent
            </div>
          </div>

          <nav aria-label="Discover MERITLIVES" className="relative lg:pb-2">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8892A4]">
              Discover
            </p>
            <div className="border-t border-[#DDE2ED]">
              {discoveryItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group block border-b border-[#DDE2ED] py-4 outline-none focus-visible:bg-[#F2F4F8] sm:py-5"
                  aria-label={`Explore ${item.title}: ${item.detail}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${item.marker}`} aria-hidden="true" />
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${item.accent}`}>
                      {item.index} / {item.title}
                    </span>
                    <span aria-hidden="true" className="ml-auto text-lg text-[#8892A4] transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1">
                      ↗
                    </span>
                  </span>

                  <span className="mt-2 block pl-[1.125rem] text-base font-medium tracking-tight text-[#0D0D0D] sm:text-lg">
                    {item.detail}
                  </span>
                  <span className="mt-0 block max-h-0 overflow-hidden pl-[1.125rem] text-sm leading-6 text-[#3A3F52] opacity-0 transition-[max-height,opacity,margin] duration-200 group-hover:mt-2 group-hover:max-h-24 group-hover:opacity-100 group-focus-visible:mt-2 group-focus-visible:max-h-24 group-focus-visible:opacity-100 motion-reduce:transition-none max-md:mt-2 max-md:max-h-24 max-md:opacity-100">
                    {item.summary}
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </section>
  );
}