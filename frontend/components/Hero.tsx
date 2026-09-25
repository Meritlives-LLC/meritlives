import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 ml-grid-bg opacity-50" />
      <div className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-blue-100 blur-3xl" />
      <div className="ml-container grid min-h-[720px] items-center gap-14 py-24 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="ml-eyebrow">Technology · Innovation · Impact</p>
          <h1 className="ml-display mt-6 max-w-5xl">
            Building technology that <span className="ml-gradient">moves people forward.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
            MERITLIVES LLC combines technology, digital innovation, education and practical solutions to help people and organisations turn ideas into measurable progress.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/products" className="ml-btn ml-btn-primary">Explore our solutions →</Link>
            <Link href="/about" className="ml-btn ml-btn-light">Who we are</Link>
          </div>
        </div>
        <div className="relative">
          <div className="ml-card overflow-hidden bg-slate-950 p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <span className="text-sm font-semibold">MERITLIVES / SYSTEM</span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">LIVE</span>
            </div>
            <div className="py-10">
              <div className="text-6xl font-black tracking-tight">01</div>
              <p className="mt-3 text-slate-400">Ideas → Technology → Capability → Impact</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Digital", "Software", "AI", "Education"].map(x => <div key={x} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold">{x}</div>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
