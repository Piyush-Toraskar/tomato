import { Utensils } from "lucide-react";
import { cn } from "../../lib/cn";

const palettes = [
  "bg-[#f2d6c9] text-[#7d3028]",
  "bg-[#dce6d5] text-[#36553a]",
  "bg-[#eadfc7] text-[#6f4a20]",
  "bg-[#d8e4e8] text-[#31515c]",
  "bg-[#e7d8df] text-[#663d51]",
  "bg-[#e2ded5] text-[#51483b]",
];

function hash(value: string): number {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0);
}

export function RestaurantVisual({
  name,
  cuisine,
  className,
  compact = false,
}: {
  name: string;
  cuisine: string;
  className?: string;
  compact?: boolean;
}) {
  const palette = palettes[hash(name) % palettes.length] ?? palettes[0];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden",
        palette,
        className,
      )}
      role="img"
      aria-label={`${name}, ${cuisine}`}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-30"
        viewBox="0 0 400 220"
        preserveAspectRatio="none"
      >
        <circle cx="340" cy="20" r="100" fill="currentColor" opacity="0.14" />
        <circle cx="34" cy="210" r="110" fill="currentColor" opacity="0.12" />
        <path
          d="M230 0c-20 65 15 95 70 115 55 20 82 52 100 105V0Z"
          fill="currentColor"
          opacity="0.08"
        />
      </svg>
      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-lg bg-white/75 px-2.5 py-1.5 text-xs font-semibold backdrop-blur-sm">
        <Utensils className="h-3.5 w-3.5" />
        {cuisine}
      </div>
      <div
        className={cn(
          "absolute bottom-5 right-5 grid place-items-center rounded-2xl border border-white/40 bg-white/45 font-semibold tracking-[-0.04em] backdrop-blur-sm",
          compact ? "h-14 w-14 text-lg" : "h-20 w-20 text-2xl",
        )}
      >
        {initials || "T"}
      </div>
    </div>
  );
}
