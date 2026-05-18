import { cn } from "@/lib/utils";
import { SideRail } from "./side-rail";
import { Topbar } from "./topbar";
import { AuthGuard } from "@/components/auth/auth-guard";

export function InvestKodeShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AuthGuard>
      <main className="h-screen w-screen overflow-hidden text-[var(--ik-ink)]">
        <section
          className={cn(
            "mx-auto grid h-full w-full grid-cols-[56px_1fr] overflow-hidden",
            "border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.93))]",
            "shadow-[var(--ik-glass-shadow)]",
            "dark:bg-[linear-gradient(180deg,#0a0a0b,#111114)]",
            className
          )}
        >
          <SideRail />
          <div className="flex min-w-0 flex-col h-full overflow-hidden">
            <Topbar />
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}