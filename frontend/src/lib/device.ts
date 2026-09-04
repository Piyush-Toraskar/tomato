const DEVICE_ID_KEY = "tomato.device-id";

function createDeviceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `web-${crypto.randomUUID()}`;
  }

  return `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getStableDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const created = createDeviceId();
  localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}
