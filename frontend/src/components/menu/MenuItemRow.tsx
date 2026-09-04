import { useState } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import type { MenuItem, Restaurant } from "../../types/restaurant";
import { formatMoney } from "../../lib/format";
import { useCart } from "../../hooks/useCart";
import { useToast } from "../../hooks/useToast";
import { Button } from "../ui/Button";
import { QuantityControl } from "../ui/QuantityControl";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";

export function MenuItemRow({
  restaurant,
  item,
}: {
  restaurant: Restaurant;
  item: MenuItem;
}) {
  const [confirmSwitch, setConfirmSwitch] = useState(false);
  const {
    lines,
    addItem,
    replaceRestaurantAndAdd,
    decrementItem,
    setQuantity,
  } = useCart();
  const { showToast } = useToast();
  const line = lines.find((candidate) => candidate.menuItem.id === item.id);

  const add = () => {
    const added = addItem(restaurant, item);
    if (!added) {
      setConfirmSwitch(true);
      return;
    }

    showToast({
      title: `${item.name} added`,
      tone: "success",
      duration: 2200,
    });
  };

  const switchBasket = () => {
    replaceRestaurantAndAdd(restaurant, item);
    setConfirmSwitch(false);
    showToast({
      title: "Basket updated",
      description: `Your basket now contains items from ${restaurant.name}.`,
      tone: "success",
    });
  };

  return (
    <>
      <article className="grid grid-cols-[1fr_auto] gap-4 border-b border-warm-200 py-6 last:border-b-0 sm:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink sm:text-lg">{item.name}</h3>
            {!item.is_available ? <Badge tone="neutral">Unavailable</Badge> : null}
          </div>
          <p className="mt-2 font-medium text-ink">{formatMoney(item.price)}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
            {item.is_available ? "Available to order" : "Currently unavailable"}
          </p>
        </div>

        <div className="flex flex-col items-end justify-between gap-4">
          <div className="grid h-20 w-24 place-items-center rounded-xl bg-warm-100 text-warm-700 sm:h-24 sm:w-32">
            <UtensilsCrossed className="h-7 w-7" aria-hidden="true" />
          </div>
          {line ? (
            <QuantityControl
              quantity={line.quantity}
              onDecrease={() => decrementItem(item.id)}
              onIncrease={() => setQuantity(item.id, line.quantity + 1)}
              disabled={!item.is_available}
            />
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={!item.is_available}
              onClick={add}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add
            </Button>
          )}
        </div>
      </article>

      <Modal
        open={confirmSwitch}
        onClose={() => setConfirmSwitch(false)}
        title="Start a new basket?"
        description="Your basket can contain items from one restaurant at a time."
        footer={
          <>
            <Button variant="quiet" onClick={() => setConfirmSwitch(false)}>
              Keep current basket
            </Button>
            <Button onClick={switchBasket}>Start new basket</Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-neutral-600">
          Items already in your basket will be removed and {item.name} from {restaurant.name} will be added.
        </p>
      </Modal>
    </>
  );
}
