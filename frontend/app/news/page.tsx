import NewsList from "../../components/NewsList";
import ApiError from "../../components/ApiError";
import { getNews } from "../../lib/queries";

export const metadata = {
  title: "News | MERITLIVES LLC",
  description: "MERITLIVES news and updates.",
};

export default async function NewsPage() {
  try {
    const result = await getNews();
    return (
      <main className="min-h-screen bg-white text-[#0D0D0D]">
        <header className="relative overflow-hidden border-b border-[#DDE2ED] bg-white">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-40 hidden h-[28rem] w-[28rem] rounded-full border border-[#DDE2ED] md:block" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-24 hidden h-64 w-64 rounded-full border border-[#CC1111]/20 md:block" />
          <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20 lg:px-10 lg:pb-20">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#CC1111]">News</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#0D0D0D] sm:text-6xl lg:text-7xl" style={{ fontFamily: 'var(--font-heading)' }}>
              News &amp; Insights
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#3A3F52] sm:text-lg sm:leading-8">
              News and updates across technology, business and digital innovation.
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-10 lg:py-16">
          <NewsList items={result.data} />
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main className="min-h-screen bg-white px-5 py-16 text-[#0D0D0D] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <ApiError message={error instanceof Error ? error.message : undefined} />
        </div>
      </main>
    );
  }
}
