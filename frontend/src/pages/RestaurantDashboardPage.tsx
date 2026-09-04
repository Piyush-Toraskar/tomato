import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Store, Utensils } from "lucide-react";
import { ApiError } from "../api/client";
import { getRestaurantProfile } from "../api/restaurants";
import { useMenu } from "../hooks/useRestaurantQueries";
import { useRoleOrders } from "../hooks/useOrderQueries";
import { queryKeys } from "../lib/queryKeys";
import { formatMoney } from "../lib/format";
import { RestaurantProfileSetup } from "../components/restaurant/RestaurantProfileSetup";
import { RestaurantSettings } from "../components/restaurant/RestaurantSettings";
import { RestaurantVisual } from "../components/restaurant/RestaurantVisual";
import { RestaurantOrderActions } from "../components/order/RestaurantOrderActions";
import { StatusIndicator } from "../components/ui/StatusIndicator";
import { ErrorState } from "../components/ui/ErrorState";
import { Tabs } from "../components/ui/Tabs";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { OrderSkeleton } from "../components/order/OrderSkeleton";
import { Pagination } from "../components/ui/Pagination";

const PAGE_SIZE = 20;
type DashboardTab = "orders" | "menu" | "settings";

export function RestaurantDashboardPage() {
  const [tab, setTab] = useState<DashboardTab>("orders");
  const [page, setPage] = useState(1);
  const profileQuery = useQuery({
    queryKey: queryKeys.restaurantProfile,
    queryFn: getRestaurantProfile,
    retry: false,
  });
  const profileMissing = profileQuery.error instanceof ApiError && profileQuery.error.status === 400;
  const restaurantId = profileQuery.data?.id ?? 0;
  const menuQuery = useMenu(restaurantId, 100, 0);
  const ordersQuery = useRoleOrders("RESTAURANT", PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <p className="text-sm font-semibold text-tomato-600">Restaurant workspace</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Manage your restaurant</h1>

      {profileQuery.isPending ? <div className="mt-7 h-64 animate-pulse rounded-2xl bg-warm-100" /> : null}
      {profileMissing ? <div className="mt-7"><RestaurantProfileSetup /></div> : null}
      {profileQuery.isError && !profileMissing ? <div className="mt-7"><ErrorState error={profileQuery.error} onRetry={() => void profileQuery.refetch()} /></div> : null}

      {profileQuery.data ? (
        <>
          <Card className="mt-7 overflow-hidden">
            <div className="grid md:grid-cols-[280px_1fr]">
              <RestaurantVisual name={profileQuery.data.name} cuisine={profileQuery.data.cuisine} className="h-48 md:h-full" compact />
              <div className="p-5 sm:p-7">
                <p className="text-sm font-semibold text-tomato-600">{profileQuery.data.cuisine}</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">{profileQuery.data.name}</h2>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{profileQuery.data.address}</p>
                <p className="mt-4 text-xs text-neutral-500">Restaurant ID: {profileQuery.data.id}</p>
              </div>
            </div>
          </Card>

          <div className="mt-7 overflow-x-auto pb-2">
            <Tabs
              value={tab}
              onChange={setTab}
              ariaLabel="Restaurant workspace sections"
              options={[
                { value: "orders", label: "Orders" },
                { value: "menu", label: "Menu" },
                { value: "settings", label: "Operations" },
              ]}
            />
          </div>

          {tab === "orders" ? (
            <section className="mt-6">
              {ordersQuery.isPending ? <OrderSkeleton /> : null}
              {ordersQuery.isError ? <ErrorState error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} /> : null}
              {ordersQuery.data?.length === 0 ? (
                <EmptyState icon={<Store className="h-6 w-6" />} title="No restaurant orders" description="Customer orders for this restaurant will appear here." />
              ) : null}
              <div className="space-y-4">
                {ordersQuery.data?.map((order) => (
                  <Card key={order.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Order #{order.id}</p>
                        <p className="mt-2 font-semibold text-ink">{order.items.reduce((total, item) => total + item.quantity, 0)} items - {formatMoney(order.total_amount)}</p>
                      </div>
                      <StatusIndicator status={order.status} />
                    </div>
                    <div className="mt-5 border-t border-warm-100 pt-4">
                      <RestaurantOrderActions order={order} />
                    </div>
                  </Card>
                ))}
              </div>
              {ordersQuery.data ? <Pagination page={page} hasNext={ordersQuery.data.length === PAGE_SIZE} onPageChange={setPage} /> : null}
            </section>
          ) : null}

          {tab === "menu" ? (
            <section className="mt-6 rounded-2xl border border-warm-200 bg-white p-5 sm:p-7">
              <h2 className="text-xl font-semibold text-ink">Published menu</h2>
              {menuQuery.isError ? <div className="mt-5"><ErrorState error={menuQuery.error} /></div> : null}
              {menuQuery.data?.length === 0 ? (
                <EmptyState icon={<Utensils className="h-6 w-6" />} title="No menu items" description="Use Operations to add the first dish." />
              ) : null}
              <div className="mt-4 divide-y divide-warm-100">
                {menuQuery.data?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="mt-1 text-sm text-neutral-500">{item.is_available ? "Available" : "Unavailable"}</p>
                    </div>
                    <span className="font-semibold text-ink">{formatMoney(item.price)}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "settings" ? <div className="mt-6"><RestaurantSettings restaurantId={profileQuery.data.id} /></div> : null}
        </>
      ) : null}
    </div>
  );
}
