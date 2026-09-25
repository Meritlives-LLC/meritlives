import Link from "next/link";
import type { NewsItem } from "../types/api";

export default function NewsList({ items }: { items: NewsItem[] }) {
  if (!items.length) return <p>No news is available yet.</p>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border p-6">
          {item.image_url && (
            <img src={item.image_url} alt="" className="mb-5 aspect-video w-full rounded-xl object-cover" />
          )}
          <p className="text-sm opacity-60">{item.category?.name || "News"}</p>
          <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
          {item.excerpt && <p className="mt-2 opacity-75">{item.excerpt}</p>}
          <Link href={`/news/${item.slug}`} className="mt-5 inline-block underline">
            Read More
          </Link>
        </article>
      ))}
    </div>
  );
}
