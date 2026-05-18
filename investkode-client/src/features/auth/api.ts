import { apiClient } from "@/lib/api-client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: unknown;
};

export type UserProfile = {
  id: string;
  email?: string;
  scope?: string;
  status?: string;
  verified?: boolean;
  active?: boolean;
};

export async function fetchMe() {
  const res = await apiClient<ApiEnvelope<UserProfile>>("/api/v1/user/me");
  return res.data;
}

export async function logout() {
  return apiClient("/api/v1/auth/logout", {
    method: "POST",
    skipJson: true,
  });
}
