import { apiClient } from "@/lib/api-client";

export type UserProfile = {
  id: string;
  email: string;
  scope: string;
  status: string;
};

export async function fetchMe() {
  return apiClient<UserProfile>("/api/v1/auth/me");
}
