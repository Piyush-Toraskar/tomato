import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useRoleOrders } from "../hooks/useOrderQueries";
import { useRestaurants } from "../hooks/useRestaurantQueries";
import { isActiveOrder } from "../lib/order";
import { OrderCard } from "../components/order/OrderCard";
import { OrderSkeleton } from "../components/order/OrderSkeleton";
import { Tabs } from "../components/ui/Tabs";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LinkButton } from "../components/ui/LinkButton";

const PAGE_SIZE = 20;
type OrderTab = "active" | "past";

export function OrdersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<OrderTab>("active");
  const [page, setPage] = useState(1);
  const offset = (page - 1) * PAGE_SIZE;
  const ordersQuery = useRoleOrders(user?.role ?? "CUSTOMER", PAGE_SIZE, offset);
  const restaurantsQuery = useRestaurants(100, 0);

  const restaurantMap = useMemo(
    () => new Map((restaurantsQuery.data ?? []).map((restaurant) => [restaurant.id, restaurant])),
    [restaurantsQuery.data],
  );

  const filtered = useMemo(
    () =>
      (ordersQuery.data ?? []).filter((order) =>
        tab === "active" ? isActiveOrder(order) : !isActiveOrder(order),
      ),
    [ordersQuery.data, tab],
  );

  if (!user) {
    return null;
  }

  const workspaceLabel =
    user.role === "RESTAURANT"
      ? "Restaurant workspace"
      : user.role === "DRIVER"
        ? "Driver workspace"
        : null;
  const workspaceLink = user.role === "RESTAURANT" ? "/restaurant/manage" : "/driver/manage";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-tomato-600">{user.role === "CUSTOMER" ? "Your account" : user.role}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Your orders</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {user.role === "CUSTOMER"
              ? "Track current orders and review completed ones."
              : "Orders are limited to the restaurant or driver linked to this account."}
          </p>
        </div>
        {workspaceLabel ? (
          <LinkButton to={workspaceLink} variant="secondary">
            {workspaceLabel}
          </LinkButton>
        ) : null}
      </div>

      <div className="mt-7">
        <Tabs
          ariaLabel="Order status filter"
          value={tab}
          onChange={setTab}
          options={[
            { value: "active", label: "Active" },
            { value: "past", label: "Past" },
          ]}
        />
      </div>

      <div className="mt-6">
        {ordersQuery.isPending ? <OrderSkeleton /> : null}
        {ordersQuery.isError ? (
          <ErrorState error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} title="Orders could not be loaded" />
        ) : null}
        {!ordersQuery.isPending && !ordersQuery.isError && filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title={tab === "active" ? "No active orders" : "No past orders"}
            description={
              user.role === "CUSTOMER"
                ? "Once you place an order, it will appear here."
                : "There are no matching orders for this linked account on this page."
            }
            action={
              user.role === "CUSTOMER" ? (
                <LinkButton to="/">Find something to eat</LinkButton>
              ) : undefined
            }
          />
        ) : null}
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} restaurant={restaurantMap.get(order.restaurant_id)} />
            ))}
          </div>
        ) : null}
      </div>

      {ordersQuery.data ? (
        <Pagination
          page={page}
          hasNext={ordersQuery.data.length === PAGE_SIZE}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ) : null}
    </div>
  );
}
