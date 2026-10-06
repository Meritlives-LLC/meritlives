import Link from "next/link";
import Image from "next/image";

const footerColumns = [
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Our Team", "/about/team"],
      ["Our Story", "/about/story"],
      ["News", "/news"],
      ["Blog", "/blog"],
      ["Contact", "/contact"],
    ],
  },

  {
    title: "Products",
    links: [
      ["All Products", "/products"],
      ["skillhub", "/products/skillhub"],
      ["bookmarketing", "/products/bookmarketing"],
      ["waaubot", "/products/waaubot"],
      [" audioflow", "/products/ audioflow"],
      ["politcs", "/products/politcs"],
    ],
  },

  {
    title: "Services",
    links: [
      ["Web & SaaS Development", "/services/web-development"],
      ["Fintech & Trading Systems", "/services/fintech"],
      ["EdTech & E-Learning", "/services/edtech"],
      ["Education Management", "/services/education"],
      ["Real Estate Technology", "/services/real-estate"],
      ["Business Automation", "/services/business-automation"],
      ["Security & Hardening", "/services/security"],
      ["Maintenance & Development", "/services/ongoing-maintenance"],
    ],
  },

  {
    title: "Resources",
    links: [
      ["Blog", "/blog"],
      ["News", "/news"],
      ["Insights", "/blog/insights"],
      ["Support", "/contact/support"],
    ],
  },
];

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/meritlives1",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6.5 8.5H3V21h3.5V8.5ZM4.75 3A2.05 2.05 0 1 0 4.75 7.1 2.05 2.05 0 0 0 4.75 3ZM21 13.85c0-3.77-2.01-5.53-4.7-5.53-2.17 0-3.14 1.2-3.68 2.05V8.5H9.12V21h3.5v-6.2c0-1.63.31-3.2 2.33-3.2 1.99 0 2.02 1.86 2.02 3.31V21h3.5l.03-7.15Z" />
      </svg>
    ),
  },

  {
    name: "X",
    href: "https://x.com/meritlives1",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.25l-4.9-6.39L6.46 22H3.35l7.24-8.28L3 2h6.4l4.43 5.86L18.9 2Zm-1.1 17.84h1.73L8.47 4.04H6.61L17.8 19.84Z" />
      </svg>
    ),
  },

  {
    name: "Instagram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="12"
          cy="12"
          r="4.2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="17.4" cy="6.7" r="1" fill="currentColor" />
      </svg>
    ),
  },

  {
    name: "Facebook",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 21v-8h2.7l.4-3H14V8.1c0-.87.24-1.46 1.5-1.46h1.7V3.96c-.3-.04-1.34-.13-2.55-.13-2.52 0-4.25 1.54-4.25 4.38V10H7.6v3h2.8v8H14Z" />
      </svg>
    ),
  },

  {
    name: "YouTube",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.58A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.58 9.38.58 9.38.58s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.93V8.07L16.4 12l-6.8 3.93Z" />
      </svg>
    ),
  },

  {
    name: "TikTok",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-2.77-1.6A4.87 4.87 0 0 1 15.66 2H12.1v13.37a2.9 2.9 0 1 1-2-2.76V9a6.5 6.5 0 1 0 5.56 6.42V8.84a8.35 8.35 0 0 0 4.88 1.57V6.86a4.8 4.8 0 0 1-.95-.17Z" />
      </svg>
    ),
  },
];


/* =========================================================
   FOOTER
========================================================= */

export default function SiteFooter() {
  return (
    <footer className="ml-footer">

      {/* =====================================================
          MAIN FOOTER
      ====================================================== */}

      <div className="ml-container py-16 lg:py-24">

        <div className="grid gap-16 lg:grid-cols-[1fr_2.7fr] lg:gap-20">

          {/* =================================================
              BRAND
          ================================================== */}

          <div className="max-w-sm">

            <Link
              href="/"
              aria-label="Meritlives home"
              className="inline-flex items-center gap-3"
            >
              <Image
                src="/logo.png"
                alt="Meritlives"
                width={34}
                height={34}
                className="h-[34px] w-[34px] object-contain"
              />

              <span className="font-[var(--font-heading)] text-lg font-semibold tracking-[-0.03em] text-white">
                Meritlives
              </span>
            </Link>

            <p className="mt-6 max-w-xs text-sm leading-7 text-white/50">
              Technology, digital innovation and practical solutions designed
              to create meaningful impact across Africa.
            </p>

            <Link
              href="/contact"
              className="ml-btn ml-btn-lime mt-7"
            >
              Talk to us

              <span aria-hidden="true">→</span>
            </Link>

            {/* Socials */}
            <div className="mt-10">

              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                Follow Meritlives
              </p>

              <div className="mt-4 flex flex-wrap gap-2">

                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    title={social.name}
                    target={social.href === "#" ? undefined : "_blank"}
                    rel={
                      social.href === "#"
                        ? undefined
                        : "noopener noreferrer"
                    }
                    className="group flex h-10 w-10 items-center justify-center border border-white/[0.10] bg-white/[0.025] text-white/55 transition-all duration-200 hover:border-[#c8ff00]/40 hover:bg-[#c8ff00]/[0.08] hover:text-[#c8ff00]"
                  >
                    <span className="h-4 w-4">
                      {social.icon}
                    </span>
                  </a>
                ))}

              </div>
            </div>
          </div>


          {/* =================================================
              LINK COLUMNS
          ================================================== */}

          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4">

            {footerColumns.map((column) => (
              <div key={column.title}>

                <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">
                  {column.title}
                </h2>

                <ul className="mt-5 space-y-3">

                  {column.links.map(([label, href]) => (
                    <li key={`${label}-${href}`}>

                      <Link
                        href={href}
                        className="group inline-flex text-[13px] leading-5 text-white/55 transition-colors duration-200 hover:text-white"
                      >
                        <span>{label}</span>
                      </Link>

                    </li>
                  ))}

                </ul>

              </div>
            ))}

          </div>

        </div>


        {/* ===================================================
            CONTACT STRIP
        ==================================================== */}

        <div className="mt-20 border-y border-white/[0.08] py-8">

          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="font-[var(--font-heading)] text-lg font-medium text-white">
                Have a project in mind?
              </p>

              <p className="mt-1 text-sm text-white/45">
                Let&apos;s discuss how Meritlives can help.
              </p>

            </div>


            <div className="flex flex-wrap items-center gap-x-7 gap-y-3">

              <a
                href="mailto:hello@meritlives.com"
                className="text-sm font-medium text-white/60 transition-colors hover:text-[#c8ff00]"
              >
                sales@meritlives.com
              </a>

              <span
                aria-hidden="true"
                className="hidden h-1 w-1 rounded-full bg-white/20 sm:block"
              />

              <a
                href="tel:+2340000000000"
                className="text-sm font-medium text-white/60 transition-colors hover:text-[#c8ff00]"
              >
                +234 000 000 0000
              </a>

              <span
                aria-hidden="true"
                className="hidden h-1 w-1 rounded-full bg-white/20 sm:block"
              />

              <span className="text-sm text-white/40">
                Abuja, Nigeria
              </span>

            </div>

          </div>

        </div>


        {/* ===================================================
            SOCIAL / BUSINESS BAR
        ==================================================== */}

        <div className="flex flex-col gap-6 pt-8 md:flex-row md:items-center md:justify-between">

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">

            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
              Technology
            </span>

            <span className="h-1 w-1 rounded-full bg-[#c8ff00]/60" />

            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
              Innovation
            </span>

            <span className="h-1 w-1 rounded-full bg-[#c8ff00]/60" />

            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
              Impact
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          COPYRIGHT
      ====================================================== */}

      <div className="border-t border-white/[0.08]">

        <div className="ml-container flex flex-col gap-4 py-6 text-[11px] text-white/30 sm:flex-row sm:items-center sm:justify-between">

          <span>
            © {new Date().getFullYear()} Meritlives LLC. All rights reserved.
          </span>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">

            <Link
              href="/privacy"
              className="transition-colors hover:text-white/70"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="transition-colors hover:text-white/70"
            >
              Terms
            </Link>

            <Link
              href="/cookies"
              className="transition-colors hover:text-white/70"
            >
              Cookies
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}
