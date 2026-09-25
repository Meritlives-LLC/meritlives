import BlogList from "../../components/BlogList";
import ApiError from "../../components/ApiError";
import { getBlogPosts } from "../../lib/queries";

export const metadata = {
  title: "Blog | MERITLIVES LLC",
  description: "Insights, ideas and perspectives from MERITLIVES.",
};

export default async function BlogPage() {
  try {
    const result = await getBlogPosts();
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <header className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider">Blog</p>
          <h1 className="mt-2 text-4xl font-bold">Ideas that move technology and people forward.</h1>
        </header>
        <BlogList posts={result.data} />
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
