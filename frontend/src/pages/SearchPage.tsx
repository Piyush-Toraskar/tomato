import { useEffect, useMemo, useState } from "react";
import { Search, Store } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useRestaurants } from "../hooks/useRestaurantQueries";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { MAX_API_PAGE_SIZE } from "../lib/constants";
import { RestaurantGrid } from "../components/restaurant/RestaurantGrid";
import { RestaurantGridSkeleton } from "../components/restaurant/RestaurantSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debouncedQuery = useDebouncedValue(query);
  const selectedCuisine = searchParams.get("cuisine") ?? "";
  const restaurantsQuery = useRestaurants(MAX_API_PAGE_SIZE, 0);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedQuery.trim()) {
      next.set("q", debouncedQuery.trim());
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  }, [debouncedQuery, searchParams, setSearchParams]);

  const cuisines = useMemo(
    () =>
      Array.from(
        new Set((restaurantsQuery.data ?? []).map((restaurant) => restaurant.cuisine).filter(Boolean)),
      ).sort(),
    [restaurantsQuery.data],
  );

  const filtered = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    return (restaurantsQuery.data ?? []).filter((restaurant) => {
      const matchesText =
        !term ||
        restaurant.name.toLowerCase().includes(term) ||
        restaurant.cuisine.toLowerCase().includes(term) ||
        restaurant.address.toLowerCase().includes(term);
      const matchesCuisine = !selectedCuisine || restaurant.cuisine === selectedCuisine;
      return matchesText && matchesCuisine;
    });
  }, [debouncedQuery, restaurantsQuery.data, selectedCuisine]);

  const chooseCuisine = (cuisine: string) => {
    const next = new URLSearchParams(searchParams);
    if (cuisine) {
      next.set("cuisine", cuisine);
    } else {
      next.delete("cuisine");
    }
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Find a restaurant</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Search the currently available restaurants by name, cuisine or address.
        </p>
      </div>

      <div className="relative mt-7 max-w-2xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
        <label htmlFor="search-page-input" className="sr-only">
          Search restaurants
        </label>
        <input
          id="search-page-input"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Restaurant, cuisine, or address"
          className="h-14 w-full rounded-2xl border border-warm-200 bg-white py-3.5 pl-12 pr-4 text-base outline-none transition focus:border-tomato-500 focus:ring-4 focus:ring-tomato-100"
        />
      </div>

      {cuisines.length > 0 ? (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Filter by cuisine">
          <button
            type="button"
            onClick={() => chooseCuisine("")}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              !selectedCuisine
                ? "border-tomato-500 bg-tomato-50 text-tomato-700"
                : "border-warm-200 bg-white text-neutral-700 hover:bg-warm-50"
            }`}
          >
            All cuisines
          </button>
          {cuisines.map((cuisine) => (
            <button
              type="button"
              key={cuisine}
              onClick={() => chooseCuisine(cuisine)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                selectedCuisine === cuisine
                  ? "border-tomato-500 bg-tomato-50 text-tomato-700"
                  : "border-warm-200 bg-white text-neutral-700 hover:bg-warm-50"
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {restaurantsQuery.isPending ? <RestaurantGridSkeleton /> : null}
        {restaurantsQuery.isError ? (
          <ErrorState error={restaurantsQuery.error} onRetry={() => void restaurantsQuery.refetch()} />
        ) : null}
        {!restaurantsQuery.isPending && !restaurantsQuery.isError && filtered.length === 0 ? (
          <EmptyState
            icon={<Store className="h-6 w-6" />}
            title="No restaurants found"
            description="Try another search or remove the cuisine filter."
          />
        ) : null}
        {filtered.length > 0 ? <RestaurantGrid restaurants={filtered} /> : null}
      </div>
    </div>
  );
}
