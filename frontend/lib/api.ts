const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000/api/v1"
    : "");
const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 6000);

type ApiOptions = RequestInit & { revalidate?: number };

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const { revalidate, ...request } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...request,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(request.headers || {}),
      },
      next: revalidate ? { revalidate } : undefined,
    });

    if (!response.ok) {
      let payload: { message?: unknown; error?: unknown; errors?: unknown } = {};
      try { payload = await response.json(); } catch { /* Non-JSON errors still retain HTTP status. */ }
      const errorBody = payload && typeof payload === "object" ? payload : {};
      const detail = typeof errorBody.message === "string" ? errorBody.message : errorBody.error;
      const message = typeof detail === "string" ? detail : `API request failed: ${response.status}`;
      const errors: FieldErrors = {};
      if (response.status === 422 && errorBody.errors && typeof errorBody.errors === "object") {
        for (const [field, messages] of Object.entries(errorBody.errors)) {
          if (Array.isArray(messages)) {
            const valid = messages.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
            if (valid.length) Object.defineProperty(errors, field, { value: valid, enumerable: true });
          }
        }
      }
      throw new ApiError(message, response.status, errors);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`API request timed out after ${API_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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
