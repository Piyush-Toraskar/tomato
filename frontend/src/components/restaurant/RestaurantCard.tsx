import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Restaurant } from "../../types/restaurant";
import { RestaurantVisual } from "./RestaurantVisual";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-warm-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-warm-300 hover:shadow-soft">
      <Link
        to={`/restaurants/${restaurant.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tomato-500"
      >
        <RestaurantVisual
          name={restaurant.name}
          cuisine={restaurant.cuisine}
          className="aspect-[16/10] w-full"
        />
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-[-0.02em] text-ink">
                {restaurant.name}
              </h3>
              <p className="mt-1 text-sm text-neutral-600">{restaurant.cuisine}</p>
            </div>
            <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-neutral-400 transition group-hover:text-tomato-500" />
          </div>
          <p className="mt-4 flex items-start gap-2 text-sm leading-5 text-neutral-500">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="line-clamp-2">{restaurant.address}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
