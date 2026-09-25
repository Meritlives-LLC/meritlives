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
      <main className="mx-auto max-w-7xl px-6 py-16">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider">News</p>
          <h1 className="mt-2 text-4xl font-bold">Latest updates.</h1>
        </header>
        <NewsList items={result.data} />
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <ApiError message={error instanceof Error ? error.message : undefined} />
      </main>
    );
  }
}
