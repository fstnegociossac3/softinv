import { Skeleton } from "@/components/ui/skeleton";

export default function RecommendationsLoading() {
  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />

        <Skeleton className="h-4 w-96" />
      </div>

      {/* FILTROS */}

      <Skeleton className="h-40 w-full rounded-xl" />

      {/* ACCIONES */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-44 rounded-xl" />

        <Skeleton className="h-44 rounded-xl" />

        <Skeleton className="h-44 rounded-xl" />

        <Skeleton className="h-44 rounded-xl" />
      </div>

      {/* KPI */}

      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40 rounded-xl" />

        <Skeleton className="h-40 rounded-xl" />

        <Skeleton className="h-40 rounded-xl" />
      </div>

      {/* TABLA */}

      <Skeleton className="h-[460px] rounded-xl" />
    </div>
  );
}
