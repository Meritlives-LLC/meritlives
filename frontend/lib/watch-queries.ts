import { apiFetch } from "./api";
import type { PaginatedWatchVideos } from "../types/watch";

export async function getWatchVideos(page = 1, perPage = 12) {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  return apiFetch<PaginatedWatchVideos>(`/watch?${params.toString()}`, { revalidate: 60 });
}
