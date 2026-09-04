import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

export function Card({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn("rounded-2xl border border-warm-200 bg-white", className)}
      {...props}
    >
      {children}
    </div>
  );
}
