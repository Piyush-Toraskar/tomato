import type { Restaurant } from "../../types/restaurant";
import { RestaurantCard } from "./RestaurantCard";

export function RestaurantGrid({ restaurants }: { restaurants: Restaurant[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
