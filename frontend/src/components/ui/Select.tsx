import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;

  return (
    <label className="block" htmlFor={selectId}>
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <span className="relative block">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border bg-white px-3 pr-10 text-[15px] text-ink outline-none transition focus:border-tomato-500 focus:ring-4 focus:ring-tomato-100",
            error ? "border-tomato-500" : "border-warm-200",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </span>
      {error ? <span className="mt-1.5 block text-xs text-tomato-700">{error}</span> : null}
    </label>
  );
});
