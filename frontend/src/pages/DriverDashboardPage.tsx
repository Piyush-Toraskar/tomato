import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bike, ClipboardList } from "lucide-react";
import { ApiError } from "../api/client";
import { getDriverProfile } from "../api/drivers";
import { useRoleOrders } from "../hooks/useOrderQueries";
import { queryKeys } from "../lib/queryKeys";
import { formatMoney } from "../lib/format";
import { DriverProfileSetup } from "../components/driver/DriverProfileSetup";
import { DriverSettings } from "../components/driver/DriverSettings";
import { DriverOrderActions } from "../components/order/DriverOrderActions";
import { StatusIndicator } from "../components/ui/StatusIndicator";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { OrderSkeleton } from "../components/order/OrderSkeleton";
import { Pagination } from "../components/ui/Pagination";
import { Tabs } from "../components/ui/Tabs";
import { Badge } from "../components/ui/Badge";

const PAGE_SIZE = 20;
type DriverTab = "orders" | "settings";

export function DriverDashboardPage() {
  const [tab, setTab] = useState<DriverTab>("orders");
  const [page, setPage] = useState(1);
  const profileQuery = useQuery({
    queryKey: queryKeys.driverProfile,
    queryFn: getDriverProfile,
    retry: false,
  });
  const profileMissing = profileQuery.error instanceof ApiError && profileQuery.error.status === 400;
  const ordersQuery = useRoleOrders("DRIVER", PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <p className="text-sm font-semibold text-tomato-600">Driver workspace</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Delivery operations</h1>

      {profileQuery.isPending ? <div className="mt-7 h-48 animate-pulse rounded-2xl bg-warm-100" /> : null}
      {profileMissing ? <div className="mt-7"><DriverProfileSetup /></div> : null}
      {profileQuery.isError && !profileMissing ? <div className="mt-7"><ErrorState error={profileQuery.error} onRetry={() => void profileQuery.refetch()} /></div> : null}

      {profileQuery.data ? (
        <>
          <Card className="mt-7 p-5 sm:p-7">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-warm-100 text-tomato-600">
                <Bike className="h-7 w-7" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold text-ink">{profileQuery.data.name}</h2>
                  <Badge tone={profileQuery.data.is_available ? "success" : "warning"}>
                    {profileQuery.data.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-500">Driver ID: {profileQuery.data.id}</p>
              </div>
            </div>
          </Card>

          <div className="mt-7">
            <Tabs
              value={tab}
              onChange={setTab}
              ariaLabel="Driver workspace sections"
              options={[
                { value: "orders", label: "Assigned orders" },
                { value: "settings", label: "Availability and location" },
              ]}
            />
          </div>

          {tab === "orders" ? (
            <section className="mt-6">
              {ordersQuery.isPending ? <OrderSkeleton /> : null}
              {ordersQuery.isError ? <ErrorState error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} /> : null}
              {ordersQuery.data?.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-6 w-6" />}
                  title="No assigned orders"
                  description="Orders assigned to this driver will appear here."
                />
              ) : null}
              <div className="space-y-4">
                {ordersQuery.data?.map((order) => (
                  <Card key={order.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Order #{order.id}</p>
                        <p className="mt-2 font-semibold text-ink">{formatMoney(order.total_amount)}</p>
                      </div>
                      <StatusIndicator status={order.status} />
                    </div>
                    <div className="mt-5 border-t border-warm-100 pt-4">
                      <DriverOrderActions order={order} />
                    </div>
                  </Card>
                ))}
              </div>
              {ordersQuery.data ? <Pagination page={page} hasNext={ordersQuery.data.length === PAGE_SIZE} onPageChange={setPage} /> : null}
            </section>
          ) : null}

          {tab === "settings" ? <div className="mt-6"><DriverSettings isAvailable={profileQuery.data.is_available} /></div> : null}
        </>
      ) : null}
    </div>
  );
}
