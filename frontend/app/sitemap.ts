import type { MetadataRoute } from "next";

type NewsSitemapResponse = {
  data?: Array<{ slug?: string; updated_at?: string | null; published_at?: string | null }>;
  meta?: { last_page?: number };
};

function getProductionOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return null;

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

async function getPublishedNews(): Promise<NewsSitemapResponse["data"]> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) return [];
  const entries: NonNullable<NewsSitemapResponse["data"]> = [];
  let page = 1;

  try {
    while (true) {
      const response = await fetch(`${apiBase}/news?per_page=100&page=${page}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });
      if (!response.ok) break;

      const result = (await response.json()) as NewsSitemapResponse;
      entries.push(...(result.data || []));
      if (!result.meta?.last_page || page >= result.meta.last_page) break;
      page += 1;
    }
  } catch {
    return entries;
  }

  return entries;
}

function validSlug(slug?: string): slug is string {
  return !!slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getProductionOrigin();
  if (!origin) return [];

  const paths = ["", "/about", "/products", "/services", "/news", "/blog", "/contact", "/search"];
  const pages: MetadataRoute.Sitemap = paths.map((path) => ({
    url: `${origin}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  const seen = new Set(pages.map((page) => page.url));
  const news = await getPublishedNews();
  for (const item of news || []) {
    if (!validSlug(item.slug)) continue;
    const url = `${origin}/news/${encodeURIComponent(item.slug)}`;
    if (seen.has(url)) continue;
    seen.add(url);
    const modified = item.updated_at || item.published_at;
    const date = modified ? new Date(modified) : undefined;
    pages.push({
      url,
      ...(date && !Number.isNaN(date.getTime()) ? { lastModified: date } : {}),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return pages;
}
