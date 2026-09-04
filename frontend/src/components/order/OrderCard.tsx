import { ArrowRight, CalendarDays, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";
import type { Order } from "../../types/order";
import type { Restaurant } from "../../types/restaurant";
import { formatDateTime, formatMoney } from "../../lib/format";
import { getOrderSnapshot } from "../../lib/orderSnapshots";
import { StatusIndicator } from "../ui/StatusIndicator";

export function OrderCard({
  order,
  restaurant,
}: {
  order: Order;
  restaurant?: Restaurant;
}) {
  const snapshot = getOrderSnapshot(order.id);
  const restaurantName = restaurant?.name ?? snapshot?.restaurant.name ?? `Restaurant #${order.restaurant_id}`;
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <article className="rounded-2xl border border-warm-200 bg-white p-5 transition hover:border-warm-300 hover:shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
            Order #{order.id}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-ink">{restaurantName}</h3>
        </div>
        <StatusIndicator status={order.status} />
      </div>

      <div className="mt-5 grid gap-3 text-sm text-neutral-600 sm:grid-cols-3">
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-neutral-400" />
          {formatDateTime(order.created_at)}
        </span>
        <span className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-neutral-400" />
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span className="font-semibold text-ink sm:text-right">{formatMoney(order.total_amount)}</span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-warm-100 pt-4">
        <Link
          to={`/orders/${order.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink transition hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato-500"
        >
          View details <ArrowRight className="h-4 w-4" />
        </Link>
        {order.status !== "DELIVERED" && order.status !== "CANCELLED" ? (
          <Link
            to={`/orders/${order.id}/track`}
            className="inline-flex h-10 items-center rounded-xl bg-tomato-50 px-3 text-sm font-semibold text-tomato-700 transition hover:bg-tomato-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato-500"
          >
            Track order
          </Link>
        ) : null}
      </div>
    </article>
  );
}
