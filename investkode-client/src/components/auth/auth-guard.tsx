"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/features/auth/hooks";
import { useQueryClient } from "@tanstack/react-query";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useUser();

  useEffect(() => {
    if (user.isError) {
      queryClient.clear();
      router.replace("/auth");
    }
  }, [user.isError, router, queryClient]);

  if (user.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ik-field-bg)]">
        <div className="size-8 animate-spin rounded-full border-4 border-[var(--ik-rule)] border-t-[var(--ik-accent-deep)]" />
      </div>
    );
  }

  if (user.isError) {
    return null;
  }

  return <>{children}</>;
}
