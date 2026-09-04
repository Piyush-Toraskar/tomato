import { ShoppingBag } from "lucide-react";
import { BasketPanel } from "../components/cart/BasketPanel";
import { EmptyState } from "../components/ui/EmptyState";
import { LinkButton } from "../components/ui/LinkButton";
import { useCart } from "../hooks/useCart";

export function BasketPage() {
  const { lines } = useCart();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-[-0.035em] text-ink">Your basket</h1>
      <p className="mt-2 text-sm text-neutral-600">Review quantities before checkout.</p>

      {lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Your basket is empty"
          description="Add something delicious to get started."
          action={<LinkButton to="/">Find something to eat</LinkButton>}
        />
      ) : (
        <BasketPanel className="mt-7" />
      )}
    </div>
  );
}
