"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const nav = [

  {
    label: "About",
    items: [
      { label: "About MERITLIVES", href: "/about" },
      { label: "Our Team", href: "/about/team" },
      { label: "Our Story", href: "/about/story" },
      { label: "Careers", href: "/about/careers" },
    ],
  },
  {
    label: "Products",
    items: [
      { label: "All Products", href: "/products" },
      { label: "skillhub", href: "/products/skillhub" },
      { label: "bookmarketing", href: "/products/bookmarketing" },
      { label: " waaubot", href: " https://waaubot.meriives.com" },
      { label: " audioflow", href: "https://audioflow.meritlives.com" },
      { label: "politcs", href: "/products/politcs" },
    ],
  },
  {
    label: "Services",
    items: [
      { label: "All Services", href: "/services" },
      { label: "Custom Web & SaaS Development", href: "/services/web-development" },
      { label: "Fintech & Trading Systems", href: "/services/Fintech" },
      { label: "EdTech & E-Learning Platforms", href: "/services/EdTech" },
      { label: "Education Management & Portal Systemss", href: "/services/Education" },
      { label: "Real Estate Technology", href: "/services/real-estate" },
      { label: "Business Automation & Messaging Tools", href: "/services/business-automation" },
      { label: "Security Audits & Hardening", href: "/services/security" },
      { label: "Ongoing Maintenance & Feature Development", href: "/services/ongoing-maintenance" },
    ],
  },
  {
    label: "News",
    items: [
      { label: "Latest News", href: "/news" },
      { label: "Announcements", href: "/news/announcements" },
      { label: "Company News", href: "/news/company" },
    ],
  },
  {
    label: "Blog",
    items: [
      { label: "All Articles", href: "/blog" },
      { label: "Technology", href: "/blog/technology" },
      { label: "Business", href: "/blog/business" },
      { label: "Insights", href: "/blog/insights" },
    ],
  },
  {
    label: "Contact",
    items: [
      { label: "Contact Us", href: "/contact" },
      { label: "Get a Quote", href: "/contact/quote" },
      { label: "Support", href: "/contact/support" },
    ],
  },
];

export default function SiteHeader() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";

  /* Escape + click-outside close */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenIndex(null);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  /* Lock scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const openMenu = (i: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIndex(i);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenIndex(null), 140);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0D0D0D]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:h-[68px]">

        {/* ── LOGO ── */}
        <Link href="/" aria-label="Meritlives home" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Meritlives"
            width={34}
            height={34}
            priority
            className="h-[34px] w-[34px] object-contain"
          />
          <span
            className="text-[17px] font-semibold tracking-[-0.015em] text-white"
            style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}
          >
            Meritlives
          </span>
        </Link>

        {/* ── DESKTOP NAV ── */}
        <div ref={navRef} className="hidden lg:block">
          <nav className="flex items-center gap-0.5" aria-label="Main">
            {/* Home */}
            <Link
              href="/"
              aria-current={isHome ? "page" : undefined}
              onClick={() => setOpenIndex(null)}
              onMouseEnter={() => setOpenIndex(null)}
              className={`rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors ${
                isHome ? "text-white" : "text-white/60 hover:text-white"
              }`}
            >
              Home
            </Link>

            {nav.map((item, i) => {
              const isOpen = openIndex === i;
              const panelId = `menu-${item.label.toLowerCase()}`;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => openMenu(i)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className={`flex items-center gap-1 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors ${
                      isOpen ? "text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`h-3 w-3 opacity-60 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  <div
                    id={panelId}
                    role="menu"
                    className={`absolute left-1/2 top-full w-60 -translate-x-1/2 pt-2 transition-all duration-150 ${
                      isOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible translate-y-1 opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414] p-1.5 shadow-2xl shadow-black/50">
                      {item.items.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          role="menuitem"
                          onClick={() => setOpenIndex(null)}
                          className="block rounded-lg px-3 py-2 text-[13.5px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* ── RIGHT SIDE ── */}
        <div className="flex shrink-0 items-center gap-2">
         

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-md text-white/70 transition-colors hover:text-white lg:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
              {mobileOpen ? (
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 6h14M3 10h14M3 14h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div className="border-t border-white/[0.06] lg:hidden">
          <div className="mx-auto max-w-6xl px-6 pb-8 pt-4">
            {/* Home */}
            <div className="border-b border-white/[0.05]">
              <Link
                href="/"
                aria-current={isHome ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={`block py-3.5 text-[15px] font-medium ${
                  isHome ? "text-white" : "text-white/85"
                }`}
              >
                Home
              </Link>
            </div>

            {nav.map((item) => (
              <div key={item.label} className="border-b border-white/[0.05] last:border-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[15px] font-medium text-white/85 [&::-webkit-details-marker]:hidden">
                    {item.label}
                    <svg
                      className="h-3.5 w-3.5 opacity-60 transition-transform group-open:rotate-180"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </summary>
                  <div className="pb-2">
                    {item.items.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-md px-3 py-2.5 text-[14px] text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </details>
              </div>
            ))}

            
          </div>
        </div>
      )}
    </header>
  );
}