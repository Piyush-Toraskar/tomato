import { MemoryRouter, Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RestaurantPage } from "./RestaurantPage";
import { useMenu, useRestaurant } from "../hooks/useRestaurantQueries";
import { renderWithProviders } from "../test/test-utils";
import { menuItem, restaurant } from "../test/fixtures";

vi.mock("../hooks/useRestaurantQueries", () => ({
  useRestaurant: vi.fn(),
  useMenu: vi.fn(),
}));

describe("RestaurantPage", () => {
  it("loads the menu and adds an available item to the basket", async () => {
    vi.mocked(useRestaurant).mockReturnValue({
      data: restaurant,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useMenu).mockReturnValue({
      data: [menuItem],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/restaurants/:restaurantId" element={<RestaurantPage />} />
      </Routes>,
      { initialEntries: [`/restaurants/${restaurant.id}`] },
    );

    expect(screen.getByRole("heading", { name: restaurant.name })).toBeInTheDocument();
    expect(screen.getByText(menuItem.name)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByLabelText("Quantity")).toHaveTextContent("1");
    expect(screen.getByText(`${menuItem.name} added`)).toBeInTheDocument();
  });

  it("renders an empty menu state", () => {
    vi.mocked(useRestaurant).mockReturnValue({
      data: restaurant,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useMenu).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(
      <Routes>
        <Route path="/restaurants/:restaurantId" element={<RestaurantPage />} />
      </Routes>,
      { initialEntries: [`/restaurants/${restaurant.id}`] },
    );

    expect(screen.getByText("No menu items yet")).toBeInTheDocument();
  });
});
