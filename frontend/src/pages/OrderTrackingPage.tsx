import { ArrowLeft, Clock3, MapPin, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { useOrder, useOrderDriver, useOrderHistory } from "../hooks/useOrderQueries";
import { useRestaurant } from "../hooks/useRestaurantQueries";
import { formatDateTime } from "../lib/format";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { OrderTimeline } from "../components/order/OrderTimeline";
import { OrderSummary } from "../components/order/OrderSummary";
import { OrderSkeleton } from "../components/order/OrderSkeleton";
import { StatusIndicator } from "../components/ui/StatusIndicator";

export function OrderTrackingPage() {
  const orderId = Number(useParams().orderId);
  const orderQuery = useOrder(orderId, true);
  const historyQuery = useOrderHistory(orderId, true);
  const restaurantQuery = useRestaurant(orderQuery.data?.restaurant_id ?? 0);
  const driverQuery = useOrderDriver(
    orderId,
    Boolean(orderQuery.data && ["READY", "PICKED_UP", "DELIVERED"].includes(orderQuery.data.status)),
  );

  const driverUnavailable = driverQuery.error instanceof ApiError && driverQuery.error.status === 404;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Your orders
      </Link>

      {orderQuery.isPending ? <div className="mt-6"><OrderSkeleton count={1} /></div> : null}
      {orderQuery.isError ? (
        <div className="mt-6"><ErrorState error={orderQuery.error} onRetry={() => void orderQuery.refetch()} /></div>
      ) : null}

      {orderQuery.data ? (
        <>
          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-tomato-600">Order #{orderQuery.data.id}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-ink">Track your order</h1>
              <p className="mt-2 text-sm text-neutral-600">
                {restaurantQuery.data?.name ?? `Restaurant #${orderQuery.data.restaurant_id}`}
              </p>
            </div>
            <StatusIndicator status={orderQuery.data.status} />
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-warm-200 pb-5">
                <div>
                  <h2 className="text-xl font-semibold text-ink">Order progress</h2>
                  <p className="mt-1 text-sm text-neutral-500">Automatically refreshed every 8 seconds while active.</p>
                </div>
                <Clock3 className="h-5 w-5 text-neutral-400" />
              </div>
              <div className="mt-6">
                <OrderTimeline status={orderQuery.data.status} />
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-5">
                <h2 className="text-lg font-semibold text-ink">Restaurant</h2>
                <p className="mt-3 font-medium text-ink">
                  {restaurantQuery.data?.name ?? `Restaurant #${orderQuery.data.restaurant_id}`}
                </p>
                {restaurantQuery.data?.address ? (
                  <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-neutral-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {restaurantQuery.data.address}
                  </p>
                ) : null}
              </Card>

              {driverQuery.data ? (
                <Card className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-warm-100 text-warm-700">
                      <UserRound className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Assigned driver</p>
                      <p className="mt-1 font-semibold text-ink">{driverQuery.data.name}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-neutral-600">
                    Live driver location is not available for this order. Use the status timeline to follow its progress.
                  </p>
                </Card>
              ) : null}

              {!driverQuery.data && !driverUnavailable && driverQuery.isError ? (
                <ErrorState error={driverQuery.error} title="Driver details could not be loaded" />
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Order items</h2>
              <div className="mt-4"><OrderSummary order={orderQuery.data} /></div>
            </Card>
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Status history</h2>
              {historyQuery.isPending ? <p className="mt-4 text-sm text-neutral-500">Loading history...</p> : null}
              {historyQuery.isError ? <div className="mt-4"><ErrorState error={historyQuery.error} /></div> : null}
              <ol className="mt-4 space-y-4">
                {historyQuery.data?.map((entry) => (
                  <li key={entry.id} className="border-l-2 border-warm-200 pl-4">
                    <p className="text-sm font-semibold text-ink">{entry.to_status.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-neutral-500">{formatDateTime(entry.created_at)}</p>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
