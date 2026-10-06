import type { NewsItem } from "../types/api";

const APPROVED_NEWS_CATEGORIES = ["Technology", "Business", "Digital Innovation"];

export function getNewsCategoryLabel(story: Pick<NewsItem, "category">): string | undefined {
  const name = story.category?.name;
  return name && APPROVED_NEWS_CATEGORIES.includes(name) ? name : undefined;
}

function normalizedName(value: string) {
  return value.trim().toLocaleLowerCase("en");
}

function normalizedHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLocaleLowerCase("en");
  } catch {
    return null;
  }
}

export function getExternalNewsSource(
  story: Pick<NewsItem, "author_name" | "source">
): { name: string; url: string } | undefined {
  const name = story.source?.name?.trim();
  const url = story.source?.url?.trim();
  const author = story.author_name?.trim();
  if (!name || !url || (author && normalizedName(name) === normalizedName(author))) return undefined;

  const sourceHost = normalizedHost(url);
  const siteHost = process.env.NEXT_PUBLIC_SITE_URL
    ? normalizedHost(process.env.NEXT_PUBLIC_SITE_URL)
    : null;
  if (!sourceHost || !siteHost || sourceHost === siteHost) return undefined;

  return { name, url };
}

export function formatNewsDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getValidModifiedTime(publishedAt?: string | null, updatedAt?: string | null) {
  if (!publishedAt || !updatedAt) return undefined;
  const publishedTime = new Date(publishedAt).getTime();
  const updatedTime = new Date(updatedAt).getTime();
  if (Number.isNaN(publishedTime) || Number.isNaN(updatedTime) || updatedTime <= publishedTime) {
    return undefined;
  }

  return updatedAt;
}
