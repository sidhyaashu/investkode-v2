"use client";

import Link from "next/link";
import {
  HouseIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PhoneCallIcon,
  StarIcon,
  SunIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const nav = [
  { href: "/", icon: HouseIcon, label: "Home" },
  { href: "/concalls", icon: PhoneCallIcon, label: "Concalls" },
  { href: "/watchlist", icon: StarIcon, label: "Watchlist", active: true },
  { href: "/search", icon: MagnifyingGlassIcon, label: "Search" },
];

export function SideRail() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  async function handleLogout() {
    try {
      await apiClient("/api/v1/auth/logout", { method: "POST" });
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed", error);
      // Fallback redirect anyway
      router.push("/auth");
    }
  }

  return (
    <aside className="flex flex-col items-center gap-2.5 border-r border-[var(--ik-rule)] bg-[linear-gradient(180deg,rgba(255,255,255,0.50),rgba(220,233,255,0.40))] py-3.5 dark:bg-[linear-gradient(180deg,rgba(20,20,23,0.7),rgba(14,14,17,0.6))]">
      <div className="mb-2 grid size-9 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] text-lg font-bold text-white shadow-[0_4px_12px_rgba(43,107,255,0.35)] dark:text-black">
        i
      </div>

      {nav.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "grid size-[34px] place-items-center rounded-[10px] text-[var(--ik-ink-2)] transition hover:bg-white/70 hover:text-[var(--ik-accent-deep)] dark:hover:bg-white/10",
              item.active &&
                "bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))] text-white shadow-[0_4px_12px_rgba(43,107,255,0.35)] dark:text-black"
            )}
          >
            <Icon size={18} weight="regular" />
          </Link>
        );
      })}

      <div className="flex-1" />

      <button
        type="button"
        title="Toggle theme"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="grid size-[34px] place-items-center rounded-[10px] text-[var(--ik-ink-2)] transition hover:bg-white/70 hover:text-[var(--ik-accent-deep)] dark:hover:bg-white/10"
      >
        {!mounted ? (
          <div className="size-[18px] animate-pulse rounded-full bg-[var(--ik-rule)]" />
        ) : isDark ? (
          <SunIcon size={18} />
        ) : (
          <MoonIcon size={18} />
        )}
      </button>

      <button
        type="button"
        title="Logout"
        onClick={handleLogout}
        className="grid size-[34px] place-items-center rounded-[10px] text-[var(--ik-ink-2)] transition hover:bg-white/70 hover:text-[var(--ik-error)] dark:hover:bg-white/10"
      >
        <SignOutIcon size={18} />
      </button>
    </aside>
  );
}