import { Skeleton } from "@/components/ui/skeleton";

export default function IriLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />

        <Skeleton className="h-4 w-80" />
      </div>

      <Skeleton className="h-32 w-full rounded-xl" />

      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-44 rounded-xl" />

        <Skeleton className="h-44 rounded-xl" />

        <Skeleton className="h-44 rounded-xl" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />

        <Skeleton className="h-96 rounded-xl" />
      </div>

      <Skeleton className="h-96 rounded-xl" />

      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
