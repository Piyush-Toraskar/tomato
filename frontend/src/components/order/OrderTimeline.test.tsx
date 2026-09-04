import { render, screen } from "@testing-library/react";
import { OrderTimeline } from "./OrderTimeline";

describe("OrderTimeline", () => {
  it("uses the backend order statuses and marks the current stage", () => {
    render(<OrderTimeline status="PREPARING" />);

    expect(screen.getByText("Order placed")).toBeInTheDocument();
    expect(screen.getByText("Restaurant confirmed")).toBeInTheDocument();
    expect(screen.getByText("Preparing your order")).toBeInTheDocument();
    expect(screen.getByText("Current status")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("shows a terminal cancellation state", () => {
    render(<OrderTimeline status="CANCELLED" />);

    expect(screen.getByText("Order cancelled")).toBeInTheDocument();
    expect(screen.getByText("This order will not progress further.")).toBeInTheDocument();
  });
});
