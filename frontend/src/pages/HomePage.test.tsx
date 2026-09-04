import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { HomePage } from "./HomePage";
import { useRestaurants } from "../hooks/useRestaurantQueries";
import { ApiError } from "../api/client";
import { restaurant } from "../test/fixtures";

vi.mock("../hooks/useRestaurantQueries", () => ({ useRestaurants: vi.fn() }));

describe("HomePage", () => {
  it("renders restaurants returned by the backend", () => {
    vi.mocked(useRestaurants).mockReturnValue({
      data: [restaurant],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText(restaurant.name)).toBeInTheDocument();
    expect(screen.getAllByText(restaurant.cuisine).length).toBeGreaterThanOrEqual(1);
  });

  it("shows a polished empty state", () => {
    vi.mocked(useRestaurants).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("No restaurants yet")).toBeInTheDocument();
  });

  it("shows a safe API error with a retry action", () => {
    vi.mocked(useRestaurants).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new ApiError({ status: 500, detail: "Something went wrong on our end." }),
      refetch: vi.fn(),
    } as never);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Restaurants could not be loaded")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
