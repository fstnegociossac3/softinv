"use client";

import {
  ArrowLeftRight,
  BadgePercent,
  CircleCheck,
  PackageX,
} from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

import type {
  RecommendationDistribution,
  RecommendationAction,
} from "@/lib/recommendations/types";

import { cn } from "@/lib/utils";

type Props = {
  distribution: RecommendationDistribution;

  activeAction?: RecommendationAction | null;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

const actions = [
  {
    key: "maintain" as const,

    label: "Mantener",

    description: "Inventario saludable",

    icon: CircleCheck,

    iconClass: "text-emerald-600",

    iconBg: "bg-emerald-50",

    active: "border-emerald-300 bg-emerald-50/60",
  },

  {
    key: "redistribute" as const,

    label: "Redistribuir",

    description: "Exceso con demanda",

    icon: ArrowLeftRight,

    iconClass: "text-blue-600",

    iconBg: "bg-blue-50",

    active: "border-blue-300 bg-blue-50/60",
  },

  {
    key: "offer" as const,

    label: "Ofertar",

    description: "Impulsar salida comercial",

    icon: BadgePercent,

    iconClass: "text-amber-600",

    iconBg: "bg-amber-50",

    active: "border-amber-300 bg-amber-50/60",
  },

  {
    key: "liquidate" as const,

    label: "Liquidar",

    description: "Salida acelerada",

    icon: PackageX,

    iconClass: "text-red-600",

    iconBg: "bg-red-50",

    active: "border-red-300 bg-red-50/60",
  },
];

export function RecommendationActionCards({
  distribution,
  activeAction,
}: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  function filterAction(action: RecommendationAction) {
    const params = new URLSearchParams(searchParams.toString());

    /*
     * Si se vuelve a pulsar
     * la acción activa,
     * mostramos todas.
     */
    if (activeAction === action) {
      params.delete("action");
    } else {
      params.set("action", action);
    }

    params.delete("page");

    router.push(`/recommendations?${params.toString()}`);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((config) => {
        const Icon = config.icon;

        const bucket = distribution[config.key];

        const selected = activeAction === config.key;

        return (
          <Button
            key={config.key}
            type="button"
            variant="outline"
            aria-pressed={selected}
            onClick={() => filterAction(config.key)}
            className={cn(
              "h-auto w-full justify-start rounded-xl border-slate-200 bg-white p-0 text-left shadow-sm hover:bg-slate-50",
              selected && config.active,
            )}
          >
            <div className="w-full p-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    config.iconBg,
                  )}
                >
                  <Icon className={cn("size-5", config.iconClass)} />
                </div>

                <span className="text-xs font-medium text-slate-400">
                  {bucket.percentage}%
                </span>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-700">
                  {config.label}
                </p>

                <div className="mt-1 flex items-end gap-2">
                  <p className="text-2xl font-bold text-slate-900">
                    {bucket.count}
                  </p>

                  <span className="pb-0.5 text-xs text-slate-400">SKU</span>
                </div>

                <p className="mt-1 text-xs font-normal text-slate-500">
                  {config.description}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-normal text-slate-400">
                    Valor stock
                  </span>

                  <span className="text-xs font-semibold text-slate-700">
                    {currencyFormatter.format(bucket.stockValue)}
                  </span>
                </div>
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
