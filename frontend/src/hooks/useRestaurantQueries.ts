import { useQuery } from "@tanstack/react-query";
import {
  getRestaurant,
  listMenu,
  listRestaurants,
} from "../api/restaurants";
import { queryKeys } from "../lib/queryKeys";

export function useRestaurants(limit = 20, offset = 0) {
  return useQuery({
    queryKey: queryKeys.restaurants(limit, offset),
    queryFn: () => listRestaurants({ limit, offset }),
    staleTime: 60_000,
  });
}

export function useRestaurant(id: number) {
  return useQuery({
    queryKey: queryKeys.restaurant(id),
    queryFn: () => getRestaurant(id),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 60_000,
  });
}

export function useMenu(restaurantId: number, limit = 20, offset = 0) {
  return useQuery({
    queryKey: queryKeys.menu(restaurantId, limit, offset),
    queryFn: () => listMenu(restaurantId, { limit, offset }),
    enabled: Number.isInteger(restaurantId) && restaurantId > 0,
    staleTime: 30_000,
  });
}
