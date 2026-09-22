import { Boxes, CircleDollarSign, RefreshCw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { RecommendationSummary } from "@/lib/recommendations/types";

type Props = {
  summary: RecommendationSummary;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

export function RecommendationKpiCards({ summary }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* TOTAL */}

      <Card className="bg-white">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total de recomendaciones
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {summary.totalRecommendations}
              </p>

              <p className="mt-2 text-sm text-slate-500">SKU analizados</p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
              <Boxes className="size-5 text-[#12365A]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CAPITAL */}

      <Card className="bg-white">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Capital involucrado
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {currencyFormatter.format(summary.capitalInvolved)}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Redistribuir + ofertar + liquidar
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50">
              <CircleDollarSign className="size-5 text-amber-600" />
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Inventario total</span>

              <span className="font-semibold text-slate-700">
                {currencyFormatter.format(summary.totalInventoryValue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROTACIÓN */}

      <Card className="bg-white">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Rotación potencial
              </p>

              <div className="mt-3 flex items-end gap-2">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {summary.potentialRotationPercentage}
                </p>

                <span className="pb-1 text-sm text-slate-400">%</span>
              </div>

              <p className="mt-2 text-sm text-slate-500">Capital intervenido</p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50">
              <RefreshCw className="size-5 text-emerald-600" />
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: `${Math.min(
                    summary.potentialRotationPercentage,
                    100,
                  )}%`,
                }}
              />
            </div>

            <div className="mt-3 flex justify-between text-xs">
              <span className="text-slate-400">Valor potencial</span>

              <span className="font-semibold text-slate-700">
                {currencyFormatter.format(summary.potentialRotationValue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
