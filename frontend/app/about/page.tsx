import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Meritlives LLC",
  description:
    "Learn about Meritlives LLC, our approach to technology, the problems we solve, and the people and ideas behind our work.",
};

const capabilities = [
  {
    number: "01",
    title: "Digital Products",
    description:
      "We design and build digital products that turn ideas, processes and opportunities into useful experiences people can actually interact with.",
  },
  {
    number: "02",
    title: "Software Engineering",
    description:
      "We approach software as a practical tool for solving real problems, combining thoughtful interfaces with reliable technical foundations.",
  },
  {
    number: "03",
    title: "Digital Innovation",
    description:
      "We explore how technology can improve the way people work, learn, communicate, discover information and build businesses.",
  },
  {
    number: "04",
    title: "Education & Training",
    description:
      "We create learning opportunities and practical technology experiences that help people develop useful skills and move forward.",
  },
  {
    number: "05",
    title: "Practical Problem-Solving",
    description:
      "We focus on the problem before the technology, looking for solutions that are understandable, useful and capable of creating meaningful progress.",
  },
];

const principles = [
  {
    number: "01",
    title: "Practical",
    description:
      "Technology should do something useful. We value ideas that can move from conversation to implementation and create a clear outcome.",
  },
  {
    number: "02",
    title: "People-first",
    description:
      "Behind every product, platform or service is a person trying to accomplish something. We design around that reality.",
  },
  {
    number: "03",
    title: "Progress",
    description:
      "We believe meaningful progress often comes from consistent improvement — building, learning, testing and making things better.",
  },
];

const focusAreas = [
  "Technology",
  "Digital innovation",
  "Education",
  "Software",
  "Problem-solving",
  "African markets",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080909] text-white">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#080909]">
        {/* Technical grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />

        {/* Glow */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-[#c8ff00]/[0.07] blur-[110px]" />

        {/* Decorative rings */}
        <div className="pointer-events-none absolute right-[5%] top-[16%] hidden h-72 w-72 rounded-full border border-white/[0.07] lg:block" />
        <div className="pointer-events-none absolute right-[9%] top-[21%] hidden h-56 w-56 rounded-full border border-[#c8ff00]/20 lg:block" />
        <div className="pointer-events-none absolute right-[15%] top-[29%] hidden h-32 w-32 rounded-full border border-white/[0.06] lg:block" />

        <div className="ml-container relative">
          <div
            className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20"
            style={{
              paddingTop: "48px",
              paddingBottom: "96px",
            }}
          >
            {/* Left */}
            <div className="max-w-4xl">
              <div className="mb-8 flex items-center gap-4">
                <span className="h-px w-12 bg-[#c8ff00]" />
                <span className="ml-eyebrow text-[#c8ff00]">
                  ABOUT MERITLIVES
                </span>
              </div>

              <h1 className="ml-display max-w-4xl text-white">
                Technology built
                <br />
                <span className="text-white">around </span>
                <span className="text-[#c8ff00]">people.</span>
              </h1>

              <p className="ml-body-lg mt-8 max-w-2xl text-white/65">
                Meritlives LLC brings together technology, digital innovation,
                education and practical problem-solving to help individuals
                and organisations make meaningful progress.
              </p>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/45">
                We believe technology is most valuable when it makes something
                clearer, easier, more accessible or more possible. That idea
                influences how we think about products, software, learning and
                the problems we choose to work on.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="ml-btn ml-btn-lime"
                >
                  Work with us
                  <span aria-hidden="true">↗</span>
                </Link>

                <Link
                  href="/about/team"
                  className="ml-btn ml-btn-ghost"
                >
                  Meet the team
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* Right information panel */}
            <div className="relative flex items-end">
              <div className="w-full border border-white/[0.10] bg-[#111212]">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                    Who we are
                  </span>

                  <span className="flex h-2 w-2 rounded-full bg-[#c8ff00]" />
                </div>

                <div className="p-7">
                  <div className="mb-8">
                    <p className="text-sm uppercase tracking-[0.18em] text-white/35">
                      Based in
                    </p>

                    <p className="mt-2 text-2xl font-medium text-white">
                      Abuja, Nigeria
                    </p>
                  </div>

                  <div className="grid grid-cols-2 border-t border-white/[0.08]">
                    <div className="border-r border-white/[0.08] py-6 pr-5">
                      <p className="text-3xl font-semibold tracking-tight text-[#c8ff00]">
                        01
                      </p>
                      <p className="mt-2 text-sm text-white/45">
                        Technology
                      </p>
                    </div>

                    <div className="py-6 pl-5">
                      <p className="text-3xl font-semibold tracking-tight text-white">
                        05
                      </p>
                      <p className="mt-2 text-sm text-white/45">
                        Core areas
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.08] pt-6">
                    <p className="text-sm leading-7 text-white/55">
                      Digital products, software engineering, innovation,
                      education and practical solutions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          INTRO / COMPANY STATEMENT
      ========================================================= */}
      <section className="relative bg-[#0d0e0e] py-24 lg:py-32">
        <div className="ml-container">
          <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
            <div>
              <p className="ml-eyebrow text-[#c8ff00]">01 / THE IDEA</p>

              <h2 className="ml-heading-lg mt-5 max-w-sm text-white">
                Technology is only valuable when it solves something that
                matters.
              </h2>
            </div>

            <div className="max-w-3xl">
              <p className="text-2xl font-medium leading-10 text-white/90 lg:text-3xl lg:leading-[1.35]">
                We are building Meritlives around a simple belief: good
                technology should create meaningful progress in the real
                world.
              </p>

              <div className="mt-8 space-y-6 text-base leading-8 text-white/55">
                <p>
                  The digital world moves quickly. New tools appear every day,
                  businesses change how they operate, people learn through new
                  platforms, and organisations are constantly looking for
                  better ways to serve the people they work with.
                </p>

                <p>
                  Meritlives exists within that changing environment. Our work
                  sits at the intersection of technology, digital innovation,
                  education and practical problem-solving.
                </p>

                <p>
                  Rather than treating technology as an end in itself, we look
                  at what people are trying to achieve and consider where
                  technology can genuinely help. Sometimes that means creating
                  a digital product. Sometimes it means improving a process,
                  developing software, sharing knowledge or exploring a new
                  approach to an old problem.
                </p>

                <p>
                  The goal is not simply to build more things. The goal is to
                  build things that have a reason to exist.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          NUMBERS / SNAPSHOT
      ========================================================= */}
      <section className="border-y border-white/[0.08] bg-[#080909]">
        <div className="ml-container">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            <div className="border-r border-white/[0.08] px-5 py-10 first:pl-0 lg:px-8 lg:py-14">
              <p className="text-4xl font-semibold tracking-tight text-white lg:text-5xl">
                2024
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/40">
                Founded
              </p>
            </div>

            <div className="border-b border-white/[0.08] px-5 py-10 lg:border-b-0 lg:border-r lg:px-8 lg:py-14">
              <p className="text-4xl font-semibold tracking-tight text-[#c8ff00] lg:text-5xl">
                ABJ
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/40">
                Headquarters
              </p>
            </div>

            <div className="border-r border-white/[0.08] px-5 py-10 lg:px-8 lg:py-14">
              <p className="text-4xl font-semibold tracking-tight text-white lg:text-5xl">
                05+
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/40">
                Products in market
              </p>
            </div>

            <div className="px-5 py-10 lg:px-8 lg:py-14">
              <p className="text-4xl font-semibold tracking-tight text-[#c8ff00] lg:text-5xl">
                12K+
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/40">
                Professionals served
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          WHAT WE DO
      ========================================================= */}
      <section className="relative bg-[#080909] py-24 lg:py-32">
        <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-[#c8ff00]/[0.035] blur-[100px]" />

        <div className="ml-container relative">
          <div className="mb-14 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="ml-eyebrow text-[#c8ff00]">02 / WHAT WE DO</p>
            </div>

            <div>
              <h2 className="ml-heading-lg max-w-3xl text-white">
                Different problems.
                <br />
                <span className="text-white/35">
                  One practical approach.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/50">
                Meritlives works across several connected areas. They are
                different expressions of the same purpose: using technology
                and knowledge to help people and organisations move forward.
              </p>
            </div>
          </div>

          <div className="border-t border-white/[0.10]">
            {capabilities.map((item) => (
              <div
                key={item.number}
                className="group grid gap-5 border-b border-white/[0.10] py-8 transition-colors hover:bg-white/[0.025] lg:grid-cols-[100px_0.8fr_1.2fr] lg:items-center lg:gap-10 lg:py-10"
              >
                <span className="text-sm font-medium text-[#c8ff00]">
                  {item.number}
                </span>

                <h3 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
                  {item.title}
                </h3>

                <p className="max-w-xl text-sm leading-7 text-white/45 lg:text-base">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW WE THINK
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#0d0e0e] py-24 lg:py-32">
        <div className="pointer-events-none absolute left-[-180px] top-[20%] h-[420px] w-[420px] rounded-full border border-white/[0.04]" />
        <div className="pointer-events-none absolute left-[-120px] top-[27%] h-[300px] w-[300px] rounded-full border border-[#c8ff00]/10" />

        <div className="ml-container relative">
          <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
            <div>
              <p className="ml-eyebrow text-[#c8ff00]">03 / HOW WE THINK</p>

              <h2 className="ml-heading-lg mt-5 max-w-md text-white">
                Principles matter as much as products.
              </h2>

              <p className="mt-6 max-w-md text-base leading-8 text-white/45">
                The way we approach a problem influences what we eventually
                build. These principles help keep the work grounded.
              </p>
            </div>

            <div className="space-y-0 border-t border-white/[0.10]">
              {principles.map((principle) => (
                <div
                  key={principle.number}
                  className="grid gap-5 border-b border-white/[0.10] py-9 lg:grid-cols-[80px_0.7fr_1.3fr] lg:items-start lg:gap-10"
                >
                  <span className="text-sm text-[#c8ff00]">
                    {principle.number}
                  </span>

                  <h3 className="text-2xl font-semibold text-white">
                    {principle.title}
                  </h3>

                  <p className="text-sm leading-7 text-white/45 lg:text-base">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOCUS / TAGS
      ========================================================= */}
      <section className="bg-[#080909] py-20 lg:py-24">
        <div className="ml-container">
          <div className="border border-white/[0.10] bg-[#111212] p-7 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="ml-eyebrow text-[#c8ff00]">
                  WHERE WE OPERATE
                </p>

                <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                  Building for a changing digital world.
                </h2>
              </div>

              <div>
                <p className="max-w-2xl text-base leading-8 text-white/50">
                  Our work is shaped by the opportunities and challenges
                  created by technology. We are particularly interested in
                  practical solutions that can serve people, organisations
                  and growing digital communities.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {focusAreas.map((area) => (
                    <span
                      key={area}
                      className="border border-white/[0.12] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white/65 transition-colors hover:border-[#c8ff00]/40 hover:text-[#c8ff00]"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PARENT COMPANY
      ========================================================= */}
      <section className="border-t border-white/[0.08] bg-[#0d0e0e] py-24 lg:py-28">
        <div className="ml-container">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="ml-eyebrow text-[#c8ff00]">
                OUR FOUNDATION
              </p>

              <h2 className="ml-heading-lg mt-5 max-w-md text-white">
                Part of a wider vision.
              </h2>
            </div>

            <div className="max-w-3xl">
              <p className="text-2xl font-medium leading-10 text-white/90">
                Meritlives operates as a technology and innovation-focused
                company within the wider KGC Meritzone Consults Ltd structure.
              </p>

              <p className="mt-7 text-base leading-8 text-white/50">
                That foundation gives Meritlives room to explore technology,
                digital products, education and practical solutions while
                remaining focused on the people and problems those solutions
                are intended to serve.
              </p>

              <div className="mt-10 border-l border-[#c8ff00] pl-6">
                <p className="text-sm uppercase tracking-[0.16em] text-white/35">
                  Our direction
                </p>

                <p className="mt-3 text-lg leading-8 text-white/75">
                  Build useful technology. Share knowledge. Solve practical
                  problems. Keep moving forward.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PEOPLE
      ========================================================= */}
      <section className="bg-[#080909] py-24 lg:py-28">
        <div className="ml-container">
          <div className="grid gap-10 border-b border-white/[0.10] pb-14 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="ml-eyebrow text-[#c8ff00]">
                04 / THE PEOPLE
              </p>

              <h2 className="ml-heading-lg mt-5 max-w-2xl text-white">
                Behind every product is a group of people trying to make
                something useful.
              </h2>
            </div>

            <Link
              href="/about/team"
              className="ml-btn ml-btn-ghost w-fit"
            >
              Meet the team
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid gap-px overflow-hidden border border-white/[0.10] bg-white/[0.10] sm:grid-cols-3">
            <div className="bg-[#111212] p-7">
              <span className="text-3xl text-[#c8ff00]">01</span>
              <h3 className="mt-12 text-xl font-semibold text-white">
                Build
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/40">
                Turn ideas and identified problems into tangible digital
                solutions.
              </p>
            </div>

            <div className="bg-[#111212] p-7">
              <span className="text-3xl text-[#c8ff00]">02</span>
              <h3 className="mt-12 text-xl font-semibold text-white">
                Learn
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/40">
                Keep developing knowledge, skills and better ways of working.
              </p>
            </div>

            <div className="bg-[#111212] p-7">
              <span className="text-3xl text-[#c8ff00]">03</span>
              <h3 className="mt-12 text-xl font-semibold text-white">
                Improve
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/40">
                Use experience and feedback to make what we build more useful.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="relative overflow-hidden border-t border-white/[0.08] bg-[#c8ff00] py-24 lg:py-32">
        <div className="pointer-events-none absolute right-[-120px] top-[-180px] h-[520px] w-[520px] rounded-full border border-black/10" />
        <div className="pointer-events-none absolute right-[-20px] top-[-80px] h-[320px] w-[320px] rounded-full border border-black/10" />

        <div className="ml-container relative">
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/55">
                LET&apos;S BUILD SOMETHING USEFUL
              </p>

              <h2 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-black sm:text-6xl lg:text-8xl">
                Have a challenge worth solving?
              </h2>

              <p className="mt-7 max-w-2xl text-base leading-8 text-black/65 lg:text-lg">
                Whether you have an idea, a business challenge, a digital
                product to build or a problem you are trying to understand,
                start the conversation with us.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex w-fit items-center gap-3 border border-black bg-black px-7 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-transform hover:-translate-y-1"
            >
              Start a conversation
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}