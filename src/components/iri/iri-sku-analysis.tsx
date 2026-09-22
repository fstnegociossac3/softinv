import {
  Activity,
  Boxes,
  CalendarClock,
  MapPin,
  PackageSearch,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { IRI_WEIGHTS } from "@/config/iri";

import type { getIriSkuAnalysis } from "@/server/queries/iri.queries";

type Analysis = NonNullable<Awaited<ReturnType<typeof getIriSkuAnalysis>>>;

type Props = {
  analysis: Analysis | null;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
});

function classification(iri: number) {
  if (iri >= 75) {
    return {
      label: "Alta recuperabilidad",

      className: "bg-emerald-50 text-emerald-700",
    };
  }

  if (iri >= 50) {
    return {
      label: "Recuperabilidad media",

      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Baja recuperabilidad",

    className: "bg-red-50 text-red-700",
  };
}

function movementLabel(type: string) {
  const labels: Record<string, string> = {
    import: "Importación",
    entry: "Entrada",
    exit: "Salida",
    adjustment: "Ajuste",
  };

  return labels[type] ?? type;
}

export function IriSkuAnalysis({ analysis }: Props) {
  if (!analysis) {
    return (
      <Card id="sku-analysis" className="bg-white">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-slate-100">
            <PackageSearch className="size-6 text-slate-400" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            Selecciona un SKU
          </h3>

          <p className="mt-1 max-w-md text-sm text-slate-500">
            Selecciona un producto para visualizar su IRI, variables, cobertura,
            tendencia e histórico.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { item, history } = analysis;

  const level = classification(item.iri);

  const variables = [
    {
      label: "Demanda",

      value: item.scores.demand,

      weight: IRI_WEIGHTS.demand,
    },

    {
      label: "Recencia",

      value: item.scores.recency,

      weight: IRI_WEIGHTS.recency,
    },

    {
      label: "Cobertura",

      value: item.scores.coverage,

      weight: IRI_WEIGHTS.coverage,
    },

    {
      label: "Tendencia",

      value: item.scores.trend,

      weight: IRI_WEIGHTS.trend,
    },
  ];

  const recentSnapshots = history.snapshots.slice(-12);

  const maxStock = Math.max(
    ...recentSnapshots.map((snapshot) => snapshot.stockQuantity),
    1,
  );

  return (
    <div id="sku-analysis" className="space-y-6">
      {/* CABECERA */}

      <Card className="bg-white">
        <CardContent>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{item.sku}</h3>

                <Badge className={level.className}>{level.label}</Badge>
              </div>

              <p className="mt-1 text-sm text-slate-500">{item.description}</p>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                {item.category ? (
                  <span>
                    Categoría: <strong>{item.category}</strong>
                  </span>
                ) : null}

                {item.brand ? (
                  <span>
                    Marca: <strong>{item.brand}</strong>
                  </span>
                ) : null}

                {item.location ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />

                    {item.location}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-[#12365A] px-8 py-5 text-center text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                IRI
              </p>

              <p className="mt-1 text-4xl font-bold">{item.iri}</p>

              <p className="text-xs text-white/70">/100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MÉTRICAS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white">
          <CardContent>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Stock actual
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {numberFormatter.format(item.stockQuantity)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Valor del stock
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {currencyFormatter.format(item.stockValue)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cobertura estimada
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {item.coverageDays !== null
                ? `${numberFormatter.format(item.coverageDays)} días`
                : "Sin demanda"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Oportunidad
            </p>

            <p className="mt-2 text-2xl font-bold text-[#12365A]">
              {currencyFormatter.format(item.opportunityValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* VARIABLES */}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-[#12365A]" />
              Descomposición del IRI
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {variables.map((variable) => (
              <div key={variable.label}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">
                      {variable.label}
                    </p>

                    <p className="text-xs text-slate-400">
                      Peso {Math.round(variable.weight * 100)}%
                    </p>
                  </div>

                  <p className="font-bold text-slate-900">
                    {variable.value}
                    /100
                  </p>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#12365A]"
                    style={{
                      width: `${Math.min(variable.value, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* DATOS COMERCIALES */}

        <Card className="bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-[#12365A]" />
              Comportamiento comercial
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Ventas 30 días</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {numberFormatter.format(item.sales30d)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Ventas 90 días</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {numberFormatter.format(item.sales90d)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Ventas 180 días</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {numberFormatter.format(item.sales180d)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Demanda estimada / mes</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {numberFormatter.format(item.estimatedMonthlyDemand)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Ventas estimadas periodo</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {numberFormatter.format(item.estimatedPeriodSales)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Tendencia</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {item.trendRatio !== null
                  ? `${numberFormatter.format(item.trendRatio)}x`
                  : "Sin histórico"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HISTÓRICO */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* SNAPSHOTS */}

        <Card className="bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Boxes className="size-5 text-[#12365A]" />
              Evolución del stock
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!recentSnapshots.length ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No existen snapshots dentro del periodo.
              </p>
            ) : (
              <div className="space-y-4">
                {recentSnapshots.map((snapshot) => {
                  const percentage = Math.max(
                    2,
                    (snapshot.stockQuantity / maxStock) * 100,
                  );

                  return (
                    <div key={snapshot.id}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-slate-500">
                          {dateFormatter.format(snapshot.capturedAt)}
                        </span>

                        <span className="font-semibold text-slate-800">
                          {numberFormatter.format(snapshot.stockQuantity)}
                        </span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#12365A]"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MOVIMIENTOS */}

        <Card className="bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5 text-[#12365A]" />
              Movimientos del periodo
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {!history.movements.length ? (
              <p className="p-10 text-center text-sm text-slate-500">
                No existen movimientos dentro del periodo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>

                      <TableHead>Tipo</TableHead>

                      <TableHead className="text-right">Cantidad</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {history.movements.slice(0, 10).map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="whitespace-nowrap">
                          {dateFormatter.format(movement.movementDate)}
                        </TableCell>

                        <TableCell>
                          {movementLabel(movement.movementType)}
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {numberFormatter.format(movement.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
