import { Skeleton } from "../ui/Skeleton";

export function RestaurantSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-warm-200 bg-white">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/3" />
        <Skeleton className="mt-6 h-4 w-4/5" />
      </div>
    </div>
  );
}

export function RestaurantGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <RestaurantSkeleton key={index} />
      ))}
    </div>
  );
}
