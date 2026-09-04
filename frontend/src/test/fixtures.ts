import type { AuthUser } from "../types/auth";
import type { Order, OrderStatusHistory } from "../types/order";
import type { MenuItem, Restaurant } from "../types/restaurant";

export const customer: AuthUser = {
  id: 7,
  name: "Asha Sharma",
  email: "asha@example.com",
  role: "CUSTOMER",
  email_verified: true,
};

export const restaurant: Restaurant = {
  id: 3,
  name: "Copper Tiffin",
  cuisine: "Indian",
  address: "Powai, Mumbai",
};

export const secondRestaurant: Restaurant = {
  id: 4,
  name: "Lime & Grain",
  cuisine: "Healthy",
  address: "Bandra, Mumbai",
};

export const menuItem: MenuItem = {
  id: 11,
  name: "Paneer rice bowl",
  price: "249.00",
  is_available: true,
  restaurant_id: restaurant.id,
};

export const secondMenuItem: MenuItem = {
  id: 12,
  name: "Masala lemonade",
  price: "89.00",
  is_available: true,
  restaurant_id: restaurant.id,
};

export const order: Order = {
  id: 42,
  user_id: customer.id,
  restaurant_id: restaurant.id,
  total_amount: "338.00",
  status: "PREPARING",
  created_at: "2026-09-03T12:00:00Z",
  updated_at: "2026-09-03T12:10:00Z",
  items: [
    {
      id: 1,
      menu_item_id: menuItem.id,
      quantity: 1,
      price: menuItem.price,
    },
    {
      id: 2,
      menu_item_id: secondMenuItem.id,
      quantity: 1,
      price: secondMenuItem.price,
    },
  ],
};

export const history: OrderStatusHistory[] = [
  {
    id: 1,
    order_id: order.id,
    from_status: null,
    to_status: "PLACED",
    changed_by_user_id: customer.id,
    created_at: "2026-09-03T12:00:00Z",
  },
  {
    id: 2,
    order_id: order.id,
    from_status: "PLACED",
    to_status: "CONFIRMED",
    changed_by_user_id: 8,
    created_at: "2026-09-03T12:05:00Z",
  },
  {
    id: 3,
    order_id: order.id,
    from_status: "CONFIRMED",
    to_status: "PREPARING",
    changed_by_user_id: 8,
    created_at: "2026-09-03T12:10:00Z",
  },
];
