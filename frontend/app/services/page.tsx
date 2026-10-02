import Link from "next/link";
import ServicesList from "../../components/ServicesList";
import ApiError from "../../components/ApiError";
import { getServices } from "../../lib/queries";

export const metadata = {
  title: "Services — Meritlives LLC",
  description:
    "Explore Meritlives services across technology, digital innovation, software and practical business solutions.",
};

const serviceAreas = [
  "Software & Web Development",
  "Digital Products",
  "Technology Consulting",
  "Digital Innovation",
  "Education & Training",
];

export default async function ServicesPage() {
  let servicesResult: any = null;
  let servicesError: unknown = null;

  try {
    servicesResult = await getServices();
  } catch (error) {
    servicesError = error;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080909] text-white">

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#080909]">

        {/* Technical grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />

        {/* Lime glow */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#c8ff00]/[0.07] blur-[120px]" />

        {/* Rings */}
        <div className="pointer-events-none absolute right-[4%] top-[12%] hidden h-[420px] w-[420px] rounded-full border border-white/[0.06] lg:block" />

        <div className="pointer-events-none absolute right-[9%] top-[19%] hidden h-[300px] w-[300px] rounded-full border border-[#c8ff00]/15 lg:block" />

        <div className="ml-container relative">
          <div
            className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20"
            style={{
              paddingTop: "48px",
              paddingBottom: "96px",
            }}
          >

            {/* LEFT */}
            <div className="max-w-4xl">

              <div className="mb-8 flex items-center gap-4">
                <span className="h-px w-12 bg-[#c8ff00]" />

                <p className="ml-eyebrow text-[#c8ff00]">
                  OUR SERVICES
                </p>
              </div>

              <h1 className="ml-display text-white">
                Technology and
                <br />
                digital solutions
                <br />
                built for{" "}
                <span className="text-[#c8ff00]">
                  real needs.
                </span>
              </h1>

              <p className="ml-body-lg mt-8 max-w-2xl text-white/60">
                From software development to digital innovation, we help
                individuals and organisations turn ideas, challenges and
                opportunities into practical digital solutions.
              </p>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/40">
                We do not believe every problem needs the same technology.
                Our approach starts with understanding what needs to be
                achieved and then finding the right way to build, improve
                or support it.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="ml-btn ml-btn-lime"
                >
                  Start a project
                  <span aria-hidden="true">↗</span>
                </Link>

                <a
                  href="#services"
                  className="ml-btn ml-btn-ghost"
                >
                  Explore services
                  <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="hidden lg:flex lg:items-end">

              <div className="w-full border border-white/[0.10] bg-[#111212]">

                <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    What we do
                  </span>

                  <span className="font-mono text-[10px] text-white/25">
                    ML / SERVICES
                  </span>
                </div>

                <div className="p-6">

                  {serviceAreas.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center justify-between border-b border-white/[0.08] py-5 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[10px] text-[#c8ff00]">
                          0{index + 1}
                        </span>

                        <span className="text-sm font-medium text-white/75">
                          {item}
                        </span>
                      </div>

                      <span className="text-white/25 transition group-hover:text-[#c8ff00]">
                        →
                      </span>
                    </div>
                  ))}

                </div>

                <div className="border-t border-white/[0.08] px-6 py-5">
                  <p className="text-xs leading-6 text-white/35">
                    Practical technology. Thoughtful design. Useful
                    outcomes.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          INTRO
      ========================================================= */}
      <section
        id="services"
        className="relative bg-[#0d0e0e] py-24 lg:py-32"
      >
        <div className="ml-container">

          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">

            <div>
              <p className="ml-eyebrow text-[#c8ff00]">
                01 / WHAT WE OFFER
              </p>

              <h2 className="ml-heading-lg mt-5 max-w-md text-white">
                Solutions designed around the problem.
              </h2>
            </div>

            <div>
              <p className="max-w-3xl text-xl leading-9 text-white/75">
                Every organisation has different requirements. We work across
                technology, software, digital products and learning to help
                turn those requirements into practical solutions.
              </p>

              <p className="mt-6 max-w-3xl text-base leading-8 text-white/45">
                Whether you are starting from an idea, improving an existing
                system or looking for a better way to solve a business
                challenge, our services are designed around what you are
                actually trying to accomplish.
              </p>
            </div>

          </div>

          {/* SERVICE LIST */}
          <div className="mt-16">

            {servicesError ? (
              <div className="border border-white/[0.10] bg-[#111212] p-8">
                <p className="text-sm uppercase tracking-[0.16em] text-[#c8ff00]">
                  Services unavailable
                </p>

                <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">
                  We could not load the service catalogue at the moment.
                  Please try again shortly or contact us directly.
                </p>

                <div className="mt-6">
                  <ApiError
                    message={
                      servicesError instanceof Error
                        ? servicesError.message
                        : undefined
                    }
                  />
                </div>
              </div>
            ) : servicesResult?.data ? (
              <ServicesList services={servicesResult.data} />
            ) : (
              <div className="border border-white/[0.10] bg-[#111212] p-8">
                <p className="text-sm text-white/50">
                  Our service catalogue is currently being updated.
                </p>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* =========================================================
          SERVICE PRINCIPLES
      ========================================================= */}
      <section className="border-y border-white/[0.08] bg-[#080909] py-24 lg:py-32">

        <div className="ml-container">

          <div className="mb-14 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">

            <div>
              <p className="ml-eyebrow text-[#c8ff00]">
                02 / OUR THINKING
              </p>

              <h2 className="ml-heading-lg mt-5 max-w-md text-white">
                Technology should have a purpose.
              </h2>
            </div>

            <div>
              <p className="max-w-2xl text-base leading-8 text-white/50">
                Good technology is not simply about using the newest tools.
                It is about understanding people, processes and objectives,
                then choosing technology that can create a useful result.
              </p>
            </div>

          </div>

          <div className="grid gap-px overflow-hidden border border-white/[0.10] bg-white/[0.10] md:grid-cols-3">

            <div className="bg-[#111212] p-8 lg:p-10">
              <span className="font-mono text-sm text-[#c8ff00]">
                01
              </span>

              <h3 className="mt-16 text-2xl font-semibold text-white">
                Understand
              </h3>

              <p className="mt-4 text-sm leading-7 text-white/40">
                We begin by understanding the challenge, users, requirements
                and desired outcome.
              </p>
            </div>

            <div className="bg-[#111212] p-8 lg:p-10">
              <span className="font-mono text-sm text-[#c8ff00]">
                02
              </span>

              <h3 className="mt-16 text-2xl font-semibold text-white">
                Build
              </h3>

              <p className="mt-4 text-sm leading-7 text-white/40">
                We design and develop around the actual requirements instead
                of forcing the problem into a predefined solution.
              </p>
            </div>

            <div className="bg-[#111212] p-8 lg:p-10">
              <span className="font-mono text-sm text-[#c8ff00]">
                03
              </span>

              <h3 className="mt-16 text-2xl font-semibold text-white">
                Improve
              </h3>

              <p className="mt-4 text-sm leading-7 text-white/40">
                We refine the work using feedback, changing requirements and
                what we learn along the way.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          PROCESS
      ========================================================= */}
      <section className="bg-[#0d0e0e] py-24 lg:py-32">

        <div className="ml-container">

          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">

            <div>
              <p className="ml-eyebrow text-[#c8ff00]">
                03 / OUR APPROACH
              </p>

              <h2 className="ml-heading-lg mt-5 max-w-md text-white">
                From problem to practical solution.
              </h2>

              <p className="mt-6 max-w-sm text-sm leading-7 text-white/40">
                We keep our process focused on the problem, the people
                involved and the outcome the solution needs to achieve.
              </p>
            </div>

            <div className="border-y border-white/[0.10]">

              <div className="grid gap-5 border-b border-white/[0.10] py-8 sm:grid-cols-[80px_1fr]">
                <span className="font-mono text-sm text-[#c8ff00]">
                  01
                </span>

                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Understand the challenge
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
                    We identify what needs to be solved, who the solution
                    is for and what success should look like.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 border-b border-white/[0.10] py-8 sm:grid-cols-[80px_1fr]">
                <span className="font-mono text-sm text-[#c8ff00]">
                  02
                </span>

                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Plan the solution
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
                    We consider the requirements, technology, users and
                    practical constraints before development begins.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 border-b border-white/[0.10] py-8 sm:grid-cols-[80px_1fr]">
                <span className="font-mono text-sm text-[#c8ff00]">
                  03
                </span>

                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Build and test
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
                    We turn the plan into a working solution and refine
                    the experience as the work develops.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 py-8 sm:grid-cols-[80px_1fr]">
                <span className="font-mono text-sm text-[#c8ff00]">
                  04
                </span>

                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Improve
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
                    We learn from feedback and changing needs, making the
                    solution better over time.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          WHO WE WORK WITH
      ========================================================= */}
      <section className="bg-[#080909] py-20 lg:py-24">

        <div className="ml-container">

          <div className="border border-white/[0.10] bg-[#111212] p-8 lg:p-12">

            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">

              <div>
                <p className="ml-eyebrow text-[#c8ff00]">
                  WHO WE HELP
                </p>

                <h2 className="mt-5 max-w-md text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                  Built for people and organisations moving forward.
                </h2>
              </div>

              <div>

                <p className="max-w-2xl text-base leading-8 text-white/50">
                  Our work can support individuals, businesses, educational
                  organisations and teams looking to use technology to solve
                  practical problems or create new opportunities.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-white/[0.10] bg-white/[0.10] sm:grid-cols-4">

                  {[
                    "Businesses",
                    "Organisations",
                    "Professionals",
                    "Learners",
                  ].map((item) => (
                    <div
                      key={item}
                      className="bg-[#151616] px-5 py-6 text-sm font-medium text-white/65"
                    >
                      {item}
                    </div>
                  ))}

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#c8ff00] py-24 lg:py-32">

        <div className="pointer-events-none absolute right-[-140px] top-[-180px] h-[520px] w-[520px] rounded-full border border-black/10" />

        <div className="pointer-events-none absolute right-[-40px] top-[-90px] h-[320px] w-[320px] rounded-full border border-black/10" />

        <div className="ml-container relative">

          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                HAVE A PROJECT?
              </p>

              <h2 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-black sm:text-6xl lg:text-7xl">
                Let&apos;s build something useful.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-black/60 lg:text-lg">
                Tell us what you are trying to achieve and let&apos;s explore
                how technology can help you get there.
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