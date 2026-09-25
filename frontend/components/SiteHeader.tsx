import Link from "next/link";

const nav = [
  ["About", "/about"],
  ["Products", "/products"],
  ["Services", "/services"],
  ["News", "/news"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="ml-container flex h-20 items-center justify-between gap-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-blue-950">
          MERIT<span className="text-blue-600">LIVES</span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-semibold text-slate-600 transition hover:text-blue-700">
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/contact" className="ml-btn ml-btn-primary text-sm">Talk to us</Link>
      </div>
    </header>
  );
}
