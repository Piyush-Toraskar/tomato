import { ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { formatMoney } from "../../lib/format";

export function BasketBar() {
  const { itemCount, subtotalMinor } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  if (
    itemCount === 0 ||
    (user && user.role !== "CUSTOMER") ||
    ["/basket", "/checkout"].includes(location.pathname)
  ) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-[4.75rem] z-40 md:hidden">
      <Link
        to="/basket"
        className="mx-auto flex h-14 max-w-lg items-center justify-between rounded-2xl bg-ink px-4 text-white shadow-lift transition active:scale-[0.99]"
      >
        <span>
          <span className="block text-xs text-white/70">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
          <span className="text-sm font-semibold">{formatMoney(subtotalMinor / 100)}</span>
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          View basket <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}
