import { useQuery } from "@tanstack/react-query";
import {
  getOrder,
  getOrderDriver,
  getOrderHistory,
  listOrdersForRole,
} from "../api/orders";
import { queryKeys } from "../lib/queryKeys";
import type { UserRole } from "../types/auth";
import type { OrderStatus } from "../types/order";

export function useRoleOrders(role: UserRole, limit = 20, offset = 0) {
  return useQuery({
    queryKey: queryKeys.orders(role, limit, offset),
    queryFn: () => listOrdersForRole(role, { limit, offset }),
    staleTime: 10_000,
  });
}

export function useOrder(id: number, poll = false) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => getOrder(id),
    enabled: Number.isInteger(id) && id > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status as OrderStatus | undefined;
      if (!poll || status === "DELIVERED" || status === "CANCELLED") {
        return false;
      }
      return 8_000;
    },
  });
}

export function useOrderHistory(id: number, poll = false) {
  return useQuery({
    queryKey: queryKeys.orderHistory(id),
    queryFn: () => getOrderHistory(id),
    enabled: Number.isInteger(id) && id > 0,
    refetchInterval: poll ? 8_000 : false,
  });
}

export function useOrderDriver(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orderDriver(id),
    queryFn: () => getOrderDriver(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
    retry: false,
  });
}
