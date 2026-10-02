import Link from "next/link";
import type { Product, Service } from "../types/api";
import ProductsList from "./ProductsList";
import ServicesList from "./ServicesList";

/* =========================================================
   INTRO
========================================================= */

export function IntroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#0d0e0e]">
      {/* Technical background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "linear-gradient(to bottom, black, transparent 85%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black, transparent 85%)",
        }}
      />

      <div className="ml-container relative z-10 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          {/* Left */}
          <div>
            <div className="ml-eyebrow">What we do</div>

            <h2 className="ml-heading-lg mt-5 max-w-xl text-white">
              Technology should solve something real.
            </h2>
          </div>

          {/* Right */}
          <div className="max-w-2xl">
            <p className="ml-body-lg text-white/65">
              We work across technology, digital innovation and learning to
              create solutions that are useful, accessible and built around
              the people who use them.
            </p>

            <div className="mt-8">
              <Link
                href="/services"
                className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-white/65 transition-colors duration-200 hover:text-[#c8ff00]"
              >
                Discover our capabilities

                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* =========================================================
   FEATURED PRODUCTS
========================================================= */

export function FeaturedProducts({
  products,
}: {
  products: Product[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#080909]">
      {/* Decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[#c8ff00]/[0.035] blur-3xl"
      />

      <div className="ml-container relative z-10 py-24 lg:py-32">
        {/* Heading */}
        <div className="mb-14 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="ml-eyebrow">Our products</div>

            <h2 className="ml-heading-lg mt-5 max-w-2xl text-white">
              Digital tools built to create value.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/50">
              Explore products and platforms designed to make everyday work,
              learning and digital experiences better.
            </p>
          </div>

          <Link
            href="/products"
            className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-white/65 transition-colors duration-200 hover:text-[#c8ff00]"
          >
            View all products

            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>

        {/* Products */}
        <div className="overflow-hidden rounded-[20px] border border-white/[0.10] bg-[#121313]">
          <ProductsList products={products.slice(0, 3)} />
        </div>
      </div>
    </section>
  );
}


/* =========================================================
   FEATURED SERVICES
========================================================= */

export function FeaturedServices({
  services,
}: {
  services: Service[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#0d0e0e]">
      {/* Decorative geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full border border-white/[0.035]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full border border-[#c8ff00]/[0.06]"
      />

      <div className="ml-container relative z-10 py-24 lg:py-32">
        {/* Heading */}
        <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="ml-eyebrow">Our services</div>

            <h2 className="ml-heading-lg mt-5 max-w-2xl text-white">
              From ideas to implementation.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/50">
              Practical technology and digital services for people,
              businesses and organisations ready to move forward.
            </p>
          </div>

          <Link
            href="/services"
            className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-white/65 transition-colors duration-200 hover:text-[#c8ff00]"
          >
            Explore all services

            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>

        {/* Services */}
        <div className="overflow-hidden rounded-[20px] border border-white/[0.10] bg-[#121313]">
          <ServicesList services={services.slice(0, 3)} />
        </div>
      </div>
    </section>
  );
}


/* =========================================================
   FINAL CTA
========================================================= */

export function HomeCTA() {
  return (
    <section className="relative overflow-hidden bg-[#080909]">
      <div className="ml-container py-24 lg:py-32">
        <div className="ml-cta">
          {/* Decorative circles */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-40 h-[500px] w-[500px] rounded-full border border-[#c8ff00]/[0.10]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-16 h-[340px] w-[340px] rounded-full border border-white/[0.06]"
          />

          {/* Lime glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 top-0 h-[300px] w-[300px] rounded-full bg-[#c8ff00]/[0.06] blur-3xl"
          />

          <div className="ml-cta-content grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="ml-eyebrow">
                Start a conversation
              </div>

              <h2 className="ml-cta-title mt-5">
                Have a challenge worth solving?
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/55">
                Tell us what you are working on. We would be glad to explore
                what technology could make possible.
              </p>
            </div>

            <Link
              href="/contact"
              className="ml-btn ml-btn-lime"
            >
              Talk to Meritlives

              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}