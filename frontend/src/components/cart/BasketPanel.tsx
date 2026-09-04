import { Link } from "react-router-dom";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { formatMoney } from "../../lib/format";
import { QuantityControl } from "../ui/QuantityControl";

export function BasketPanel({ className = "" }: { className?: string }) {
  const {
    restaurant,
    lines,
    subtotalMinor,
    decrementItem,
    setQuantity,
    removeItem,
  } = useCart();

  return (
    <aside
      className={`rounded-2xl border border-warm-200 bg-white p-5 shadow-soft ${className}`}
      aria-label="Your basket"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Your basket</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {restaurant?.name ?? "Nothing added yet"}
          </p>
        </div>
        <ShoppingBag className="h-5 w-5 text-tomato-500" />
      </div>

      {lines.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-ink">Your basket is empty.</p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Add something delicious to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 divide-y divide-warm-100 border-y border-warm-100">
            {lines.map((line) => (
              <div key={line.menuItem.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {line.menuItem.name}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {formatMoney(line.menuItem.price)} each
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line.menuItem.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-400 transition hover:bg-warm-100 hover:text-tomato-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato-500"
                    aria-label={`Remove ${line.menuItem.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <QuantityControl
                    quantity={line.quantity}
                    onDecrease={() => decrementItem(line.menuItem.id)}
                    onIncrease={() => setQuantity(line.menuItem.id, line.quantity + 1)}
                  />
                  <span className="text-sm font-semibold text-ink">
                    {formatMoney((Number(line.menuItem.price) * line.quantity).toFixed(2))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-neutral-600">Subtotal</span>
            <span className="text-lg font-semibold text-ink">
              {formatMoney(subtotalMinor / 100)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Prices are checked again when you place the order.
          </p>
          <Link
            to="/checkout"
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-tomato-500 px-5 text-base font-semibold text-white transition hover:bg-tomato-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato-500 focus-visible:ring-offset-2"
          >
            Continue to checkout
          </Link>
        </>
      )}
    </aside>
  );
}
