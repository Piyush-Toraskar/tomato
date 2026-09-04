import { apiRequest } from "./client";
import type { PaginationParams } from "../types/api";
import type {
  LocationUpdate,
  MenuItem,
  MenuItemCreate,
  Restaurant,
  RestaurantCreate,
  RestaurantLocation,
} from "../types/restaurant";

function paginationQuery(params: PaginationParams): string {
  const search = new URLSearchParams({
    limit: String(params.limit ?? 20),
    offset: String(params.offset ?? 0),
  });
  return search.toString();
}

export function listRestaurants(
  params: PaginationParams = {},
): Promise<Restaurant[]> {
  return apiRequest<Restaurant[]>(`/restaurants?${paginationQuery(params)}`);
}

export function getRestaurant(id: number): Promise<Restaurant> {
  return apiRequest<Restaurant>(`/restaurants/${id}`);
}

export function listMenu(
  restaurantId: number,
  params: PaginationParams = {},
): Promise<MenuItem[]> {
  return apiRequest<MenuItem[]>(
    `/restaurants/${restaurantId}/menu?${paginationQuery(params)}`,
  );
}

export function getRestaurantProfile(): Promise<Restaurant> {
  return apiRequest<Restaurant>("/restaurant/profile", { auth: true });
}

export function createRestaurantProfile(
  payload: RestaurantCreate,
): Promise<Restaurant> {
  return apiRequest<Restaurant>("/restaurant/profile", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function linkRestaurantProfile(id: number): Promise<Restaurant> {
  return apiRequest<Restaurant>(`/restaurant/link/${id}`, {
    method: "POST",
    auth: true,
  });
}

export function updateRestaurantLocation(
  payload: LocationUpdate,
): Promise<RestaurantLocation> {
  return apiRequest<RestaurantLocation>("/restaurant/location", {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export function createMenuItem(payload: MenuItemCreate): Promise<MenuItem> {
  return apiRequest<MenuItem>("/restaurant/menu", {
    method: "POST",
    body: payload,
    auth: true,
  });
}
