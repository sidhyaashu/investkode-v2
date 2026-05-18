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
    <main className="h-screen w-screen overflow-hidden text-[var(--ik-ink)]">
      <section
        className={cn(
          "mx-auto grid h-full w-full grid-cols-[56px_1fr] overflow-hidden",
          "border border-[var(--ik-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0.45))]",
          "shadow-[var(--ik-glass-shadow)] backdrop-blur-2xl",
          "dark:bg-[linear-gradient(180deg,rgba(22,22,25,0.88),rgba(15,15,18,0.82))]",
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
  );
}