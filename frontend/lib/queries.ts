import { apiFetch } from "./api";
import type {
  ApiResponse,
  BlogPost,
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

export async function getNews(params = "") {
  return apiFetch<Paginated<NewsItem>>(`/news${params}`, { revalidate: 60 });
}

export async function getNewsItem(slug: string) {
  return apiFetch<ApiResponse<NewsItem>>(`/news/${encodeURIComponent(slug)}`, {
    revalidate: 60,
  });
}

export async function getBlogPosts(params = "") {
  return apiFetch<Paginated<BlogPost>>(`/blog${params}`, { revalidate: 60 });
}

export async function getBlogPost(slug: string) {
  return apiFetch<ApiResponse<BlogPost>>(`/blog/${encodeURIComponent(slug)}`, {
    revalidate: 60,
  });
}
