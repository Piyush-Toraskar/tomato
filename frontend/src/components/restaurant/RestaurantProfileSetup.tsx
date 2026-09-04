import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRestaurantProfile,
  linkRestaurantProfile,
} from "../../api/restaurants";
import { queryKeys } from "../../lib/queryKeys";
import { useToast } from "../../hooks/useToast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Tabs } from "../ui/Tabs";
import { ErrorState } from "../ui/ErrorState";

type SetupMode = "create" | "link";

export function RestaurantProfileSetup() {
  const [mode, setMode] = useState<SetupMode>("create");
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [address, setAddress] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: () => createRestaurantProfile({ name, cuisine, address }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.restaurantProfile });
      showToast({ title: "Restaurant profile created", tone: "success" });
    },
  });

  const linkMutation = useMutation({
    mutationFn: () => linkRestaurantProfile(Number(restaurantId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.restaurantProfile });
      showToast({ title: "Restaurant linked", tone: "success" });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "create") {
      createMutation.mutate();
    } else {
      linkMutation.mutate();
    }
  };

  const error = mode === "create" ? createMutation.error : linkMutation.error;
  const loading = mode === "create" ? createMutation.isPending : linkMutation.isPending;

  return (
    <section className="rounded-2xl border border-warm-200 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-semibold text-ink">Set up your restaurant</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Set up the restaurant profile linked to this account.
      </p>

      <div className="mt-5">
        <Tabs
          value={mode}
          onChange={setMode}
          ariaLabel="Restaurant profile setup"
          options={[
            { value: "create", label: "Create profile" },
            { value: "link", label: "Link existing" },
          ]}
        />
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        {mode === "create" ? (
          <>
            <Input label="Restaurant name" name="restaurant-name" required value={name} onChange={(event) => setName(event.target.value)} />
            <Input label="Cuisine" name="cuisine" required value={cuisine} onChange={(event) => setCuisine(event.target.value)} />
            <Input label="Address" name="address" required value={address} onChange={(event) => setAddress(event.target.value)} />
          </>
        ) : (
          <Input
            label="Existing restaurant ID"
            name="restaurant-id"
            type="number"
            min={1}
            required
            value={restaurantId}
            onChange={(event) => setRestaurantId(event.target.value)}
            hint="Only an unlinked restaurant can be connected to this account."
          />
        )}

        {error ? <ErrorState error={error} /> : null}
        <Button type="submit" loading={loading}>
          {mode === "create" ? "Create restaurant" : "Link restaurant"}
        </Button>
      </form>
    </section>
  );
}
