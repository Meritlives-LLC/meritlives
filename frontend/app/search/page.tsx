import Link from "next/link";
import ApiError from "../../components/ApiError";
import { searchEditorialContent } from "../../lib/queries";

export const metadata = {
  title: "Search | MERITLIVES LLC",
  description: "Search MERITLIVES news and editorial stories.",
};

export default async function SearchPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  const query = searchParams.q?.trim().slice(0, 100) ?? "";
  let results: Awaited<ReturnType<typeof searchEditorialContent>>["data"] | null = null;

  if (query.length >= 2) {
    try {
      results = (await searchEditorialContent(query, { cache: "no-store" })).data;
    } catch {
      return (
        <main className="min-h-[60vh] bg-white px-5 py-16 text-[#0D0D0D] sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl"><ApiError message="Search is temporarily unavailable. Please try again later." /></div>
        </main>
      );
    }
  }

  const hasResults = Boolean(results && (results.news.length || results.blog.length));

  return (
    <main className="min-h-[60vh] bg-white text-[#0D0D0D]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-18 lg:px-10 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#CC1111]">MERITLIVES / Search</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl" style={{ fontFamily: "var(--font-grotesk), 'Space Grotesk', sans-serif" }}>Find a story</h1>
        <form action="/search" className="mt-8 flex max-w-2xl items-center gap-3 border-b border-[#0D0D0D] pb-2">
          <input name="q" defaultValue={query} placeholder="Search news & stories..." aria-label="Search news and stories" className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-[#747987]" />
          {query && <Link href="/search" className="text-sm text-[#5D6472] underline underline-offset-4">Clear</Link>}
          <button className="text-sm font-medium text-[#1A3BBF]">Search <span aria-hidden="true">→</span></button>
        </form>

        {query.length > 0 && query.length < 2 && <p className="mt-8 text-sm text-[#5D6472]">Enter at least two characters to search.</p>}
        {results && !hasResults && <p className="mt-10 text-base text-[#5D6472]">No stories found for “{query}”.</p>}

        {results && hasResults && (
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            {([
              ["NEWS", results.news, "news"],
              ["BLOG", results.blog, "blog"],
            ] as const).map(([label, items, path]) => items.length > 0 && (
              <section key={label} aria-labelledby={`search-${path}`}>
                <h2 id={`search-${path}`} className="border-b border-[#D5D8DE] pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#1A3BBF]">{label}</h2>
                <ul className="divide-y divide-[#ECEEF2]">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link href={`/${path}/${item.slug}`} className="group block py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3BBF]">
                        <span className="block text-xl font-semibold leading-snug tracking-tight transition-colors group-hover:text-[#1A3BBF]">{item.title}</span>
                        {item.excerpt && <span className="mt-2 block text-sm leading-6 text-[#5D6472]">{item.excerpt}</span>}
                        {item.category?.name && <span className="mt-3 block text-xs text-[#747987]">{item.category.name}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
