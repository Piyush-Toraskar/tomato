import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Tomato home"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato-500 focus-visible:ring-offset-2",
        className,
      )}
    >
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0"
        aria-hidden="true"
        fill="none"
      >
        <rect width="40" height="40" rx="12" fill="#E43D30" />
        <circle cx="19.5" cy="21.5" r="9.25" stroke="white" strokeWidth="2.8" />
        <path
          d="M19.5 11.5c1.7-3.1 4.4-4.8 8-5.1"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M13.4 22c2.5 3 6.6 4.2 11.7 2.6"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      {!compact ? (
        <span className="text-xl font-bold tracking-[-0.035em] text-ink">tomato</span>
      ) : null}
    </Link>
  );
}
