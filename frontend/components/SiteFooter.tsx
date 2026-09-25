import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="ml-container grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-xl font-extrabold">MERIT<span className="text-blue-400">LIVES</span></div>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
            Technology, digital innovation and practical solutions designed to create meaningful impact.
          </p>
        </div>
        <div>
          <h2 className="font-bold">Explore</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-400">
            <Link href="/about">About</Link><Link href="/products">Products</Link><Link href="/services">Services</Link><Link href="/blog">Blog</Link>
          </div>
        </div>
        <div>
          <h2 className="font-bold">Connect</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-400">
            <Link href="/contact">Contact</Link><a href="mailto:hello@meritlives.com">Email</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="ml-container flex flex-col gap-3 py-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} MERITLIVES LLC. All rights reserved.</span>
          <span>Built for practical impact.</span>
        </div>
      </div>
    </footer>
  );
}
