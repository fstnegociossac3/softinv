import { ChartNoAxesColumnIncreasing } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { IriDistribution } from "@/lib/iri/types";

type Props = {
  distribution: IriDistribution;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

const items = [
  {
    key: "high" as const,

    label: "Alta",

    description: "IRI 75 - 100",

    bar: "bg-emerald-500",

    text: "text-emerald-600",
  },

  {
    key: "medium" as const,

    label: "Media",

    description: "IRI 50 - 74",

    bar: "bg-amber-500",

    text: "text-amber-600",
  },

  {
    key: "low" as const,

    label: "Baja",

    description: "IRI 0 - 49",

    bar: "bg-red-500",

    text: "text-red-600",
  },
];

export function IriDistribution({ distribution }: Props) {
  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <ChartNoAxesColumnIncreasing className="size-5 text-[#12365A]" />
          Distribución del IRI
        </CardTitle>

        <p className="text-sm text-slate-500">
          Distribución de SKU por nivel de recuperabilidad.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {items.map((config) => {
          const bucket = distribution[config.key];

          return (
            <div key={config.key} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`font-semibold ${config.text}`}>
                    {config.label}
                  </p>

                  <p className="text-xs text-slate-400">{config.description}</p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {bucket.count} SKU
                  </p>

                  <p className="text-xs text-slate-500">{bucket.percentage}%</p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${config.bar}`}
                  style={{
                    width: `${Math.min(bucket.percentage, 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-500">
                <span>Valor de stock</span>

                <span>
                  {currencyFormatter.format(bucket.stockValue)}
                  {" · "}
                  {bucket.stockValuePercentage}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
