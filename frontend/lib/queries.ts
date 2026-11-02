import { apiFetch } from "./api";
import type {
  ApiResponse,
  BlogPost,
  Category,
  NewsItem,
  Paginated,
  Product,
  Service,
} from "../types/api";

export async function getProducts(params = "") {
  return apiFetch<Paginated<Product>>(`/products${params}`, { revalidate: 60 });
}

export async function getProduct(slug: string) {
  return apiFetch<ApiResponse<Product>>(`/products/${encodeURIComponent(slug)}`, {
    revalidate: 60,
  });
}

export async function getServices(params = "") {
  return apiFetch<Paginated<Service>>(`/services${params}`, { revalidate: 60 });
}

export async function getService(slug: string) {
  return apiFetch<ApiResponse<Service>>(`/services/${encodeURIComponent(slug)}`, {
    revalidate: 60,
  });
}

export async function getNews(params = "", options: { cache?: RequestCache } = {}) {
  return apiFetch<Paginated<NewsItem>>(
    `/news${params}`,
    options.cache === "no-store" ? { cache: "no-store" } : { revalidate: 60 }
  );
}

export async function getNewsItem(slug: string) {
  return apiFetch<ApiResponse<NewsItem>>(`/news/${encodeURIComponent(slug)}`, {
    revalidate: 60,
  });
}

export async function getBlogPosts(params = "", options: { cache?: RequestCache } = {}) {
  return apiFetch<Paginated<BlogPost>>(
    `/blog${params}`,
    options.cache === "no-store" || options.cache === undefined
      ? { cache: "no-store" }
      : { revalidate: 60 }
  );
}

export async function getBlogCategories() {
  return apiFetch<Paginated<Category>>("/categories?type=blog&per_page=50", {
    cache: "no-store",
  });
}

export async function getNewsCategories() {
  const first = await apiFetch<Paginated<Category>>("/categories?type=news&per_page=50", {
    cache: "no-store",
  });
  const data = [...first.data];
  const lastPage = first.meta?.last_page ?? 1;
  for (let page = 2; page <= lastPage; page++) {
    const next = await apiFetch<Paginated<Category>>(`/categories?type=news&per_page=50&page=${page}`, {
      cache: "no-store",
    });
    data.push(...next.data);
  }
  return { ...first, data };
}

export async function getBlogPost(slug: string) {
  return apiFetch<ApiResponse<BlogPost>>(`/blog/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
}


export interface EditorialSearchResults {
  news: NewsItem[];
  blog: BlogPost[];
}

export async function searchEditorialContent(query: string, options: { cache?: RequestCache } = {}) {
  return apiFetch<ApiResponse<EditorialSearchResults>>(
    `/search?q=${encodeURIComponent(query)}`,
    options.cache === "no-store" || options.cache === undefined
      ? { cache: "no-store" }
      : { revalidate: 15 }
  );
}
