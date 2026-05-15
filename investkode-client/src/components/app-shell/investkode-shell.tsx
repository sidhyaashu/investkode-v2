import { cn } from "@/lib/utils";
import { SideRail } from "./side-rail";
import { Topbar } from "./topbar";

export function InvestKodeShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="min-h-screen text-[var(--ik-ink)]">
      <section
        className={cn(
          "mx-auto grid min-h-[calc(100vh-36px)] w-full grid-cols-[56px_1fr] overflow-hidden",
          "border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0.45))]",
          "shadow-[var(--ik-glass-shadow)] backdrop-blur-2xl",
          "dark:bg-[linear-gradient(180deg,rgba(22,22,25,0.88),rgba(15,15,18,0.82))]",
          className
        )}
      >
        <SideRail />
        <div className="flex min-w-0 flex-col">
          <Topbar />
          {children}
        </div>
      </section>
    </main>
  );
}