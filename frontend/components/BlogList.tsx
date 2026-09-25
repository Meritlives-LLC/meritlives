import Link from "next/link";
import type { BlogPost } from "../types/api";

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return <p>No blog posts are available yet.</p>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <article key={post.id} className="rounded-2xl border p-6">
          {post.featured_image && (
            <img
              src={post.featured_image}
              alt=""
              className="mb-5 aspect-video w-full rounded-xl object-cover"
            />
          )}
          <p className="text-sm opacity-60">{post.category?.name || "Blog"}</p>
          <h2 className="mt-2 text-xl font-semibold">{post.title}</h2>
          {post.excerpt && <p className="mt-2 opacity-75">{post.excerpt}</p>}
          <Link href={`/blog/${post.slug}`} className="mt-5 inline-block underline">
            Read Article
          </Link>
        </article>
      ))}
    </div>
  );
}
