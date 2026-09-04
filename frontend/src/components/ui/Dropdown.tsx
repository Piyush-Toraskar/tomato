import type { PropsWithChildren, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

interface DropdownProps extends PropsWithChildren {
  label: ReactNode;
  align?: "left" | "right";
}

export function Dropdown({ label, align = "right", children }: DropdownProps) {
  return (
    <details className="group relative">
      <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink transition hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato-500 [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
      </summary>
      <div
        className={cn(
          "absolute z-50 mt-2 min-w-52 rounded-xl border border-warm-200 bg-white p-2 shadow-lift",
          align === "right" ? "right-0" : "left-0",
        )}
      >
        {children}
      </div>
    </details>
  );
}
