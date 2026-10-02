import { Skeleton } from "@/components/ui/skeleton";

export default function TrackingLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />

        <Skeleton className="h-4 w-80" />
      </div>

      <Skeleton className="h-36 rounded-xl" />

      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-36 rounded-xl" />

        <Skeleton className="h-36 rounded-xl" />

        <Skeleton className="h-36 rounded-xl" />
      </div>

      <Skeleton className="h-[430px] rounded-xl" />

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[420px] rounded-xl" />

        <Skeleton className="h-[420px] rounded-xl" />
      </div>

      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
