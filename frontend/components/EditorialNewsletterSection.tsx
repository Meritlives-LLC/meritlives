import NewsletterForm from "./NewsletterForm";

export default function EditorialNewsletterSection({ compact = false }: { compact?: boolean }) {
  return <section aria-label="The MERITLIVES Brief" className={`my-12 rounded-2xl border border-[#DDE2ED] bg-[#F7F8FA] p-5 text-[#0D0D0D] sm:p-8 ${compact ? "lg:flex lg:items-center lg:gap-10" : "sm:p-10"}`}>
    <div className="flex-1">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D71920]">THE MERITLIVES BRIEF</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>{compact ? "Ideas worth opening your inbox for." : "Stay ahead of what's next."}</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#4B5260]">{compact ? "Join the MERITLIVES Brief for useful technology insights, industry perspectives and innovation updates." : "Get technology insights, industry news, AI developments and practical digital innovation updates delivered to your inbox."}</p>
    </div>
    <div className={`mt-6 min-w-0 ${compact ? "lg:mt-0 lg:w-1/2" : ""}`}>
      <NewsletterForm emailOnly />
      <p className="mt-4 text-sm leading-6 text-[#4B5260]">Occasional insights. No spam. Unsubscribe anytime. <a href="/privacy" className="underline underline-offset-4">Privacy Policy</a></p>
    </div>
  </section>;
}
