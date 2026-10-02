import Link from "next/link";

const capabilities = [
  {
    number: "01",
    title: "Digital products",
    description:
      "Thoughtful digital experiences designed around real people and practical needs.",
  },
  {
    number: "02",
    title: "Software engineering",
    description:
      "Reliable web and software solutions built with clarity, performance and purpose.",
  },
  {
    number: "03",
    title: "Education",
    description:
      "Learning experiences that make useful technology and skills more accessible.",
  },
  {
    number: "04",
    title: "Innovation",
    description:
      "New ideas explored through technology, experimentation and practical problem-solving.",
  },
];

export default function Hero() {
  return (
    <section className="ml-hero-bg relative overflow-hidden border-b border-white/[0.08]">
      {/* Decorative geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Lime glow */}
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#c8ff00]/[0.06] blur-3xl" />

        {/* Large geometric ring */}
        <div className="absolute -right-32 top-24 h-[560px] w-[560px] rounded-full border border-[#c8ff00]/[0.10]" />

        <div className="absolute -right-12 top-44 h-[420px] w-[420px] rounded-full border border-white/[0.06]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 45%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 45%, transparent 100%)",
          }}
        />
      </div>

      <div className="ml-container relative z-10">
        <div className="grid min-h-[760px] items-center gap-16 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24 lg:py-28">
          {/* =====================================================
              LEFT
          ====================================================== */}
          <div className="max-w-4xl">
            <div className="ml-eyebrow">
              Technology · Innovation · Impact
            </div>

            <h1 className="mt-7 ml-display text-white">
              Building
              <br />
              technology
              <br />
              <span className="text-[#c8ff00]">
                that moves
              </span>
              <br />
              people forward.
            </h1>

            <p className="ml-body-lg mt-9 max-w-2xl text-white/65">
              Meritlives brings together technology, digital innovation,
              education and practical problem-solving to help people and
              organisations turn ideas into meaningful progress.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="ml-btn ml-btn-lime"
              >
                Explore our work
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/about"
                className="ml-btn ml-btn-ghost"
              >
                Who we are
              </Link>
            </div>

            {/* Location / company */}
            <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-[0.08em] text-white/40">
              <span>Abuja, Nigeria</span>

              <span className="hidden h-1 w-1 rounded-full bg-[#c8ff00] sm:block" />

              <span>A KGC Meritzone Consults Ltd company</span>
            </div>
          </div>

          {/* =====================================================
              RIGHT — WHAT WE BUILD
          ====================================================== */}
          <div className="relative">
            {/* Glow behind card */}
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[36px] bg-[#c8ff00]/[0.035] blur-3xl"
            />

            <div className="ml-card relative overflow-hidden !p-0">
              {/* Card header */}
              <div className="border-b border-white/[0.10] px-7 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#c8ff00]">
                      What we build
                    </p>

                    <p className="mt-2 text-sm text-white/50">
                      Practical solutions with purpose.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c8ff00]/20 bg-[#c8ff00]/[0.08] font-mono text-sm font-bold text-[#c8ff00]">
                    M
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div>
                {capabilities.map((item) => (
                  <div
                    key={item.number}
                    className="group flex gap-5 border-b border-white/[0.08] px-7 py-7 transition-colors duration-200 hover:bg-white/[0.035]"
                  >
                    {/* Number */}
                    <span className="pt-1 font-mono text-[11px] font-medium text-white/25 transition-colors duration-200 group-hover:text-[#c8ff00]">
                      {item.number}
                    </span>

                    {/* Content */}
                    <div>
                      <h2 className="font-[var(--font-heading)] text-base font-semibold tracking-tight text-white">
                        {item.title}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-white/50">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card footer */}
              <div className="bg-white/[0.025] px-7 py-5">
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
      </div>

      {/* Bottom technical line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8ff00]/30 to-transparent"
      />
    </section>
  );
}