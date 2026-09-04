import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(90deg,#f1eee8_25%,#faf9f6_50%,#f1eee8_75%)] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
