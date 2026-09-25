const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

type ApiOptions = RequestInit & { revalidate?: number };

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { revalidate, ...request } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...request,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(request.headers || {}),
    },
    next: revalidate ? { revalidate } : undefined,
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const error = await response.json();
      message = error.message || error.error || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export async function apiPost<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
