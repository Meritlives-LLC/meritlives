import { serverFetchGate } from "./request-gate";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000/api/v1"
    : "");
const requestedTimeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 6000);
const API_TIMEOUT_MS = Number.isFinite(requestedTimeout) ? Math.max(1, Math.min(10000, requestedTimeout)) : 6000;

type ApiOptions = RequestInit & { revalidate?: number };

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: FieldErrors = {},
    public readonly retryAfter?: number,
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
  const slot = typeof window === "undefined" ? serverFetchGate.enter() : null;
  if (slot && "retryAfter" in slot) throw new ApiError("The API is busy. Try again shortly.", 503, {}, slot.retryAfter);
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
      try { payload = await boundedJson(response) as typeof payload; } catch { /* Non-JSON errors still retain HTTP status. */ }
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
      const rawRetry = response.headers?.get("Retry-After");
      const retry = rawRetry && /^\d+$/.test(rawRetry) ? Math.max(1, Math.min(3600, Number(rawRetry))) : undefined;
      throw new ApiError(message, response.status, errors, retry);
    }

    return await boundedJson(response) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`API request timed out after ${API_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (slot && "release" in slot) slot.release();
  }
}

async function boundedJson(response: Response): Promise<unknown> {
  const maximum = 2 * 1024 * 1024;
  const length = response.headers?.get("Content-Length");
  if (length && /^\d+$/.test(length) && Number(length) > maximum) {
    await response.body?.cancel().catch(() => {});
    throw new ApiError("API response exceeded the size limit.", 502);
  }
  const reader = response.body?.getReader();
  if (!reader) return response.json();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maximum) throw new ApiError("API response exceeded the size limit.", 502);
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }
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
