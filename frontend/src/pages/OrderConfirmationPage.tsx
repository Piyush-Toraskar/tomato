import { Check, Home, MapPinned } from "lucide-react";
import { useParams } from "react-router-dom";
import { useOrder } from "../hooks/useOrderQueries";
import { useRestaurant } from "../hooks/useRestaurantQueries";
import { getOrderSnapshot } from "../lib/orderSnapshots";
import { LinkButton } from "../components/ui/LinkButton";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { OrderSummary } from "../components/order/OrderSummary";
import { OrderSkeleton } from "../components/order/OrderSkeleton";
import { StatusIndicator } from "../components/ui/StatusIndicator";

export function OrderConfirmationPage() {
  const orderId = Number(useParams().orderId);
  const orderQuery = useOrder(orderId);
  const restaurantQuery = useRestaurant(orderQuery.data?.restaurant_id ?? 0);
  const snapshot = getOrderSnapshot(orderId);
  const restaurantName = restaurantQuery.data?.name ?? snapshot?.restaurant.name ?? "the restaurant";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      {orderQuery.isPending ? <OrderSkeleton count={1} /> : null}
      {orderQuery.isError ? (
        <ErrorState error={orderQuery.error} onRetry={() => void orderQuery.refetch()} />
      ) : null}

      {orderQuery.data ? (
        <>
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Order confirmed</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-600">
              Your order has been sent to {restaurantName}. Follow its status as the restaurant prepares it and the driver completes the delivery.
            </p>
          </div>

          <Card className="mt-8 p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-warm-200 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Order number</p>
                <p className="mt-1 text-2xl font-semibold text-ink">#{orderQuery.data.id}</p>
              </div>
              <StatusIndicator status={orderQuery.data.status} />
            </div>
            <div className="mt-5">
              <OrderSummary order={orderQuery.data} />
            </div>
          </Card>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <LinkButton
              to={`/orders/${orderQuery.data.id}/track`}
              className="w-full sm:w-auto"
              leftIcon={<MapPinned className="h-4 w-4" />}
            >
              Track order
            </LinkButton>
            <LinkButton
              to="/"
              className="w-full sm:w-auto"
              variant="secondary"
              leftIcon={<Home className="h-4 w-4" />}
            >
              Back to home
            </LinkButton>
          </div>
        </>
      ) : null}
    </div>
  );
}
