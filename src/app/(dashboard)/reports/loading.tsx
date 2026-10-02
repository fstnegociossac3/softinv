import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />

        <Skeleton className="h-4 w-96" />
      </div>

      {/* CARDS */}

      <div className="grid gap-5 md:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />

        <Skeleton className="h-56 rounded-xl" />

        <Skeleton className="h-56 rounded-xl" />

        <Skeleton className="h-56 rounded-xl" />
      </div>

      {/* HISTORIAL */}

      <div className="space-y-3">
        <Skeleton className="h-7 w-44" />

        <Skeleton className="h-[390px] rounded-xl" />
      </div>
    </div>
  );
}
