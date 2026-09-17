import { Skeleton } from "@/components/ui/skeleton";

export default function CompaniesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <Skeleton className="h-20 w-full rounded-xl" />

      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
  );
}
