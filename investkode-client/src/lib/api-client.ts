const isBrowser = typeof window !== "undefined";

export const API_BASE_URL = isBrowser
  ? "" // Use relative paths in browser (Nginx handles /api)
  : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000");

type ApiClientOptions = RequestInit & {
  skipJson?: boolean;
  _retry?: boolean;
};

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

async function refreshSession() {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return res.ok;
}

export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { skipJson, headers, _retry, ...rest } = options;

  let res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
  });

  if (res.status === 401 && !_retry && path !== "/api/v1/auth/refresh") {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await refreshSession();
      isRefreshing = false;
      onRefreshed(refreshed);

      if (refreshed) {
        res = await fetch(`${API_BASE_URL}${path}`, {
          ...rest,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(headers ?? {}),
          },
        });
      }
    } else {
      const refreshed = await new Promise<boolean>((resolve) => {
        subscribeTokenRefresh((success) => resolve(success));
      });

      if (refreshed) {
        res = await fetch(`${API_BASE_URL}${path}`, {
          ...rest,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(headers ?? {}),
          },
        });
      }
    }
  }

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;

    try {
      const text = await res.text();
      try {
        const body = JSON.parse(text);
        message =
          body?.error?.message ||
          body?.detail ||
          body?.message ||
          text;
      } catch {
        message = text || message;
      }
    } catch {
      // keep fallback message
    }

    throw new Error(message);
  }

  if (skipJson) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}