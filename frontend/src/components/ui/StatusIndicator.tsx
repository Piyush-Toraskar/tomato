import { Badge } from "./Badge";
import { titleCaseStatus } from "../../lib/format";
import type { OrderStatus } from "../../types/order";

export function StatusIndicator({ status }: { status: OrderStatus }) {
  const tone =
    status === "DELIVERED"
      ? "success"
      : status === "CANCELLED"
        ? "danger"
        : status === "PLACED"
          ? "neutral"
          : "warning";

  return <Badge tone={tone}>{titleCaseStatus(status)}</Badge>;
}
