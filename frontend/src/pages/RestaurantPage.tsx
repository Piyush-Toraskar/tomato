import { useState } from "react";
import { ArrowLeft, MapPin, Utensils } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useMenu, useRestaurant } from "../hooks/useRestaurantQueries";
import { MenuItemRow } from "../components/menu/MenuItemRow";
import { MenuSkeleton } from "../components/menu/MenuSkeleton";
import { RestaurantVisual } from "../components/restaurant/RestaurantVisual";
import { BasketPanel } from "../components/cart/BasketPanel";
import { Breadcrumb } from "../components/ui/Breadcrumb";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Pagination } from "../components/ui/Pagination";

const MENU_PAGE_SIZE = 20;

export function RestaurantPage() {
  const params = useParams();
  const restaurantId = Number(params.restaurantId);
  const [page, setPage] = useState(1);
  const offset = (page - 1) * MENU_PAGE_SIZE;
  const restaurantQuery = useRestaurant(restaurantId);
  const menuQuery = useMenu(restaurantId, MENU_PAGE_SIZE, offset);
  const restaurant = restaurantQuery.data;

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return (
      <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-8">
        <ErrorState error={new Error("Invalid restaurant identifier.")} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-5 hidden sm:block">
        <Breadcrumb items={[{ label: "Restaurants", to: "/" }, { label: restaurant?.name ?? "Restaurant" }]} />
      </div>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-ink sm:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {restaurantQuery.isPending ? (
        <div className="h-72 animate-pulse rounded-2xl bg-warm-100" />
      ) : null}
      {restaurantQuery.isError ? (
        <ErrorState
          error={restaurantQuery.error}
          onRetry={() => void restaurantQuery.refetch()}
          title="Restaurant could not be loaded"
        />
      ) : null}

      {restaurant ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-warm-200 bg-white">
            <RestaurantVisual
              name={restaurant.name}
              cuisine={restaurant.cuisine}
              className="h-56 w-full sm:h-72 lg:h-80"
            />
            <div className="p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-semibold text-tomato-600">{restaurant.cuisine}</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">
                    {restaurant.name}
                  </h1>
                  <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-neutral-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {restaurant.address}
                  </p>
                </div>
                <p className="max-w-md text-sm leading-6 text-neutral-500">
                  Prices and availability are shown exactly as listed by the restaurant.
                </p>
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-2xl border border-warm-200 bg-white px-5 py-6 sm:px-7">
              <div className="border-b border-warm-200 pb-5">
                <p className="text-sm font-semibold text-tomato-600">Menu</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-ink">Available dishes</h2>
              </div>

              {menuQuery.isPending ? <MenuSkeleton /> : null}
              {menuQuery.isError ? (
                <div className="py-6">
                  <ErrorState error={menuQuery.error} onRetry={() => void menuQuery.refetch()} />
                </div>
              ) : null}
              {menuQuery.data?.length === 0 ? (
                <EmptyState
                  icon={<Utensils className="h-6 w-6" />}
                  title="No menu items yet"
                  description="This restaurant has not published any menu items yet."
                />
              ) : null}
              {menuQuery.data?.map((item) => (
                <MenuItemRow key={item.id} restaurant={restaurant} item={item} />
              ))}
              {menuQuery.data ? (
                <Pagination
                  page={page}
                  hasNext={menuQuery.data.length === MENU_PAGE_SIZE}
                  onPageChange={setPage}
                />
              ) : null}
            </section>

            <div className="hidden lg:block">
              <BasketPanel className="sticky top-24" />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
