import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type {
  TrafficLightDistributionEntry,
  TrafficLightKey,
} from "@/lib/dashboard/types";

import { cn } from "@/lib/utils";

const TRAFFIC_LIGHT_ORDER: TrafficLightKey[] = [
  "green",
  "yellow",
  "orange",
  "red",
];

const TRAFFIC_LIGHT_COLOR_NAMES: Record<TrafficLightKey, string> = {
  green: "Verde",

  yellow: "Amarillo",

  orange: "Naranja",

  red: "Rojo",
};

const TRAFFIC_LIGHT_STROKE: Record<TrafficLightKey, string> = {
  green: "#10b981",

  yellow: "#f59e0b",

  orange: "#f97316",

  red: "#ef4444",
};

const TRAFFIC_LIGHT_DOT: Record<TrafficLightKey, string> = {
  green: "bg-emerald-500",

  yellow: "bg-amber-500",

  orange: "bg-orange-500",

  red: "bg-red-500",
};

const RADIUS = 52;

const STROKE_WIDTH = 14;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const countFormatter = new Intl.NumberFormat("es-PE");

type TrafficLightDistributionProps = {
  items: TrafficLightDistributionEntry[];

  totalSku: number;
};

export function TrafficLightDistribution({
  items,
  totalSku,
}: TrafficLightDistributionProps) {
  const orderedItems = [...items].sort(
    (a, b) =>
      TRAFFIC_LIGHT_ORDER.indexOf(a.key) - TRAFFIC_LIGHT_ORDER.indexOf(b.key),
  );

  /*
   * Arcos: calculamos el punto de inicio
   * de cada segmento sin mutar variables
   * durante el render.
   */
  const fractions = orderedItems.map((item) =>
    Math.max(0, Math.min(item.percentage / 100, 1)),
  );

  const segments = orderedItems.map((item, index) => ({
    item,

    fraction: fractions[index],

    start: fractions
      .slice(0, index)
      .reduce((total, value) => total + value, 0),
  }));

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>
          Distribución de inventario por semáforo
        </CardTitle>

        <CardDescription>
          Clasificación según las recomendaciones del periodo seleccionado.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex min-h-[360px] flex-col justify-center gap-8 py-6 md:flex-row md:items-center">
        {/* DONUT */}

        <div className="relative mx-auto size-56 shrink-0 md:mx-0">
          <svg
            viewBox="0 0 120 120"
            role="img"
            aria-label="Distribución del inventario por semáforo"
            className="size-full -rotate-90"
          >
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="var(--color-slate-100)"
              strokeWidth={STROKE_WIDTH}
            />

            {segments.map(({ item, start, fraction }) => {
              if (fraction <= 0) {
                return null;
              }

              return (
                <circle
                  key={item.key}
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke={TRAFFIC_LIGHT_STROKE[item.key]}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${fraction * CIRCUMFERENCE} ${
                    CIRCUMFERENCE - fraction * CIRCUMFERENCE
                  }`}
                  strokeDashoffset={-start * CIRCUMFERENCE}
                />
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {countFormatter.format(totalSku)}
            </span>

            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              SKUs
            </span>
          </div>
        </div>

        {/* LEYENDA */}

        <ul className="flex-1 space-y-2">
          {orderedItems.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "size-3 shrink-0 rounded-full",

                    TRAFFIC_LIGHT_DOT[item.key],
                  )}
                />

                <span className="truncate text-sm text-slate-700">
                  {TRAFFIC_LIGHT_COLOR_NAMES[item.key]} — {item.label}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-4">
                <span className="text-sm font-semibold text-slate-900">
                  {countFormatter.format(item.count)}
                </span>

                <span className="w-12 text-right text-sm text-slate-500">
                  {item.percentage}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}