import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateDriverAvailability,
  updateDriverLocation,
} from "../../api/drivers";
import { queryKeys } from "../../lib/queryKeys";
import { useToast } from "../../hooks/useToast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { ErrorState } from "../ui/ErrorState";

export function DriverSettings({ isAvailable }: { isAvailable: boolean }) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const locationMutation = useMutation({
    mutationFn: () => updateDriverLocation({ latitude: Number(latitude), longitude: Number(longitude) }),
    onSuccess: () => showToast({ title: "Driver location saved", tone: "success" }),
  });

  const availabilityMutation = useMutation({
    mutationFn: (next: boolean) => updateDriverAvailability(next),
    onSuccess: (driver) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.driverProfile });
      showToast({ title: driver.is_available ? "You are available" : "You are unavailable", tone: "success" });
    },
  });

  const submitLocation = (event: FormEvent) => {
    event.preventDefault();
    locationMutation.mutate();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Current availability</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          A driver with an active assignment cannot be marked available.
        </p>
        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-warm-50 p-4">
          <div>
            <p className="font-semibold text-ink">{isAvailable ? "Available" : "Unavailable"}</p>
            <p className="mt-1 text-xs text-neutral-500">Controls eligibility for driver matching.</p>
          </div>
          <Button
            variant={isAvailable ? "danger" : "primary"}
            loading={availabilityMutation.isPending}
            onClick={() => availabilityMutation.mutate(!isAvailable)}
          >
            Mark {isAvailable ? "unavailable" : "available"}
          </Button>
        </div>
        {availabilityMutation.isError ? <div className="mt-4"><ErrorState error={availabilityMutation.error} /></div> : null}
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Driver location</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Coordinates are used to match nearby orders. Saved values are not displayed after refresh.
        </p>
        <form onSubmit={submitLocation} className="mt-5 space-y-4">
          <Input label="Latitude" name="driver-latitude" type="number" step="any" min={-90} max={90} required value={latitude} onChange={(event) => setLatitude(event.target.value)} />
          <Input label="Longitude" name="driver-longitude" type="number" step="any" min={-180} max={180} required value={longitude} onChange={(event) => setLongitude(event.target.value)} />
          {locationMutation.isError ? <ErrorState error={locationMutation.error} /> : null}
          <Button type="submit" loading={locationMutation.isPending}>Save location</Button>
        </form>
      </Card>
    </div>
  );
}
