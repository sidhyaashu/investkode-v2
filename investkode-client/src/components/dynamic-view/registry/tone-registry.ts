import type { Tone } from "../types";

export function toneClass(tone?: Tone) {
  switch (tone) {
    case "positive":
    case "success":
      return "text-[var(--ik-good)] bg-[var(--ik-good-soft)]";
    case "negative":
    case "danger":
      return "text-[var(--ik-danger-deep)] bg-[var(--ik-danger-soft)]";
    case "warning":
      return "text-[var(--ik-warn)] bg-[var(--ik-warn-soft)]";
    case "info":
      return "text-[var(--ik-accent-deep)] bg-[var(--ik-accent-soft)] dark:text-white";
    case "muted":
      return "text-[var(--ik-ink-3)] bg-[var(--ik-rule-2)]";
    case "live":
      return "text-[var(--ik-live)] bg-[var(--ik-danger-soft)]";
    case "premium":
      return "text-[var(--ik-accent-deep)] bg-[var(--ik-accent-soft)]";
    default:
      return "text-[var(--ik-ink-2)] bg-[var(--ik-rule-2)]";
  }
}