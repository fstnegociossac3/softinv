"use client";

import { CircleCheck, Clock3, TriangleAlert } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import type { TrackingDisplayStatus } from "@/config/tracking";

type Props = {
  pending: number;

  executed: number;

  overdue: number;

  activeStatus?: TrackingDisplayStatus | null;
};

const statuses = [
  {
    key: "pending" as const,

    label: "Acciones pendientes",

    description: "Dentro del plazo",

    icon: Clock3,

    iconBg: "bg-amber-50",

    iconColor: "text-amber-600",

    activeClass: "border-amber-300 bg-amber-50/60",
  },

  {
    key: "executed" as const,

    label: "Acciones ejecutadas",

    description: "Acciones completadas",

    icon: CircleCheck,

    iconBg: "bg-emerald-50",

    iconColor: "text-emerald-600",

    activeClass: "border-emerald-300 bg-emerald-50/60",
  },

  {
    key: "overdue" as const,

    label: "Acciones vencidas",

    description: "Fuera del plazo",

    icon: TriangleAlert,

    iconBg: "bg-red-50",

    iconColor: "text-red-600",

    activeClass: "border-red-300 bg-red-50/60",
  },
];

export function TrackingStatusCards({
  pending,
  executed,
  overdue,
  activeStatus,
}: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const counts = {
    pending,
    executed,
    overdue,
  };

  function selectStatus(status: TrackingDisplayStatus) {
    const params = new URLSearchParams(searchParams.toString());

    /*
     * Segundo clic:
     * quitar filtro.
     */
    if (activeStatus === status) {
      params.delete("status");
    } else {
      params.set("status", status);
    }

    params.delete("page");

    router.push(`/tracking?${params.toString()}`);
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statuses.map((config) => {
        const Icon = config.icon;

        const active = activeStatus === config.key;

        return (
          <Button
            key={config.key}
            type="button"
            variant="outline"
            aria-pressed={active}
            onClick={() => selectStatus(config.key)}
            className={cn(
              "h-auto justify-start rounded-xl border-slate-200 bg-white p-0 text-left shadow-sm hover:bg-slate-50",

              active && config.activeClass,
            )}
          >
            <div className="flex w-full items-center gap-4 p-5">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl",

                  config.iconBg,
                )}
              >
                <Icon
                  className={cn(
                    "size-6",

                    config.iconColor,
                  )}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {config.label}
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {counts[config.key]}
                </p>

                <p className="mt-1 text-xs font-normal text-slate-500">
                  {config.description}
                </p>
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
