import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Search, Store } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRestaurants } from "../hooks/useRestaurantQueries";
import { DEFAULT_PAGE_SIZE } from "../lib/constants";
import { RestaurantGrid } from "../components/restaurant/RestaurantGrid";
import { RestaurantGridSkeleton } from "../components/restaurant/RestaurantSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";

export function HomePage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;
  const restaurantsQuery = useRestaurants(DEFAULT_PAGE_SIZE, offset);

  const cuisines = useMemo(
    () =>
      Array.from(
        new Set(
          (restaurantsQuery.data ?? [])
            .map((restaurant) => restaurant.cuisine.trim())
            .filter(Boolean),
        ),
      ).slice(0, 8),
    [restaurantsQuery.data],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  return (
    <div>
      <section className="border-b border-warm-200 bg-white">
        <div className="mx-auto max-w-page px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-tomato-600">Food, without the fuss</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
              What are you craving?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
              Browse restaurants, explore their menus and build your basket in a few quick steps.
            </p>
          </div>

          <form onSubmit={submit} className="relative mt-8 max-w-2xl" role="search">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
            <label htmlFor="home-search" className="sr-only">
              Search restaurants or cuisines
            </label>
            <input
              id="home-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search restaurants or cuisines"
              className="h-14 w-full rounded-2xl border border-warm-200 bg-canvas pl-12 pr-32 text-base text-ink outline-none transition placeholder:text-neutral-400 focus:border-tomato-500 focus:bg-white focus:ring-4 focus:ring-tomato-100"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 inline-flex h-10 items-center gap-2 rounded-xl bg-tomato-500 px-4 text-sm font-semibold text-white transition hover:bg-tomato-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato-500 focus-visible:ring-offset-2"
            >
              Search <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {cuisines.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2" aria-label="Cuisines available on this page">
              {cuisines.map((cuisine) => (
                <Link
                  key={cuisine}
                  to={`/search?cuisine=${encodeURIComponent(cuisine)}`}
                  className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-warm-300 hover:bg-warm-50"
                >
                  {cuisine}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-ink">Available restaurants</h2>
            <p className="mt-1.5 text-sm text-neutral-600">
              Choose a restaurant and see what is available today.
            </p>
          </div>
          <Link
            to="/search"
            className="hidden items-center gap-2 text-sm font-semibold text-tomato-600 hover:text-tomato-700 sm:inline-flex"
          >
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {restaurantsQuery.isPending ? <RestaurantGridSkeleton /> : null}

        {restaurantsQuery.isError ? (
          <ErrorState
            error={restaurantsQuery.error}
            onRetry={() => void restaurantsQuery.refetch()}
            title="Restaurants could not be loaded"
          />
        ) : null}

        {restaurantsQuery.data?.length === 0 ? (
          <EmptyState
            icon={<Store className="h-6 w-6" />}
            title="No restaurants yet"
            description="A restaurant account needs to create a profile before it appears here."
          />
        ) : null}

        {restaurantsQuery.data && restaurantsQuery.data.length > 0 ? (
          <>
            <RestaurantGrid restaurants={restaurantsQuery.data} />
            <Pagination
              page={page}
              hasNext={restaurantsQuery.data.length === DEFAULT_PAGE_SIZE}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        ) : null}
      </section>
    </div>
  );
}
