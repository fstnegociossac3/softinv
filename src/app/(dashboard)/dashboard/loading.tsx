import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* ENCABEZADO */}

      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />

        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />

          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </div>

      {/* FILTROS */}

      <Skeleton className="h-24 rounded-xl" />

      {/* FILA KPI */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Skeleton className="h-32 rounded-xl" />

        <Skeleton className="h-32 rounded-xl" />

        <Skeleton className="h-32 rounded-xl" />

        <Skeleton className="h-32 rounded-xl" />

        <Skeleton className="h-32 rounded-xl" />
      </div>

      {/* GRÁFICOS */}

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />

        <Skeleton className="h-72 rounded-xl" />
      </div>

      {/* TABLA PRIORITARIOS */}

      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}