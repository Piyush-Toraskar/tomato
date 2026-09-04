import type { OrderStatus } from "../types/order";

export const APP_NAME = "Tomato";
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_API_PAGE_SIZE = 100;

export const ORDER_STATUSES: OrderStatus[] = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "PICKED_UP",
  "DELIVERED",
];

export const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "PICKED_UP",
]);

export const TERMINAL_ORDER_STATUSES = new Set<OrderStatus>([
  "DELIVERED",
  "CANCELLED",
]);
