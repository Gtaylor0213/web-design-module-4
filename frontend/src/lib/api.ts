import type { ApiErrorBody } from './types';

const TOKEN_KEY = 'rolebook.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** When true, do not attach the Authorization header even if a token is
   *  present. Used by signup/login which must accept anonymous traffic. */
  anonymous?: boolean;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, anonymous = false } = opts;
  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (!anonymous) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content — nothing to parse.
  if (res.status === 204) {
    return undefined as T;
  }

  // For PDF and other non-JSON responses, the caller should use rawApi instead.
  // Here we always parse JSON; if that fails on an error response we still
  // surface a useful error.
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    /* ignore — fall through to error handling below */
  }

  if (!res.ok) {
    const e = parsed as Partial<ApiErrorBody> | null;
    throw new ApiError(
      res.status,
      e?.error ?? 'unknown_error',
      e?.message ?? `request failed: HTTP ${res.status}`,
    );
  }

  return parsed as T;
}

/** Fetch a binary response (used for PDF export). Returns the Blob and the
 *  filename suggested by the server, if any. */
export async function apiBlob(
  path: string,
): Promise<{ blob: Blob; filename: string | null }> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      body?.error ?? 'unknown_error',
      body?.message ?? `request failed: HTTP ${res.status}`,
    );
  }

  const cd = res.headers.get('Content-Disposition') ?? '';
  const match = /filename="([^"]+)"/.exec(cd);
  return { blob: await res.blob(), filename: match?.[1] ?? null };
}
