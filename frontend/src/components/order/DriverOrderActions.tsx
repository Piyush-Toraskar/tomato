import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { updateOrderStatus } from "../../api/orders";
import { nextDriverStatus } from "../../lib/order";
import { queryKeys } from "../../lib/queryKeys";
import { titleCaseStatus } from "../../lib/format";
import type { Order } from "../../types/order";
import { useToast } from "../../hooks/useToast";
import { Button } from "../ui/Button";

export function DriverOrderActions({ order }: { order: Order }) {
  const nextStatus = nextDriverStatus(order.status);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: () => {
      if (!nextStatus) {
        throw new Error("No driver transition is available for this order.");
      }
      return updateOrderStatus(order.id, nextStatus);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders", "DRIVER"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.order(order.id) });
      if (nextStatus) {
        showToast({ title: `Order marked ${titleCaseStatus(nextStatus)}`, tone: "success" });
      }
    },
    onError: (error) => showToast({ title: "Order update failed", description: error instanceof Error ? error.message : "Please try again.", tone: "error" }),
  });

  if (!nextStatus) {
    return null;
  }

  return (
    <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()} leftIcon={<ArrowRight className="h-4 w-4" />}>
      {nextStatus === "PICKED_UP" ? "Mark picked up" : "Mark delivered"}
    </Button>
  );
}
