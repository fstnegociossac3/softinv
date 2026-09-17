import { Skeleton } from "@/components/ui/skeleton";

export default function ImportsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Skeleton className="h-20 w-full rounded-xl" />

      <Skeleton className="h-[450px] w-full rounded-xl" />
    </div>
  );
}
