import { Check, Circle, X } from "lucide-react";
import { ORDER_STATUSES } from "../../lib/constants";
import { statusPosition } from "../../lib/order";
import { titleCaseStatus } from "../../lib/format";
import type { OrderStatus } from "../../types/order";
import { cn } from "../../lib/cn";

const statusCopy: Record<OrderStatus, string> = {
  PLACED: "Order placed",
  CONFIRMED: "Restaurant confirmed",
  PREPARING: "Preparing your order",
  READY: "Ready for collection",
  PICKED_UP: "Picked up by driver",
  DELIVERED: "Delivered",
  CANCELLED: "Order cancelled",
};

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-tomato-200 bg-tomato-50 p-4">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-tomato-100 text-tomato-700">
          <X className="h-4 w-4" />
        </span>

        <div>
          <p className="font-semibold text-ink">Order cancelled</p>

          <p className="mt-0.5 text-sm text-neutral-600">
            This order will not progress further.
          </p>
        </div>
      </div>
    );
  }

  const current = statusPosition(status);

  return (
    <ol
      className="space-y-0"
      aria-label={`Order status: ${titleCaseStatus(status)}`}
    >
      {ORDER_STATUSES.map((step, index) => {
        const complete = index < current;
        const active = index === current;
        const last = index === ORDER_STATUSES.length - 1;

        return (
          <li
            key={step}
            className="relative flex gap-4 pb-7 last:pb-0"
          >
            {!last ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[17px] top-9 h-[calc(100%-1.25rem)] w-px",
                  index < current
                    ? "bg-emerald-500"
                    : "bg-warm-200",
                )}
              />
            ) : null}

            <span
              className={cn(
                "relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 bg-white",
                complete &&
                  "border-emerald-600 bg-emerald-600 text-white",
                active &&
                  "border-tomato-500 text-tomato-600",
                !complete &&
                  !active &&
                  "border-warm-200 text-warm-300",
              )}
            >
              {complete ? (
                <Check className="h-4 w-4" />
              ) : (
                <Circle className="h-3 w-3 fill-current" />
              )}
            </span>

            <div className="pt-1.5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  active || complete
                    ? "text-ink"
                    : "text-neutral-400",
                )}
              >
                {statusCopy[step]}
              </p>

              {active ? (
                <p className="mt-1 text-sm text-neutral-600">
                  Current status
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}