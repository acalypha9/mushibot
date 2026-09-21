export interface ApiErrorDetail {
  code?: string;
  message: string;
  request_id?: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  public detail: ApiErrorDetail;

  constructor(detail: ApiErrorDetail) {
    super(detail.message);
    this.name = "ApiError";
    this.detail = detail;
  }
}

export interface PaginationEnvelope<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

let memoryToken: string | null = null;

export const setToken = (token: string | null) => {
  memoryToken = token;
};

export const getToken = () => memoryToken;

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload.exp === "number") {
      // Expire 5 seconds early to prevent race conditions
      return payload.exp * 1000 <= Date.now() + 5000;
    }
    return false;
  } catch {
    return true;
  }
}

export const onUnauthorizedListeners: Array<() => void> = [];
export const registerOnUnauthorized = (cb: () => void) => {
  onUnauthorizedListeners.push(cb);
  return () => {
    const idx = onUnauthorizedListeners.indexOf(cb);
    if (idx !== -1) onUnauthorizedListeners.splice(idx, 1);
  };
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_API_URL || ""}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  
  const activeToken = memoryToken || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
  if (activeToken && !endpoint.includes("/api/auth/login")) {
    headers.set("Authorization", `Bearer ${activeToken}`);
  }
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && !endpoint.includes("/api/auth/login")) {
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      onUnauthorizedListeners.forEach((cb) => {
        try { cb(); } catch (e) {}
      });
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    let message = "An unexpected error occurred";
    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail.map((d: { msg?: string }) => d.msg || "Invalid input").join(", ");
    } else if (data?.error?.message) {
      message = data.error.message;
    } else if (data?.message) {
      message = data.message;
    } else if (res.status === 401) {
      message = "Invalid email or password.";
    } else if (res.statusText) {
      message = res.statusText;
    }
    const errorDetail = { message };
    throw new ApiError(errorDetail);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: "DELETE" }),
};
