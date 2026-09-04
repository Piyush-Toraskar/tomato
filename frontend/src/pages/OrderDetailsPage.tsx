import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { updateOrderStatus } from "../api/orders";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useOrder, useOrderDriver, useOrderHistory } from "../hooks/useOrderQueries";
import { useRestaurant } from "../hooks/useRestaurantQueries";
import { useToast } from "../hooks/useToast";
import { queryKeys } from "../lib/queryKeys";
import { formatDateTime } from "../lib/format";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { OrderSkeleton } from "../components/order/OrderSkeleton";
import { OrderSummary } from "../components/order/OrderSummary";
import { OrderTimeline } from "../components/order/OrderTimeline";
import { StatusIndicator } from "../components/ui/StatusIndicator";

export function OrderDetailsPage() {
  const orderId = Number(useParams().orderId);
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const orderQuery = useOrder(orderId);
  const historyQuery = useOrderHistory(orderId);
  const restaurantQuery = useRestaurant(orderQuery.data?.restaurant_id ?? 0);
  const driverQuery = useOrderDriver(orderId, Boolean(orderQuery.data));

  const cancelMutation = useMutation({
    mutationFn: () => updateOrderStatus(orderId, "CANCELLED"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orderHistory(orderId) });
      showToast({ title: "Order cancelled", tone: "success" });
    },
    onError: (error) => {
      showToast({
        title: "Order could not be cancelled",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    },
  });

  const canCustomerCancel = user?.role === "CUSTOMER" && orderQuery.data?.status === "PLACED";
  const canRestaurantCancel =
    user?.role === "RESTAURANT" &&
    orderQuery.data &&
    ["PLACED", "CONFIRMED", "PREPARING", "READY"].includes(orderQuery.data.status);
  const driverMissing = driverQuery.error instanceof ApiError && driverQuery.error.status === 404;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Your orders
      </Link>

      {orderQuery.isPending ? <div className="mt-6"><OrderSkeleton count={1} /></div> : null}
      {orderQuery.isError ? <div className="mt-6"><ErrorState error={orderQuery.error} onRetry={() => void orderQuery.refetch()} /></div> : null}

      {orderQuery.data ? (
        <>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-tomato-600">Order #{orderQuery.data.id}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-ink">
                {restaurantQuery.data?.name ?? `Restaurant #${orderQuery.data.restaurant_id}`}
              </h1>
              <p className="mt-2 text-sm text-neutral-500">Placed {formatDateTime(orderQuery.data.created_at)}</p>
            </div>
            <StatusIndicator status={orderQuery.data.status} />
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Items</h2>
              <div className="mt-4"><OrderSummary order={orderQuery.data} /></div>
            </Card>
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Progress</h2>
              <div className="mt-5"><OrderTimeline status={orderQuery.data.status} /></div>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-ink">History</h2>
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
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Driver</h2>
              {driverQuery.data ? (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-warm-50 p-4">
                  <UserRound className="h-5 w-5 text-tomato-600" />
                  <div>
                    <p className="font-semibold text-ink">{driverQuery.data.name}</p>
                    <p className="text-sm text-neutral-500">Assigned to this order</p>
                  </div>
                </div>
              ) : null}
              {driverMissing ? <p className="mt-4 text-sm leading-6 text-neutral-600">A driver has not been assigned yet.</p> : null}
              {driverQuery.isError && !driverMissing ? <div className="mt-4"><ErrorState error={driverQuery.error} /></div> : null}
            </Card>
          </div>

          {canCustomerCancel || canRestaurantCancel ? (
            <Card className="mt-6 flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h2 className="font-semibold text-ink">Cancel this order</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Cancellation availability depends on the order's current stage.
                </p>
              </div>
              <Button
                variant="danger"
                loading={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
                leftIcon={<Ban className="h-4 w-4" />}
              >
                Cancel order
              </Button>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
