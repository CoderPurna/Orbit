/**
 * Thin fetch wrapper for Orbit's route handlers.
 *
 * Errors follow Architecture §10 — `{ error: { code, message } }` — but a few
 * older routes still return `{ error: "message" }`. Both are normalised into
 * an ApiError with a stable `code` the UI can branch on.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

type ErrorBody =
  | { error: { code?: string; message?: string } }
  | { error: string }
  | Record<string, unknown>;

function codeFromStatus(status: number): string {
  switch (status) {
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 429:
      return "rate_limited";
    default:
      return status >= 500 ? "internal_error" : "request_failed";
  }
}

function normaliseError(status: number, body: ErrorBody | null): ApiError {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error: unknown }).error;
    if (typeof err === "string") {
      return new ApiError(codeFromStatus(status), err, status);
    }
    if (err && typeof err === "object") {
      const e = err as { code?: string; message?: string };
      return new ApiError(
        e.code ?? codeFromStatus(status),
        e.message ?? "Something went wrong",
        status,
      );
    }
  }
  return new ApiError(codeFromStatus(status), "Something went wrong", status);
}

export type ApiInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Query string parameters; undefined values are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
};

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { body, query, headers, ...rest } = init;

  let url = path;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const response = await fetch(url, {
    ...rest,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...((headers as Record<string, string> | undefined) ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const parsed = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw normaliseError(response.status, parsed);
  }

  return parsed as T;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
