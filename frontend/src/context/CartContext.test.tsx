import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "./CartContext";
import {
  menuItem,
  restaurant,
  secondMenuItem,
  secondRestaurant,
} from "../test/fixtures";

function CartHarness() {
  const cart = useCart();
  const [crossRestaurantResult, setCrossRestaurantResult] = useState("unset");

  return (
    <div>
      <p data-testid="count">{cart.itemCount}</p>
      <p data-testid="subtotal">{cart.subtotalMinor}</p>
      <p data-testid="restaurant">{cart.restaurant?.name ?? "none"}</p>
      <p data-testid="cross-result">{crossRestaurantResult}</p>
      <button type="button" onClick={() => cart.addItem(restaurant, menuItem)}>
        Add bowl
      </button>
      <button type="button" onClick={() => cart.addItem(restaurant, secondMenuItem)}>
        Add drink
      </button>
      <button type="button" onClick={() => cart.setQuantity(menuItem.id, 3)}>
        Set bowl to three
      </button>
      <button type="button" onClick={() => cart.removeItem(menuItem.id)}>
        Remove bowl
      </button>
      <button
        type="button"
        onClick={() =>
          setCrossRestaurantResult(
            String(cart.addItem(secondRestaurant, { ...menuItem, restaurant_id: secondRestaurant.id })),
          )
        }
      >
        Add from another restaurant
      </button>
    </div>
  );
}

describe("CartContext", () => {
  it("adds items, changes quantities and calculates an exact subtotal", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Add bowl" }));
    await user.click(screen.getByRole("button", { name: "Add drink" }));
    await user.click(screen.getByRole("button", { name: "Set bowl to three" }));

    expect(screen.getByTestId("count")).toHaveTextContent("4");
    expect(screen.getByTestId("subtotal")).toHaveTextContent(String(24900 * 3 + 8900));
    expect(screen.getByTestId("restaurant")).toHaveTextContent(restaurant.name);
  });

  it("removes items and prevents an accidental mixed-restaurant basket", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Add bowl" }));
    await user.click(screen.getByRole("button", { name: "Add from another restaurant" }));
    expect(screen.getByTestId("cross-result")).toHaveTextContent("false");

    await user.click(screen.getByRole("button", { name: "Remove bowl" }));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("restaurant")).toHaveTextContent("none");
  });
});
