"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { RotationTrendPoint } from "@/lib/dashboard/types";

type InventoryRotationChartProps = {
  data: RotationTrendPoint[];

  trendMonths: 3 | 6;
};

const WIDTH = 640;

const HEIGHT = 260;

const CHART_BOTTOM = 216;

const CHART_TOP = 36;

const BAR_MAX_HEIGHT = CHART_BOTTOM - CHART_TOP;

const STACK_SEGMENTS = [
  {
    key: "maintain",

    color: "#10b981",
  },

  {
    key: "redistribute",

    color: "#f59e0b",
  },

  {
    key: "offer",

    color: "#f97316",
  },

  {
    key: "liquidate",

    color: "#ef4444",
  },
] as const;

function monthLabel(monthKey: string, withYear: boolean) {
  const [year, month] = monthKey.split("-").map(Number);

  const name = new Intl.DateTimeFormat("es", {
    month: "short",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  return withYear ? `${capitalized} ${year}` : capitalized;
}

export function InventoryRotationChart({
  data,
  trendMonths,
}: InventoryRotationChartProps) {
  const router = useRouter();

  const searchParams = useSearchParams();

  function handleTrendMonthsChange(value: string | null) {
    const months = value === "3" ? "3" : "6";

    const params = new URLSearchParams(searchParams.toString());

    params.set("trendMonths", months);

    router.push(`/dashboard?${params.toString()}`);
  }

  const totals = data.map(
    (point) =>
      point.maintain + point.redistribute + point.offer + point.liquidate,
  );

  const maxTotal = Math.max(0, ...totals);

  const hasData = data.length > 0 && maxTotal > 0;

  const slot = WIDTH / Math.max(data.length, 1);

  const barWidth = Math.min(44, slot * 0.55);

  const points = data.map((point, index) => {
    const total = totals[index];

    const barHeight =
      total > 0 && maxTotal > 0 ? (total / maxTotal) * BAR_MAX_HEIGHT : 0;

    const x = slot * index + (slot - barWidth) / 2;

    const cx = slot * index + slot / 2;

    const iriY =
      CHART_BOTTOM -
      (Math.max(0, Math.min(point.iriAverage, 100)) / 100) * BAR_MAX_HEIGHT;

    return {
      point,

      total,

      barHeight,

      x,

      cx,

      iriY,
    };
  });

  const linePath = points
    .map(
      (p, index) => `${index === 0 ? "M" : "L"} ${p.cx} ${p.iriY}`,
    )
    .join(" ");

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Rotación de inventario</CardTitle>

          <Select
            value={String(trendMonths)}
            onValueChange={handleTrendMonthsChange}
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>

              <SelectItem value="6">Últimos 6 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CardDescription>
          Evolución mensual de SKU por estado e IRI promedio.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
            <p className="text-sm text-slate-500">
              Sin datos para el periodo.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                role="img"
                aria-label="Rotación de inventario por mes"
                className="h-auto w-full min-w-[520px]"
              >
                {/* Línea IRI promedio */}

                <path
                  d={linePath}
                  fill="none"
                  stroke="#12365A"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                />

                {/* Barras apiladas + puntos IRI */}

                {points.map((p) => {
                  const segments = STACK_SEGMENTS.map((segment) => ({
                    ...segment,

                    h:
                      p.total > 0
                        ? (p.point[segment.key] / p.total) * p.barHeight
                        : 0,
                  }));

                  const rects = segments.map((segment, segmentIndex) => {
                    const previousBottom =
                      CHART_BOTTOM -
                      segments
                        .slice(0, segmentIndex)
                        .reduce((sum, s) => sum + s.h, 0);

                    return {
                      color: segment.color,

                      y: previousBottom - segment.h,

                      h: segment.h,
                    };
                  });

                  const tooltip =
                    `${monthLabel(p.point.monthKey, true)}\n` +
                    `Mantener: ${p.point.maintain}\n` +
                    `Redistribuir: ${p.point.redistribute}\n` +
                    `Ofertar: ${p.point.offer}\n` +
                    `Liquidar: ${p.point.liquidate}\n` +
                    `IRI promedio: ${p.point.iriAverage}`;

                  return (
                    <g key={p.point.monthKey}>
                      <title>{tooltip}</title>

                      {rects.map((rect) => {
                        if (rect.h <= 0.5) {
                          return null;
                        }

                        return (
                          <rect
                            key={rect.color}
                            x={p.x}
                            y={rect.y}
                            width={barWidth}
                            height={rect.h}
                            rx={2}
                            fill={rect.color}
                          />
                        );
                      })}

                      <circle
                        cx={p.cx}
                        cy={p.iriY}
                        r={3.5}
                        fill="#12365A"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                })}

                {/* Eje X: meses */}

                {points.map((p) => (
                  <text
                    key={`axis-${p.point.monthKey}`}
                    x={p.cx}
                    y={HEIGHT - 6}
                    textAnchor="middle"
                    fontSize={11}
                    className="fill-slate-400"
                  >
                    {monthLabel(p.point.monthKey, false)}
                  </text>
                ))}
              </svg>
            </div>

            {/* Leyenda */}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-emerald-500" />
                Verde · Mantener
              </span>

              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-amber-500" />
                Amarillo · Redistribuir
              </span>

              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-orange-500" />
                Naranja · Ofertar
              </span>

              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-red-500" />
                Rojo · Liquidar
              </span>

              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[#12365A]" />
                IRI promedio
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}