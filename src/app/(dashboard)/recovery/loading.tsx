import { Skeleton } from "@/components/ui/skeleton";

export default function RecoveryLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />

        <Skeleton className="h-4 w-96" />
      </div>

      <Skeleton className="h-32 rounded-xl" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[390px] rounded-xl" />

        <Skeleton className="h-[390px] rounded-xl" />
      </div>

      <Skeleton className="h-[430px] rounded-xl" />

      <Skeleton className="h-52 rounded-xl" />
    </div>
  );
}
