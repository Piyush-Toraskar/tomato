import type { MoneyValue, Restaurant } from "./restaurant";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItemCreate {
  menu_item_id: number;
  quantity: number;
}

export interface OrderCreate {
  restaurant_id: number;
  items: OrderItemCreate[];
}

export interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price: MoneyValue;
}

export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  total_amount: MoneyValue;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by_user_id: number | null;
  created_at: string;
}

export interface OrderSnapshotItem {
  menuItemId: number;
  name: string;
  price: MoneyValue;
  quantity: number;
}

export interface OrderSnapshot {
  orderId: number;
  restaurant: Restaurant;
  items: OrderSnapshotItem[];
  savedAt: string;
}
