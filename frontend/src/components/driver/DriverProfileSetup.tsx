import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDriverProfile, linkDriverProfile } from "../../api/drivers";
import { queryKeys } from "../../lib/queryKeys";
import { useToast } from "../../hooks/useToast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Tabs } from "../ui/Tabs";
import { ErrorState } from "../ui/ErrorState";

type SetupMode = "create" | "link";

export function DriverProfileSetup() {
  const [mode, setMode] = useState<SetupMode>("create");
  const [name, setName] = useState("");
  const [driverId, setDriverId] = useState("");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: () => createDriverProfile({ name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.driverProfile });
      showToast({ title: "Driver profile created", tone: "success" });
    },
  });

  const linkMutation = useMutation({
    mutationFn: () => linkDriverProfile(Number(driverId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.driverProfile });
      showToast({ title: "Driver profile linked", tone: "success" });
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
      <h2 className="text-xl font-semibold text-ink">Set up your driver profile</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Set up the driver profile linked to this account.
      </p>
      <div className="mt-5">
        <Tabs
          value={mode}
          onChange={setMode}
          ariaLabel="Driver profile setup"
          options={[
            { value: "create", label: "Create profile" },
            { value: "link", label: "Link existing" },
          ]}
        />
      </div>
      <form onSubmit={submit} className="mt-6 space-y-5">
        {mode === "create" ? (
          <Input label="Driver name" name="driver-name" required value={name} onChange={(event) => setName(event.target.value)} />
        ) : (
          <Input label="Existing driver ID" name="driver-id" type="number" min={1} required value={driverId} onChange={(event) => setDriverId(event.target.value)} />
        )}
        {error ? <ErrorState error={error} /> : null}
        <Button type="submit" loading={loading}>
          {mode === "create" ? "Create driver" : "Link driver"}
        </Button>
      </form>
    </section>
  );
}
