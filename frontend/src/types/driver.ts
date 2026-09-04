export interface Driver {
  id: number;
  name: string;
  is_available: boolean;
}

export interface DriverCreate {
  name: string;
}

export interface DriverLocation {
  id: number;
  driver_id: number;
  latitude: number;
  longitude: number;
}

export interface DriverAssignment {
  id: number;
  order_id: number;
  driver_id: number;
  distance_km: number | null;
}
