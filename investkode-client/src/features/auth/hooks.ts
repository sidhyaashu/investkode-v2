import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "./api";

export function useUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
