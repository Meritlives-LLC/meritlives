import type { BlogPost, FeaturedStory, NewsItem } from "../types/api";

const MAX_FEATURED_STORIES = 5;

function getPublishedTimestamp(value?: string | null) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function combineFeaturedStories(news: NewsItem[], blogPosts: BlogPost[]): FeaturedStory[] {
  return [
    ...news.map((item) => ({
      id: `news-${item.id}`,
      type: "news" as const,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      image: item.featured_image || item.image_url || null,
      publishedAt: item.published_at,
      author: item.author_name,
      source: item.source?.name,
      category: item.category,
      url: `/news/${item.slug}`,
    })),
    ...blogPosts.map((item) => ({
      id: `blog-${item.id}`,
      type: "blog" as const,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      image: item.featured_image || null,
      publishedAt: item.published_at,
      author: item.author?.name,
      source: null,
      category: item.category,
      url: `/blog/${item.slug}`,
    })),
  ]
    .sort((a, b) => getPublishedTimestamp(b.publishedAt) - getPublishedTimestamp(a.publishedAt))
    .slice(0, MAX_FEATURED_STORIES);
}
