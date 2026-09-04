import { ACTIVE_ORDER_STATUSES, ORDER_STATUSES } from "./constants";
import type { Order, OrderStatus } from "../types/order";

export function isActiveOrder(order: Order): boolean {
  return ACTIVE_ORDER_STATUSES.has(order.status);
}

export function statusPosition(status: OrderStatus): number {
  if (status === "CANCELLED") {
    return -1;
  }

  return ORDER_STATUSES.indexOf(status);
}

export function nextRestaurantStatus(
  status: OrderStatus,
): OrderStatus | null {
  const transitions: Partial<Record<OrderStatus, OrderStatus>> = {
    PLACED: "CONFIRMED",
    CONFIRMED: "PREPARING",
    PREPARING: "READY",
  };

  return transitions[status] ?? null;
}

export function nextDriverStatus(status: OrderStatus): OrderStatus | null {
  const transitions: Partial<Record<OrderStatus, OrderStatus>> = {
    READY: "PICKED_UP",
    PICKED_UP: "DELIVERED",
  };

  return transitions[status] ?? null;
}
