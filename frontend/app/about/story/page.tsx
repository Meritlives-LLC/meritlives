import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story — Meritlives LLC",
  description:
    "Learn about the story behind Meritlives LLC, our purpose, and the thinking behind the technology and solutions we build.",
};

const chapters = [
  {
    number: "01",
    title: "The idea",
    text: "Meritlives began with a simple belief: technology should do more than exist. It should solve problems, create opportunities and help people make meaningful progress.",
    detail:
      "Technology is constantly changing the way people communicate, learn, work and build businesses. But the existence of technology does not automatically create value. The real opportunity lies in understanding a problem clearly and then building something useful around it.",
    quote:
      "Technology should have a reason to exist.",
  },
  {
    number: "02",
    title: "The direction",
    text: "As technology continues to reshape how people learn, work and build businesses, Meritlives developed around the opportunity to create practical digital solutions for real-world needs.",
    detail:
      "That direction means looking beyond technology as an end in itself. It means thinking about the people using a product, the environment in which it will be used and the outcome it is expected to create. Practicality, accessibility and usefulness remain important parts of that thinking.",
    quote:
      "Build around the problem, not simply around the technology.",
  },
  {
    number: "03",
    title: "The work",
    text: "Today, our work brings together software, digital innovation, education and practical problem-solving. We build products and solutions designed around the people and organisations that use them.",
    detail:
      "The work continues to evolve as new problems, technologies and opportunities emerge. Across software, digital products, learning and innovation, the goal remains consistent: turn ideas into things that people can understand, use and build upon.",
    quote:
      "Ideas become valuable when people can use them.",
  },
];

const focusAreas = [
  {
    number: "01",
    title: "Technology",
    description:
      "Building useful digital products, platforms and software that solve real problems.",
    detail:
      "Technology is at the centre of our work. We are interested in software and digital products that are practical, understandable and designed around actual needs rather than unnecessary complexity.",
  },
  {
    number: "02",
    title: "Innovation",
    description:
      "Exploring better approaches to everyday challenges through technology and digital thinking.",
    detail:
      "Innovation is not only about creating something completely new. It can also mean finding a better way to approach an existing problem, improving an experience or making a process more useful and efficient.",
  },
  {
    number: "03",
    title: "Education",
    description:
      "Creating opportunities for people to develop practical knowledge and technology skills.",
    detail:
      "We believe knowledge becomes more valuable when it can be applied. Education therefore forms an important part of the Meritlives direction, particularly around practical technology knowledge and skills.",
  },
  {
    number: "04",
    title: "Impact",
    description:
      "Keeping our work connected to meaningful outcomes for people, businesses and communities.",
    detail:
      "The purpose behind the work matters. We aim to keep our attention on whether what we build is useful, whether it addresses a real need and whether it can contribute to meaningful progress.",
  },
];

const principles = [
  {
    number: "01",
    title: "Useful over unnecessary",
    text:
      "We value technology when it has a clear purpose and can be connected to a real need.",
  },
  {
    number: "02",
    title: "People before complexity",
    text:
      "Products and solutions should be understandable to the people expected to use them.",
  },
  {
    number: "03",
    title: "Progress through learning",
    text:
      "Building well requires curiosity, experimentation and a willingness to keep learning.",
  },
];

export default function StoryPage() {
  return (
    <main className="min-h-screen bg-[#080909] text-white">

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#080909]">

        {/* Technical grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Lime glow */}
        <div className="pointer-events-none absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-[#c8ff00]/[0.035] blur-3xl" />

        {/* Rings */}
        <div className="pointer-events-none absolute -right-48 top-20 h-[620px] w-[620px] rounded-full border border-white/[0.045]" />
        <div className="pointer-events-none absolute -right-20 top-48 h-[420px] w-[420px] rounded-full border border-white/[0.035]" />

        <div className="ml-container relative">

          <div
            className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end"
            style={{
              paddingTop: "48px",
              paddingBottom: "88px",
            }}
          >

            {/* Main hero */}
            <div>

              <p className="ml-eyebrow !text-[#c8ff00]">
                Our story
              </p>

              <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-[76px]">
                A story about
                <br />
                building with{" "}
                <span className="text-[#c8ff00]">
                  purpose.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-[16px] leading-8 text-[#999b96] sm:text-[17px]">
                Meritlives exists at the intersection of technology,
                innovation, education and practical problem-solving.
                Our story is shaped by a simple question: how can
                technology become genuinely useful to the people who
                need it?
              </p>

            </div>


            {/* Hero side panel */}
            <div className="lg:justify-self-end">

              <div className="max-w-sm border-l border-[#c8ff00]/40 pl-6">

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#999b96]">
                  01 / Our story
                </p>

                <p className="mt-4 text-sm leading-7 text-[#c4c6c0]">
                  From an idea about useful technology to an evolving
                  company focused on building products, developing
                  knowledge and solving practical problems.
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          WHY MERITLIVES
      ===================================================== */}
      <section className="relative overflow-hidden bg-[#0d0e0e] py-20 sm:py-24 lg:py-28">

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="ml-container relative">

          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">

            {/* Label */}
            <div>

              <p className="ml-eyebrow !text-[#c8ff00]">
                02 / Why Meritlives
              </p>

              <p className="mt-6 max-w-xs text-sm leading-7 text-[#777a75]">
                The thinking behind the work.
              </p>

            </div>


            {/* Content */}
            <div>

              <p className="max-w-4xl text-2xl font-medium leading-relaxed tracking-[-0.025em] text-white sm:text-3xl">
                We believe technology is most valuable when it helps
                people and organisations move from where they are to
                where they want to be.
              </p>

              <div className="mt-9 max-w-3xl space-y-6 text-[16px] leading-8 text-[#999b96]">

                <p>
                  The digital world creates enormous possibilities, but
                  access to technology alone is not enough. The tools we
                  build need to be useful, understandable and connected
                  to real needs.
                </p>

                <p>
                  That thinking shapes Meritlives. Rather than building
                  technology simply for the sake of technology, we focus
                  on solutions that can be applied in everyday
                  environments and understood by the people who use them.
                </p>

                <p>
                  Our work spans software, digital products, education
                  and innovation — with the goal of turning ideas into
                  something people can actually use.
                </p>

                <p>
                  This also means accepting that good solutions are not
                  always the most complicated ones. Sometimes meaningful
                  progress comes from simplifying a process, improving
                  access to information, creating a better digital
                  experience or helping someone develop a useful skill.
                </p>

              </div>


              {/* Statement */}
              <div className="mt-12 border-l border-[#c8ff00] pl-6">

                <p className="text-lg font-medium leading-8 text-white">
                  Technology is only valuable when it connects to
                  something that matters.
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          JOURNEY
      ===================================================== */}
      <section className="relative overflow-hidden border-y border-white/[0.08] bg-[#080909]">

        <div className="ml-container py-20 sm:py-24 lg:py-28">

          {/* Heading */}
          <div className="mb-16 max-w-3xl">

            <p className="ml-eyebrow !text-[#c8ff00]">
              03 / The journey
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
              From an idea to a growing technology company.
            </h2>

            <p className="mt-6 max-w-2xl text-[16px] leading-8 text-[#999b96]">
              The Meritlives story is still being written. But the
              direction has remained connected to the same belief:
              technology should be useful, practical and capable of
              creating meaningful progress.
            </p>

          </div>


          {/* Timeline */}
          <div className="relative">

            {/* Timeline line */}
            <div className="absolute bottom-0 left-[15px] top-0 hidden w-px bg-white/[0.1] md:block" />

            <div className="space-y-16">

              {chapters.map((chapter) => (

                <div
                  key={chapter.number}
                  className="relative grid gap-8 md:grid-cols-[120px_1fr] md:gap-12"
                >

                  {/* Number */}
                  <div className="relative z-10 flex items-start gap-4 bg-[#080909] md:block">

                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8ff00]/30 bg-[#080909] font-mono text-[10px] font-semibold text-[#c8ff00]">
                      {chapter.number}
                    </span>

                  </div>


                  {/* Chapter */}
                  <div className="max-w-4xl">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777a75]">
                      Chapter {chapter.number}
                    </p>

                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">
                      {chapter.title}
                    </h3>

                    <p className="mt-5 max-w-3xl text-[16px] leading-8 text-[#c4c6c0]">
                      {chapter.text}
                    </p>

                    <p className="mt-5 max-w-3xl text-[15px] leading-8 text-[#777a75]">
                      {chapter.detail}
                    </p>


                    {/* Chapter statement */}
                    <div className="mt-7 border-l border-white/[0.12] pl-5">

                      <p className="text-sm font-medium italic text-[#999b96]">
                        “{chapter.quote}”
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          WHAT WE ARE BUILDING
      ===================================================== */}
      <section className="relative overflow-hidden bg-[#0d0e0e] py-20 sm:py-24 lg:py-28">

        <div className="ml-container">

          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">

            {/* Left */}
            <div>

              <p className="ml-eyebrow !text-[#c8ff00]">
                04 / What we are building
              </p>

              <h2 className="mt-5 max-w-md text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-4xl">
                More than products.
                <br />
                <span className="text-[#777a75]">
                  A platform for progress.
                </span>
              </h2>

              <p className="mt-6 max-w-sm text-sm leading-7 text-[#777a75]">
                Our focus areas reflect the different ways Meritlives
                approaches technology and meaningful progress.
              </p>

            </div>


            {/* Areas */}
            <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">

              {focusAreas.map((area) => (

                <div
                  key={area.number}
                  className="group py-8"
                >

                  <div className="flex gap-6">

                    <span className="pt-1 font-mono text-[11px] text-[#c8ff00]">
                      {area.number}
                    </span>

                    <div className="flex-1">

                      <h3 className="text-xl font-semibold text-white transition-colors group-hover:text-[#c8ff00]">
                        {area.title}
                      </h3>

                      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#999b96]">
                        {area.description}
                      </p>

                      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#777a75]">
                        {area.detail}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          OUR APPROACH
      ===================================================== */}
      <section className="relative overflow-hidden border-y border-white/[0.08] bg-[#080909]">

        {/* Rings */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full border border-white/[0.035]" />

        <div className="ml-container relative">

          <div className="grid gap-14 py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24 lg:py-28">

            <div>

              <p className="ml-eyebrow !text-[#c8ff00]">
                05 / How we think
              </p>

            </div>


            <div>

              <h2 className="max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                The way we build matters as much as what we build.
              </h2>

              <p className="mt-7 max-w-2xl text-[16px] leading-8 text-[#999b96]">
                Building useful technology requires more than technical
                ability. It requires understanding, curiosity, discipline
                and a willingness to keep improving.
              </p>


              {/* Principles */}
              <div className="mt-12 grid gap-0 divide-y divide-white/[0.08] border-y border-white/[0.08]">

                {principles.map((principle) => (

                  <div
                    key={principle.number}
                    className="grid gap-4 py-7 sm:grid-cols-[70px_1fr]"
                  >

                    <span className="font-mono text-[11px] text-[#c8ff00]">
                      {principle.number}
                    </span>

                    <div>

                      <h3 className="text-lg font-semibold text-white">
                        {principle.title}
                      </h3>

                      <p className="mt-2 max-w-xl text-sm leading-7 text-[#777a75]">
                        {principle.text}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          PARENT COMPANY
      ===================================================== */}
      <section className="border-y border-white/[0.08] bg-[#121313]">

        <div className="ml-container">

          <div className="grid gap-10 py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24 lg:py-24">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8ff00]">
                06 / Our foundation
              </p>

            </div>


            <div>

              <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                Part of KGC Meritzone Consults Ltd.
              </h2>

              <p className="mt-6 max-w-2xl text-[15px] leading-8 text-[#999b96]">
                Meritlives operates under the governance of KGC
                Meritzone Consults Ltd. This provides the organisational
                foundation behind our technology, products and
                initiatives.
              </p>

              <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#777a75]">
                The relationship provides an organisational foundation
                while Meritlives continues to develop its own direction
                around technology, digital innovation, education and
                practical problem-solving.
              </p>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          TODAY
      ===================================================== */}
      <section className="relative overflow-hidden bg-[#080909] py-20 sm:py-24 lg:py-28">

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="ml-container relative">

          <div className="mx-auto max-w-4xl text-center">

            <p className="ml-eyebrow !text-[#c8ff00]">
              07 / Where we are today
            </p>

            <h2 className="mt-6 text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
              Still building.
              <br />
              Still learning.
              <br />
              <span className="text-[#777a75]">
                Still moving forward.
              </span>
            </h2>

            <p className="mx-auto mt-8 max-w-2xl text-[16px] leading-8 text-[#999b96]">
              Meritlives continues to grow through the products we
              build, the people we work with and the problems we choose
              to solve.
            </p>

            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-8 text-[#777a75]">
              There is still much to learn, many problems to understand
              and many ideas that can be explored. Our story is therefore
              not presented as a finished journey. It is an ongoing
              process of building, learning and improving.
            </p>

          </div>

        </div>
      </section>


      {/* =====================================================
          NEXT CHAPTER CTA
      ===================================================== */}
      <section className="bg-[#0d0e0e] py-20 sm:py-24">

        <div className="ml-container">

          <div className="relative overflow-hidden border border-white/[0.08] bg-[#121313] px-7 py-14 sm:px-12 sm:py-16 lg:px-16">

            {/* Technical grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />

            {/* Decorative rings */}
            <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full border border-white/[0.07]" />

            <div className="pointer-events-none absolute -right-8 -top-16 h-64 w-64 rounded-full border border-[#c8ff00]/10" />

            <div className="relative max-w-3xl">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8ff00]">
                08 / The next chapter
              </p>

              <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                There is more
                <br />
                to build.
              </h2>

              <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#999b96]">
                Whether you have a problem to solve, an idea to explore
                or a product to build, the next chapter could start with
                a conversation.
              </p>

              <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#777a75]">
                We are interested in conversations that lead to useful
                work — from digital products and software to technology
                ideas, learning opportunities and practical solutions.
              </p>

              <a
                href="/contact"
                className="mt-8 inline-flex items-center border border-[#c8ff00] bg-[#c8ff00] px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ddff68] hover:shadow-[0_0_35px_rgba(200,255,0,0.15)]"
              >
                Start a conversation

                <span className="ml-3 text-base">
                  →
                </span>
              </a>

            </div>

          </div>

        </div>
      </section>

    </main>
  );
}