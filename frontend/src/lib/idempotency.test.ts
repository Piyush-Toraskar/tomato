import {
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
} from "./idempotency";
import type { OrderCreate } from "../types/order";

const firstOrder: OrderCreate = {
  restaurant_id: 3,
  items: [
    { menu_item_id: 11, quantity: 1 },
    { menu_item_id: 12, quantity: 2 },
  ],
};

describe("checkout idempotency", () => {
  it("reuses the key when the same failed order is retried", () => {
    const first = getOrCreateIdempotencyKey(firstOrder);
    const retry = getOrCreateIdempotencyKey({
      restaurant_id: 3,
      items: [...firstOrder.items].reverse(),
    });

    expect(retry).toBe(first);
  });

  it("creates a new key when the logical order changes", () => {
    const first = getOrCreateIdempotencyKey(firstOrder);
    const changed = getOrCreateIdempotencyKey({
      ...firstOrder,
      items: [{ menu_item_id: 11, quantity: 3 }],
    });

    expect(changed).not.toBe(first);
  });

  it("clears a completed checkout attempt", () => {
    const first = getOrCreateIdempotencyKey(firstOrder);
    clearIdempotencyKey();
    const next = getOrCreateIdempotencyKey(firstOrder);

    expect(next).not.toBe(first);
  });
});
