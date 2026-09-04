import { apiRequest } from "./client";
import type { PaginationParams } from "../types/api";
import type { UserRole } from "../types/auth";
import type { Driver, DriverAssignment } from "../types/driver";
import type {
  Order,
  OrderCreate,
  OrderStatus,
  OrderStatusHistory,
} from "../types/order";

function paginationQuery(params: PaginationParams): string {
  const search = new URLSearchParams({
    limit: String(params.limit ?? 20),
    offset: String(params.offset ?? 0),
  });
  return search.toString();
}

export function createOrder(
  payload: OrderCreate,
  idempotencyKey: string,
): Promise<Order> {
  return apiRequest<Order>("/orders", {
    method: "POST",
    body: payload,
    auth: true,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });
}

export function listOrdersForRole(
  role: UserRole,
  params: PaginationParams = {},
): Promise<Order[]> {
  const path =
    role === "RESTAURANT"
      ? "/restaurant/orders"
      : role === "DRIVER"
        ? "/driver/orders"
        : "/orders";

  return apiRequest<Order[]>(`${path}?${paginationQuery(params)}`, {
    auth: true,
  });
}

export function getOrder(id: number): Promise<Order> {
  return apiRequest<Order>(`/orders/${id}`, { auth: true });
}

export function getOrderHistory(id: number): Promise<OrderStatusHistory[]> {
  return apiRequest<OrderStatusHistory[]>(`/orders/${id}/history`, {
    auth: true,
  });
}

export function updateOrderStatus(
  id: number,
  status: OrderStatus,
): Promise<Order> {
  return apiRequest<Order>(`/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
    auth: true,
  });
}

export function assignDriver(id: number): Promise<DriverAssignment> {
  return apiRequest<DriverAssignment>(`/orders/${id}/assign-driver`, {
    method: "POST",
    auth: true,
  });
}

export function getOrderDriver(id: number): Promise<Driver> {
  return apiRequest<Driver>(`/orders/${id}/driver`, { auth: true });
}
