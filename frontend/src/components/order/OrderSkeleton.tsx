import { Skeleton } from "../ui/Skeleton";

export function OrderSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-2xl border border-warm-200 bg-white p-5">
          <div className="flex justify-between gap-4">
            <div className="w-full">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-6 w-1/2" />
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="mt-6 h-4 w-4/5" />
          <Skeleton className="mt-5 h-10 w-32" />
        </div>
      ))}
    </div>
  );
}
