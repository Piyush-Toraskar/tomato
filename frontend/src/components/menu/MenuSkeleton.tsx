import { Skeleton } from "../ui/Skeleton";

export function MenuSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-warm-200">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid grid-cols-[1fr_auto] gap-5 py-6">
          <div>
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="mt-3 h-4 w-24" />
            <Skeleton className="mt-5 h-4 w-4/5" />
          </div>
          <Skeleton className="h-24 w-28" />
        </div>
      ))}
    </div>
  );
}
