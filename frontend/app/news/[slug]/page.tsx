import { notFound } from "next/navigation";
import { getNewsItem } from "../../../lib/queries";

export default async function NewsDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const result = await getNewsItem(params.slug);
    const item = result.data;

    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm opacity-60">{item.category?.name || "News"}</p>
        <h1 className="mt-3 text-5xl font-bold">{item.title}</h1>
        {item.excerpt && <p className="mt-5 text-xl opacity-75">{item.excerpt}</p>}
        {item.source?.url && (
          <a
            href={item.source.url}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block underline"
          >
            Source: {item.source.name || item.source.url}
          </a>
        )}
      </main>
    );
  } catch {
    notFound();
  }
}
