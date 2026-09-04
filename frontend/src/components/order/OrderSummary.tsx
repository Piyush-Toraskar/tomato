import { formatMoney } from "../../lib/format";
import { getOrderSnapshot } from "../../lib/orderSnapshots";
import type { Order } from "../../types/order";

export function OrderSummary({ order }: { order: Order }) {
  const snapshot = getOrderSnapshot(order.id);
  const names = new Map(
    snapshot?.items.map((item) => [item.menuItemId, item.name]) ?? [],
  );

  return (
    <div>
      <div className="divide-y divide-warm-100 border-y border-warm-200">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 py-4 text-sm">
            <div>
              <p className="font-medium text-ink">
                {names.get(item.menu_item_id) ?? `Menu item #${item.menu_item_id}`}
              </p>
              <p className="mt-1 text-neutral-500">Quantity {item.quantity}</p>
            </div>
            <span className="font-medium text-ink">
              {formatMoney(Number(item.price) * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-neutral-600">Total</span>
        <span className="text-xl font-semibold text-ink">{formatMoney(order.total_amount)}</span>
      </div>
    </div>
  );
}
