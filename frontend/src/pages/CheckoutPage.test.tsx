import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutPage } from "./CheckoutPage";
import { createOrder } from "../api/orders";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useToast } from "../hooks/useToast";
import { createTestQueryClient } from "../test/test-utils";
import { customer, menuItem, order, restaurant } from "../test/fixtures";

vi.mock("../api/orders", () => ({ createOrder: vi.fn() }));
vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../hooks/useCart", () => ({ useCart: vi.fn() }));
vi.mock("../hooks/useToast", () => ({ useToast: vi.fn() }));

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <QueryClientProvider client={createTestQueryClient()}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:orderId/confirmation" element={<p>Confirmation destination</p>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: customer } as never);
    vi.mocked(useCart).mockReturnValue({
      restaurant,
      lines: [{ menuItem, quantity: 2 }],
      itemCount: 2,
      subtotalMinor: 49800,
      addItem: vi.fn(),
      replaceRestaurantAndAdd: vi.fn(),
      decrementItem: vi.fn(),
      setQuantity: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });
    vi.mocked(useToast).mockReturnValue({ showToast: vi.fn(), dismissToast: vi.fn() });
  });

  it("creates an order and navigates to confirmation", async () => {
    vi.mocked(createOrder).mockResolvedValue({
      ...order,
      status: "PLACED",
      total_amount: "498.00",
      items: [{ id: 1, menu_item_id: menuItem.id, quantity: 2, price: menuItem.price }],
    });

    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
    expect(createOrder).toHaveBeenCalledWith(
      {
        restaurant_id: restaurant.id,
        items: [{ menu_item_id: menuItem.id, quantity: 2 }],
      },
      expect.stringMatching(/^tomato-/),
    );
    expect(await screen.findByText("Confirmation destination")).toBeInTheDocument();
  });

  it("reuses one idempotency key when a failed checkout is retried", async () => {
    vi.mocked(createOrder)
      .mockRejectedValueOnce(new Error("Temporary network failure"))
      .mockResolvedValueOnce({ ...order, status: "PLACED" });

    const user = userEvent.setup();
    renderCheckout();

    await user.click(screen.getByRole("button", { name: "Place order" }));
    expect(await screen.findByText("Temporary network failure")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(2));
    const firstKey = vi.mocked(createOrder).mock.calls[0]?.[1];
    const retryKey = vi.mocked(createOrder).mock.calls[1]?.[1];
    expect(retryKey).toBe(firstKey);
  });
});
