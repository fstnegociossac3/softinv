import { ChartNoAxesColumnIncreasing } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatusValue = {
  count: number;
  percentage: number;
};

type Props = {
  pending: StatusValue;

  executed: StatusValue;

  overdue: StatusValue;
};

const statuses = [
  {
    key: "pending" as const,

    label: "Pendientes",

    bar: "bg-amber-500",

    text: "text-amber-600",
  },

  {
    key: "executed" as const,

    label: "Ejecutadas",

    bar: "bg-emerald-500",

    text: "text-emerald-600",
  },

  {
    key: "overdue" as const,

    label: "Vencidas",

    bar: "bg-red-500",

    text: "text-red-600",
  },
];

export function TrackingStatusSummary({ pending, executed, overdue }: Props) {
  const values = {
    pending,
    executed,
    overdue,
  };

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <ChartNoAxesColumnIncreasing className="size-5 text-[#12365A]" />
          Resumen por estado
        </CardTitle>

        <p className="text-sm text-slate-500">
          Distribución general de las acciones de seguimiento.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {statuses.map((config) => {
          const value = values[config.key];

          return (
            <div key={config.key}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className={`font-semibold ${config.text}`}>
                    {config.label}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-slate-900">{value.count}</p>

                  <p className="text-xs text-slate-400">{value.percentage}%</p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${config.bar}`}
                  style={{
                    width: `${Math.min(value.percentage, 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
