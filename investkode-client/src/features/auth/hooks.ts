import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, logout } from "./api";
import { useRouter } from "next/navigation";

export function useUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.clear();
      router.replace("/auth");
    },
  });
}
