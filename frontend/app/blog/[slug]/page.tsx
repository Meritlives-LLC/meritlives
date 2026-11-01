import EditorialNewsletterSection from "../../../components/EditorialNewsletterSection";
import { notFound } from "next/navigation";
import { getBlogPost } from "../../../lib/queries";

export default async function BlogDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = await paramsPromise;
  try {
    const result = await getBlogPost(params.slug);
    const post = result.data;

    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm opacity-60">{post.category?.name || "Blog"}</p>
        <h1 className="mt-3 text-5xl font-bold">{post.title}</h1>
        {post.author?.name && (
          <p className="mt-4 text-sm opacity-60">By {post.author.name}</p>
        )}
        {post.featured_image && (
          <figure className="mt-10"><img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            className="mt-10 aspect-video w-full rounded-2xl object-cover"
          />{post.featured_image_disclosure && <figcaption className="mt-2 text-sm text-[#596273]">{post.featured_image_disclosure}</figcaption>}</figure>
        )}
        {post.content && (
          <article
            className="prose mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}
      <EditorialNewsletterSection />
      </main>
    );
  } catch {
    notFound();
  }
}
