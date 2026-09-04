import { apiRequest } from "./client";
import type { Driver, DriverCreate, DriverLocation } from "../types/driver";
import type { LocationUpdate } from "../types/restaurant";

export function getDriverProfile(): Promise<Driver> {
  return apiRequest<Driver>("/driver/profile", { auth: true });
}

export function createDriverProfile(payload: DriverCreate): Promise<Driver> {
  return apiRequest<Driver>("/driver/profile", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function linkDriverProfile(id: number): Promise<Driver> {
  return apiRequest<Driver>(`/driver/link/${id}`, {
    method: "POST",
    auth: true,
  });
}

export function updateDriverLocation(
  payload: LocationUpdate,
): Promise<DriverLocation> {
  return apiRequest<DriverLocation>("/driver/location", {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export function updateDriverAvailability(
  isAvailable: boolean,
): Promise<Driver> {
  return apiRequest<Driver>("/driver/availability", {
    method: "PATCH",
    body: { is_available: isAvailable },
    auth: true,
  });
}
