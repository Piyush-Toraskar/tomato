import type { PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "brand";

export function Badge({
  children,
  tone = "neutral",
  className,
}: PropsWithChildren<{ tone?: BadgeTone; className?: string }>) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-warm-100 text-warm-700",
    success: "bg-emerald-50 text-emerald-800",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-tomato-50 text-tomato-700",
    brand: "bg-tomato-50 text-tomato-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
