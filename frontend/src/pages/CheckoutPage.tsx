import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Info, LockKeyhole, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createOrder } from "../api/orders";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useToast } from "../hooks/useToast";
import { clearIdempotencyKey, getOrCreateIdempotencyKey } from "../lib/idempotency";
import { saveOrderSnapshot } from "../lib/orderSnapshots";
import { formatMoney } from "../lib/format";
import type { OrderCreate } from "../types/order";
import { Button } from "../components/ui/Button";
import { LinkButton } from "../components/ui/LinkButton";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";

export function CheckoutPage() {
  const { user } = useAuth();
  const { restaurant, lines, subtotalMinor, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [lastError, setLastError] = useState<unknown>(null);

  const payload = useMemo<OrderCreate | null>(() => {
    if (!restaurant || lines.length === 0) {
      return null;
    }

    return {
      restaurant_id: restaurant.id,
      items: lines.map((line) => ({
        menu_item_id: line.menuItem.id,
        quantity: line.quantity,
      })),
    };
  }, [lines, restaurant]);

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!payload) {
        throw new Error("Your basket is empty.");
      }
      const idempotencyKey = getOrCreateIdempotencyKey(payload);
      return createOrder(payload, idempotencyKey);
    },
    onSuccess: (order) => {
      if (restaurant) {
        saveOrderSnapshot({
          orderId: order.id,
          restaurant,
          items: lines.map((line) => ({
            menuItemId: line.menuItem.id,
            name: line.menuItem.name,
            price: line.menuItem.price,
            quantity: line.quantity,
          })),
          savedAt: new Date().toISOString(),
        });
      }

      clearIdempotencyKey();
      clearCart();
      showToast({
        title: "Order placed",
        description: `Order #${order.id} has been sent to the restaurant.`,
        tone: "success",
      });
      navigate(`/orders/${order.id}/confirmation`, { replace: true });
    },
    onError: (error) => {
      setLastError(error);
      if (error instanceof ApiError && error.status === 409) {
        showToast({
          title: "Order could not be placed",
          description: error.detail,
          tone: "error",
        });
      }
    },
  });

  if (!payload || !restaurant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Your basket is empty"
          description="Choose a restaurant and add a menu item before checkout."
          action={<LinkButton to="/">Browse restaurants</LinkButton>}
        />
      </div>
    );
  }

  if (user?.role !== "CUSTOMER") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <ErrorState error={new Error("Only customer accounts can place orders.")} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link to="/basket" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to basket
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-ink">Review your order</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Review your basket before sending the order to the restaurant.
          </p>

          <Card className="mt-7 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Account</h2>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-warm-50 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-tomato-600">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{user.name}</p>
                <p className="text-sm text-neutral-500">{user.email}</p>
              </div>
            </div>
          </Card>

          <Card className="mt-5 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Delivery information</h2>
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p className="text-sm leading-6 text-amber-900">
                Delivery addresses and online payments are not collected in this version. Placing the order sends the selected items directly to the restaurant.
              </p>
            </div>
          </Card>

          {lastError ? (
            <div className="mt-5">
              <ErrorState
                error={lastError}
                onRetry={() => {
                  setLastError(null);
                  orderMutation.mutate();
                }}
                title="The order was not completed"
              />
            </div>
          ) : null}
        </div>

        <Card className="h-fit p-5 lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-tomato-600">Order summary</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{restaurant.name}</h2>
          <div className="mt-5 divide-y divide-warm-100 border-y border-warm-200">
            {lines.map((line) => (
              <div key={line.menuItem.id} className="flex justify-between gap-4 py-4 text-sm">
                <span className="text-neutral-700">
                  {line.quantity} x {line.menuItem.name}
                </span>
                <span className="font-medium text-ink">
                  {formatMoney(Number(line.menuItem.price) * line.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-neutral-600">Estimated total</span>
            <span className="text-xl font-semibold text-ink">{formatMoney(subtotalMinor / 100)}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Prices are checked again when the order is placed.
          </p>
          <Button
            className="mt-6 w-full"
            size="lg"
            loading={orderMutation.isPending}
            onClick={() => {
              setLastError(null);
              orderMutation.mutate();
            }}
            leftIcon={<LockKeyhole className="h-4 w-4" />}
          >
            Place order
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-neutral-500">
            Repeated clicks are disabled, and retries reuse the same idempotency key.
          </p>
        </Card>
      </div>
    </div>
  );
}
