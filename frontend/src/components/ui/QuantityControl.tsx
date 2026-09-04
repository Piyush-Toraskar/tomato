import { Minus, Plus } from "lucide-react";

interface QuantityControlProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
}

export function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
  disabled,
}: QuantityControlProps) {
  return (
    <div className="inline-flex h-10 items-center rounded-xl border border-warm-200 bg-white" aria-label="Quantity">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        className="grid h-10 w-10 place-items-center rounded-l-xl text-ink transition hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tomato-500 disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold text-ink" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || quantity >= 99}
        className="grid h-10 w-10 place-items-center rounded-r-xl text-ink transition hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tomato-500 disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
