import { cn } from "@/lib/utils";
import type { DynamicRow } from "../types";

const logoVariantClass: Record<string, string> = {
  // Legacy aliases
  default: "bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))]",
  banks: "bg-[linear-gradient(135deg,var(--ik-warn),#FBBF24)]",
  it: "bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))]",
  energy: "bg-[linear-gradient(135deg,#0B2545,#5B72A0)]",
  finance: "bg-[linear-gradient(135deg,var(--ik-warn),#FBBF24)]",
  consumer: "bg-[linear-gradient(135deg,var(--ik-danger),#FB7185)]",
  core: "bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))]",
  speculative: "bg-[linear-gradient(135deg,var(--ik-danger),#FB7185)]",
  growth: "bg-[linear-gradient(135deg,var(--ik-accent-deep),#5C8DFF)]",

  // Dynamic hash pool
  color_1: "bg-[linear-gradient(135deg,var(--ik-accent),var(--ik-accent-2))]", // Blue
  color_2: "bg-[linear-gradient(135deg,var(--ik-warn),#FBBF24)]",                // Orange/Yellow
  color_3: "bg-[linear-gradient(135deg,#0B2545,#5B72A0)]",                       // Dark Blue
  color_4: "bg-[linear-gradient(135deg,var(--ik-danger),#FB7185)]",              // Red/Pink
  color_5: "bg-[linear-gradient(135deg,#8B5CF6,#C4B5FD)]",                       // Purple
  color_6: "bg-[linear-gradient(135deg,#10B981,#6EE7B7)]",                       // Green
};

export function CompanyLogo({ row }: { row: DynamicRow }) {
  const logo = row.meta?.logo;

  const label =
    logo?.label ||
    String(row.values?.symbol || row.values?.company_name || "IK")
      .slice(0, 2)
      .toUpperCase();

  if (logo?.type === "image" && logo.image_url) {
    return (
      <img
        src={logo.image_url}
        alt={label}
        className="size-8 rounded-[10px] object-cover"
      />
    );
  }

  return (
    <div
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-[10px] font-mono text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(43,107,255,0.25)] dark:text-black",
        logoVariantClass[logo?.variant ?? "default"]
      )}
    >
      {label}
    </div>
  );
}
