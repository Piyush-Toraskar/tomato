import { Skeleton } from "./Skeleton";

export function ProfileSkeleton() {
  return (
    <div className="rounded-2xl border border-warm-200 bg-white p-6">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="mt-5 h-12 w-full" />
      <Skeleton className="mt-3 h-12 w-full" />
    </div>
  );
}
