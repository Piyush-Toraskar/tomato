import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createMenuItem,
  updateRestaurantLocation,
} from "../../api/restaurants";
import { queryKeys } from "../../lib/queryKeys";
import { useToast } from "../../hooks/useToast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { ErrorState } from "../ui/ErrorState";

export function RestaurantSettings({ restaurantId }: { restaurantId: number }) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const locationMutation = useMutation({
    mutationFn: () =>
      updateRestaurantLocation({
        latitude: Number(latitude),
        longitude: Number(longitude),
      }),
    onSuccess: () => {
      showToast({ title: "Restaurant location saved", tone: "success" });
    },
  });

  const menuMutation = useMutation({
    mutationFn: () =>
      createMenuItem({
        name: itemName,
        price,
        is_available: available,
      }),
    onSuccess: () => {
      setItemName("");
      setPrice("");
      void queryClient.invalidateQueries({ queryKey: ["menu", restaurantId] });
      showToast({ title: "Menu item added", tone: "success" });
    },
  });

  const submitLocation = (event: FormEvent) => {
    event.preventDefault();
    locationMutation.mutate();
  };

  const submitMenu = (event: FormEvent) => {
    event.preventDefault();
    menuMutation.mutate();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Restaurant location</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Add the restaurant's latitude and longitude so available drivers can be matched by distance. Saved coordinates are not displayed after refresh.
        </p>
        <form onSubmit={submitLocation} className="mt-5 space-y-4">
          <Input label="Latitude" name="restaurant-latitude" type="number" step="any" min={-90} max={90} required value={latitude} onChange={(event) => setLatitude(event.target.value)} />
          <Input label="Longitude" name="restaurant-longitude" type="number" step="any" min={-180} max={180} required value={longitude} onChange={(event) => setLongitude(event.target.value)} />
          {locationMutation.isError ? <ErrorState error={locationMutation.error} /> : null}
          <Button type="submit" loading={locationMutation.isPending}>Save location</Button>
        </form>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Add a menu item</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Add dishes to the published menu. Editing and removal are not available in this version.
        </p>
        <form onSubmit={submitMenu} className="mt-5 space-y-4">
          <Input label="Dish name" name="menu-name" required value={itemName} onChange={(event) => setItemName(event.target.value)} />
          <Input label="Price (INR)" name="menu-price" type="number" step="0.01" min="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} />
          <label className="flex items-center gap-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={available}
              onChange={(event) => setAvailable(event.target.checked)}
              className="h-4 w-4 rounded border-warm-300 text-tomato-500 focus:ring-tomato-500"
            />
            Available for ordering
          </label>
          {menuMutation.isError ? <ErrorState error={menuMutation.error} /> : null}
          <Button type="submit" loading={menuMutation.isPending}>Add menu item</Button>
        </form>
      </Card>
    </div>
  );
}
