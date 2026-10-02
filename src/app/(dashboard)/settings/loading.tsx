import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />

        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <Skeleton className="h-24 rounded-xl" />

      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}