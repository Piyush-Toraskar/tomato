import { cn } from "../../lib/cn";

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  value: T;
  options: Array<TabOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function Tabs<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-xl bg-warm-100 p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 rounded-lg px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato-500",
            value === option.value
              ? "bg-white text-ink shadow-sm"
              : "text-neutral-600 hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
