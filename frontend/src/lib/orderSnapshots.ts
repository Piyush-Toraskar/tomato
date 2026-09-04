import type { OrderSnapshot } from "../types/order";

const STORAGE_KEY = "tomato.order-snapshots";
const MAX_SNAPSHOTS = 40;

function readAll(): Record<string, OrderSnapshot> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, OrderSnapshot>;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

export function saveOrderSnapshot(snapshot: OrderSnapshot): void {
  const existing = readAll();
  existing[String(snapshot.orderId)] = snapshot;

  const trimmed = Object.fromEntries(
    Object.entries(existing)
      .sort(
        ([, left], [, right]) =>
          new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime(),
      )
      .slice(0, MAX_SNAPSHOTS),
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function getOrderSnapshot(orderId: number): OrderSnapshot | null {
  return readAll()[String(orderId)] ?? null;
}
