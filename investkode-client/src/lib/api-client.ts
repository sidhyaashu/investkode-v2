export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ApiClientOptions = RequestInit & {
  skipJson?: boolean;
};

export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { skipJson, headers, ...rest } = options;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
  });

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;

    try {
      const body = await res.json();
      message =
        body?.error?.message ||
        body?.detail ||
        body?.message ||
        message;
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