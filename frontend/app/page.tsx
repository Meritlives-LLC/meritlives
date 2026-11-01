import { BigNews, FeaturedStories, MeritlivesWatch } from "../components/HomeSections";
import FeaturedStoriesHero from "../components/FeaturedStoriesHero";
import { combineFeaturedStories } from "../lib/featured-stories";
import { getBlogPosts, getNews } from "../lib/queries";
import EditorialSearch from "../components/EditorialSearch";
import type { BlogPost, NewsItem } from "../types/api";

async function safelyLoad<T>(load: () => Promise<T>): Promise<{ data: T | null; unavailable: boolean }> {
  try {
    return { data: await load(), unavailable: false };
  } catch {
    return { data: null, unavailable: true };
  }
}

// Editorial content is fetched at request time so a local API is not required
// during `next build` and an API outage is visible in the rendered page.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function HomePage() {
  const [newsResult, featuredNewsResult, blogResult] = await Promise.all([
    safelyLoad(() => getNews("?per_page=7", { cache: "no-store" })),
    safelyLoad(() => getNews("?featured=1&per_page=1", { cache: "no-store" })),
    safelyLoad(() => getBlogPosts("?featured=1&per_page=5", { cache: "no-store" })),
  ]);
  const newsData: NewsItem[] = newsResult.data?.data ?? [];
  const bigNews = featuredNewsResult.data?.data[0] ?? newsData[0] ?? null;
  const gridStories = bigNews ? newsData.filter((story) => story.id !== bigNews.id) : newsData;
  const featuredBlogPosts: BlogPost[] = blogResult.data?.data ?? [];
  const featuredStories = combineFeaturedStories(newsData, featuredBlogPosts);
  const editorialUnavailable = newsResult.unavailable || blogResult.unavailable;
  const editorialStatus = editorialUnavailable
    ? "Some stories could not be loaded. Please try again later."
    : featuredStories.length === 0
      ? "No featured stories are available right now."
      : null;

  return (
    <>
      <FeaturedStoriesHero stories={featuredStories} />
      {editorialStatus && (
        <p role="status" className="bg-white px-5 py-3 text-center text-sm text-[#5D6472]">
          {editorialStatus}
        </p>
      )}
      <EditorialSearch />
      <BigNews story={bigNews} />
      <FeaturedStories stories={gridStories} />
      <MeritlivesWatch />
    </>
  );
}
