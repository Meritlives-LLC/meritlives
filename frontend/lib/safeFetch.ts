export async function safeFetch<T>(
  request: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    console.error("MERITLIVES API error:", error);
    return fallback;
  }
}
