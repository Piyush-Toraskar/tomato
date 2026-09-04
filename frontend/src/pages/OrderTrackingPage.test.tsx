import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { OrderTrackingPage } from "./OrderTrackingPage";
import {
  useOrder,
  useOrderDriver,
  useOrderHistory,
} from "../hooks/useOrderQueries";
import { useRestaurant } from "../hooks/useRestaurantQueries";
import { history, order, restaurant } from "../test/fixtures";

vi.mock("../hooks/useOrderQueries", () => ({
  useOrder: vi.fn(),
  useOrderHistory: vi.fn(),
  useOrderDriver: vi.fn(),
}));
vi.mock("../hooks/useRestaurantQueries", () => ({
  useRestaurant: vi.fn(),
}));

describe("OrderTrackingPage", () => {
  it("renders the actual status history and assigned driver", () => {
    const readyOrder = { ...order, status: "READY" as const };

    vi.mocked(useOrder).mockReturnValue({
      data: readyOrder,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useOrderHistory).mockReturnValue({
      data: [
        ...history,
        {
          id: 4,
          order_id: order.id,
          from_status: "PREPARING",
          to_status: "READY",
          changed_by_user_id: 8,
          created_at: "2026-09-03T12:15:00Z",
        },
      ],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useOrderDriver).mockReturnValue({
      data: { id: 5, name: "Arjun", is_available: false },
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useRestaurant).mockReturnValue({
      data: restaurant,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    render(
      <MemoryRouter initialEntries={[`/orders/${order.id}/track`]}>
        <Routes>
          <Route path="/orders/:orderId/track" element={<OrderTrackingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Track your order" })).toBeInTheDocument();
    expect(screen.getAllByText("PLACED").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("CONFIRMED").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("PREPARING").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("READY").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Arjun")).toBeInTheDocument();
    expect(screen.getByText("Live driver location is not available for this order. Use the status timeline to follow its progress.")).toBeInTheDocument();
  });
});
