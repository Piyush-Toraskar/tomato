import type { UserRole } from "../types/auth";

export const queryKeys = {
  me: ["auth", "me"] as const,
  restaurants: (limit: number, offset: number) =>
    ["restaurants", { limit, offset }] as const,
  restaurant: (id: number) => ["restaurant", id] as const,
  menu: (restaurantId: number, limit: number, offset: number) =>
    ["menu", restaurantId, { limit, offset }] as const,
  orders: (role: UserRole, limit: number, offset: number) =>
    ["orders", role, { limit, offset }] as const,
  order: (id: number) => ["order", id] as const,
  orderHistory: (id: number) => ["order", id, "history"] as const,
  orderDriver: (id: number) => ["order", id, "driver"] as const,
  restaurantProfile: ["restaurant", "profile"] as const,
  driverProfile: ["driver", "profile"] as const,
};
