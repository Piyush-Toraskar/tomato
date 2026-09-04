export type MoneyValue = string | number;

export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  address: string;
}

export interface RestaurantCreate {
  name: string;
  cuisine: string;
  address: string;
}

export interface RestaurantLocation {
  id: number;
  restaurant_id: number;
  latitude: number;
  longitude: number;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
}

export interface MenuItem {
  id: number;
  name: string;
  price: MoneyValue;
  is_available: boolean;
  restaurant_id: number;
}

export interface MenuItemCreate {
  name: string;
  price: string;
  is_available: boolean;
}
