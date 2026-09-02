// Centralised API client. Every request to the backend goes through here so the
// base URL, the JWT header and error handling live in one place.

const API_URL = import.meta.env.VITE_API_URL;

export const TOKEN_KEY = "it_ticketing_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors */
  }
}

/** Error carrying the HTTP status so callers can react to 401/403/etc. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

type Json = Record<string, unknown>;

async function request<T>(
  method: string,
  path: string,
  body?: Json | FormData,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  if (res.status === 401) {
    // token missing / expired -> drop it so the app falls back to the login page
    setToken(null);
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as Json).message)
        : "") || `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: Json | FormData) => request<T>("POST", path, body),
  put: <T>(path: string, body?: Json) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
