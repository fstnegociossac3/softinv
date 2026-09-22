import { Boxes, CircleDollarSign, Gauge, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { IriSummary } from "@/lib/iri/types";

type Props = {
  summary: IriSummary;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

function getAverageLabel(iri: number) {
  if (iri >= 75) {
    return {
      label: "Alta recuperabilidad",

      className: "text-emerald-600",
    };
  }

  if (iri >= 50) {
    return {
      label: "Recuperabilidad media",

      className: "text-amber-600",
    };
  }

  return {
    label: "Baja recuperabilidad",

    className: "text-red-600",
  };
}

export function IriKpiCards({ summary }: Props) {
  const average = getAverageLabel(summary.iriAverage);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {/* IRI PROMEDIO */}

      <Card className="bg-white">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                IRI promedio
              </p>

              <div className="mt-3 flex items-end gap-2">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {summary.iriAverage}
                </p>

                <span className="pb-1 text-sm text-slate-400">/100</span>
              </div>

              <p className={`mt-2 text-sm font-medium ${average.className}`}>
                {average.label}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
              <Gauge className="size-5 text-[#12365A]" />
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#12365A]"
              style={{
                width: `${Math.min(summary.iriAverage, 100)}%`,
              }}
            />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {summary.analyzedSkuCount} SKU analizados
          </p>
        </CardContent>
      </Card>

      {/* ALTA RECUPERABILIDAD */}

      <Card className="bg-white">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                SKU con alta recuperabilidad
              </p>

              <div className="mt-3 flex items-end gap-2">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {summary.highRecoverabilitySkuCount}
                </p>

                <span className="pb-1 text-sm text-slate-400">SKU</span>
              </div>

              <p className="mt-2 text-sm font-medium text-emerald-600">
                {summary.highRecoverabilityPercentage}% del inventario
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50">
              <TrendingUp className="size-5 text-emerald-600" />
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Stock asociado</span>

              <span className="text-sm font-semibold text-slate-800">
                {currencyFormatter.format(summary.highRecoverabilityStockValue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OPORTUNIDADES */}

      <Card className="bg-white md:col-span-2 xl:col-span-1">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Oportunidades priorizadas
              </p>

              <div className="mt-3 flex items-end gap-2">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {summary.opportunityCount}
                </p>

                <span className="pb-1 text-sm text-slate-400">SKU</span>
              </div>

              <p className="mt-2 text-sm font-medium text-[#12365A]">
                Potencial recuperable
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50">
              <CircleDollarSign className="size-5 text-amber-600" />
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Valor oportunidad</span>

              <span className="text-sm font-semibold text-slate-800">
                {currencyFormatter.format(summary.opportunityValue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
