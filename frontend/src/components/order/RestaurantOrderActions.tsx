import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bike, Ban, ArrowRight } from "lucide-react";
import { assignDriver, updateOrderStatus } from "../../api/orders";
import { queryKeys } from "../../lib/queryKeys";
import { nextRestaurantStatus } from "../../lib/order";
import { titleCaseStatus } from "../../lib/format";
import type { Order } from "../../types/order";
import type { UserRole } from "../../types/auth";
import { useToast } from "../../hooks/useToast";
import { Button } from "../ui/Button";

export function RestaurantOrderActions({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const nextStatus = nextRestaurantStatus(order.status);

  const refreshOrders = () => {
    void queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey[0] === "orders" &&
        (query.queryKey[1] as UserRole | undefined) === "RESTAURANT",
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.order(order.id) });
  };

  const statusMutation = useMutation({
    mutationFn: (status: Order["status"]) => updateOrderStatus(order.id, status),
    onSuccess: (_, status) => {
      refreshOrders();
      showToast({ title: `Order marked ${titleCaseStatus(status)}`, tone: "success" });
    },
    onError: (error) => showToast({ title: "Order update failed", description: error instanceof Error ? error.message : "Please try again.", tone: "error" }),
  });

  const assignmentMutation = useMutation({
    mutationFn: () => assignDriver(order.id),
    onSuccess: (assignment) => {
      refreshOrders();
      showToast({ title: `Driver #${assignment.driver_id} assigned`, tone: "success" });
    },
    onError: (error) => showToast({ title: "Driver could not be assigned", description: error instanceof Error ? error.message : "Please try again.", tone: "error" }),
  });

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatus ? (
        <Button
          size="sm"
          loading={statusMutation.isPending}
          onClick={() => statusMutation.mutate(nextStatus)}
          leftIcon={<ArrowRight className="h-4 w-4" />}
        >
          {nextStatus === "CONFIRMED" ? "Confirm" : nextStatus === "PREPARING" ? "Start preparing" : "Mark ready"}
        </Button>
      ) : null}

      {order.status === "READY" ? (
        <Button
          size="sm"
          variant="secondary"
          loading={assignmentMutation.isPending}
          onClick={() => assignmentMutation.mutate()}
          leftIcon={<Bike className="h-4 w-4" />}
        >
          Assign driver
        </Button>
      ) : null}

      {["PLACED", "CONFIRMED", "PREPARING", "READY"].includes(order.status) ? (
        <Button
          size="sm"
          variant="danger"
          loading={statusMutation.isPending}
          onClick={() => statusMutation.mutate("CANCELLED")}
          leftIcon={<Ban className="h-4 w-4" />}
        >
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
