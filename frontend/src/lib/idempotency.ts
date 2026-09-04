import type { OrderCreate } from "../types/order";

const CHECKOUT_ATTEMPT_KEY = "tomato.checkout-attempt";

interface StoredCheckoutAttempt {
  fingerprint: string;
  key: string;
}

function createKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `tomato-${crypto.randomUUID()}`;
  }

  return `tomato-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createOrderFingerprint(order: OrderCreate): string {
  const items = [...order.items]
    .sort((left, right) => left.menu_item_id - right.menu_item_id)
    .map((item) => `${item.menu_item_id}:${item.quantity}`)
    .join("|");

  return `${order.restaurant_id}::${items}`;
}

export function getOrCreateIdempotencyKey(order: OrderCreate): string {
  const fingerprint = createOrderFingerprint(order);
  const stored = sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as StoredCheckoutAttempt;
      if (parsed.fingerprint === fingerprint && parsed.key) {
        return parsed.key;
      }
    } catch {
      sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
    }
  }

  const attempt: StoredCheckoutAttempt = {
    fingerprint,
    key: createKey(),
  };

  sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify(attempt));
  return attempt.key;
}

export function clearIdempotencyKey(): void {
  sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
}
