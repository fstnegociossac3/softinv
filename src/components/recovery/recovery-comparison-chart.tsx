import { ChartColumnBig } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ComparisonItem = {
  action: string;
  label: string;
  current: number;
  previous: number;
};

type Props = {
  data: ComparisonItem[];
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function RecoveryComparisonChart({ data }: Props) {
  const maxValue = Math.max(
    ...data.flatMap((item) => [item.current, item.previous]),
    1,
  );

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <ChartColumnBig className="size-5 text-[#12365A]" />
          Comparativo de capital recuperado
        </CardTitle>

        <p className="text-sm text-slate-500">
          Periodo seleccionado frente al mismo rango del mes anterior.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-sm bg-[#12365A]" />

            <span className="text-slate-600">Periodo actual</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-3 rounded-sm bg-slate-300" />

            <span className="text-slate-600">Mes anterior</span>
          </div>
        </div>

        {data.map((item) => {
          const currentWidth = (item.current / maxValue) * 100;

          const previousWidth = (item.previous / maxValue) * 100;

          return (
            <div key={item.action} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-800">
                  {item.label}
                </p>

                <div className="text-right text-xs">
                  <p className="font-semibold text-slate-700">
                    {currencyFormatter.format(item.current)}
                  </p>

                  <p className="text-slate-400">
                    Ant.: {currencyFormatter.format(item.previous)}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#12365A]"
                    style={{
                      width: `${currentWidth}%`,
                    }}
                  />
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-300"
                    style={{
                      width: `${previousWidth}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
