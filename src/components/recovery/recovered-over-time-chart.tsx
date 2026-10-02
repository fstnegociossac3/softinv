import { ChartNoAxesCombined } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Point = {
  period: string;
  recoveredValue: number;
};

type Props = {
  data: Point[];
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatPeriod(period: string) {
  /*
   * YYYY-MM
   */
  if (/^\d{4}-\d{2}$/.test(period)) {
    return new Intl.DateTimeFormat("es-PE", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(new Date(`${period}-01T00:00:00.000Z`));
  }

  /*
   * YYYY-MM-DD
   */
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${period}T00:00:00.000Z`));
}

export function RecoveredOverTimeChart({ data }: Props) {
  const width = 800;
  const height = 270;

  const paddingLeft = 52;
  const paddingRight = 18;
  const paddingTop = 20;
  const paddingBottom = 38;

  const chartWidth = width - paddingLeft - paddingRight;

  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...data.map((item) => item.recoveredValue), 1);

  const points = data.map((item, index) => {
    const x =
      data.length <= 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (index / (data.length - 1)) * chartWidth;

    const y =
      paddingTop + chartHeight - (item.recoveredValue / maxValue) * chartHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  const labelIndexes =
    data.length <= 5
      ? data.map((_, index) => index)
      : [
          0,
          Math.floor((data.length - 1) * 0.25),
          Math.floor((data.length - 1) * 0.5),
          Math.floor((data.length - 1) * 0.75),
          data.length - 1,
        ];

  const uniqueLabelIndexes = [...new Set(labelIndexes)];

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <ChartNoAxesCombined className="size-5 text-[#12365A]" />
          Capital recuperado en el tiempo
        </CardTitle>

        <p className="text-sm text-slate-500">
          Evolución del capital recuperado dentro del periodo seleccionado.
        </p>
      </CardHeader>

      <CardContent>
        {!data.length ? (
          <div className="flex h-[270px] items-center justify-center text-sm text-slate-500">
            No existen recuperaciones dentro del periodo.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="min-w-[650px] w-full"
                role="img"
                aria-label="Capital recuperado en el tiempo"
              >
                {/* GRID */}

                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = paddingTop + chartHeight - ratio * chartHeight;

                  return (
                    <g key={ratio}>
                      <line
                        x1={paddingLeft}
                        x2={width - paddingRight}
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />

                      <text
                        x={paddingLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94a3b8"
                      >
                        {currencyFormatter.format(maxValue * ratio)}
                      </text>
                    </g>
                  );
                })}

                {/* LINE */}

                {points.length > 1 ? (
                  <polyline
                    fill="none"
                    stroke="#12365A"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={polyline}
                  />
                ) : null}

                {/* POINTS */}

                {points.map((point, index) => (
                  <g key={`${point.period}-${index}`}>
                    <circle cx={point.x} cy={point.y} r="4" fill="#12365A" />

                    <title>
                      {`${formatPeriod(
                        point.period,
                      )}: ${currencyFormatter.format(point.recoveredValue)}`}
                    </title>
                  </g>
                ))}

                {/* X LABELS */}

                {uniqueLabelIndexes.map((index) => {
                  const point = points[index];

                  if (!point) {
                    return null;
                  }

                  return (
                    <text
                      key={point.period}
                      x={point.x}
                      y={height - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                    >
                      {formatPeriod(point.period)}
                    </text>
                  );
                })}
              </svg>
            </div>

            <div className="mt-2 flex justify-end">
              <p className="text-xs text-slate-400">
                Capital recuperado por periodo
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
