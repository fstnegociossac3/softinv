import {
  ArrowLeftRight,
  BadgePercent,
  CircleCheck,
  PackageSearch,
  PackageX,
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

import { TablePagination } from "@/components/shared/table-pagination";

import type { RecommendationItem } from "@/lib/recommendations/types";

type Props = {
  items: RecommendationItem[];

  total: number;

  page: number;

  pageSize: number;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

function ActionBadge({ action }: { action: RecommendationItem["action"] }) {
  switch (action) {
    case "maintain":
      return (
        <Badge className="bg-emerald-50 text-emerald-700">
          <CircleCheck className="size-3" />
          Mantener
        </Badge>
      );

    case "redistribute":
      return (
        <Badge className="bg-blue-50 text-blue-700">
          <ArrowLeftRight className="size-3" />
          Redistribuir
        </Badge>
      );

    case "offer":
      return (
        <Badge className="bg-amber-50 text-amber-700">
          <BadgePercent className="size-3" />
          Ofertar
        </Badge>
      );

    case "liquidate":
      return (
        <Badge className="bg-red-50 text-red-700">
          <PackageX className="size-3" />
          Liquidar
        </Badge>
      );
  }
}

function iriClass(iri: number) {
  if (iri >= 75) {
    return "text-emerald-600";
  }

  if (iri >= 50) {
    return "text-amber-600";
  }

  return "text-red-600";
}

export function RecommendationsTable({ items, total, page, pageSize }: Props) {
  if (!items.length) {
    return (
      <Card className="bg-white">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-slate-100">
            <PackageSearch className="size-6 text-slate-400" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            No se encontraron recomendaciones
          </h3>

          <p className="mt-1 max-w-md text-sm text-slate-500">
            Modifica la fecha, acción o búsqueda para ampliar los resultados.
          </p>
        </CardContent>
      </Card>
    );
  }

  const first = (page - 1) * pageSize + 1;

  const last = Math.min(page * pageSize, total);

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Recomendaciones por SKU</CardTitle>

        <p className="text-sm text-slate-500">
          Acciones sugeridas según recuperabilidad, demanda, cobertura y
          tendencia.
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU / Producto</TableHead>

              <TableHead>IRI</TableHead>

              <TableHead>Recomendación</TableHead>

              <TableHead className="text-right">Stock</TableHead>

              <TableHead className="text-right">Valor stock</TableHead>

              <TableHead className="text-right">Cobertura</TableHead>

              <TableHead className="text-right">Rotación potencial</TableHead>

              <TableHead className="min-w-[300px]">Motivo</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                {/* SKU */}

                <TableCell className="min-w-[240px]">
                  <p className="font-semibold text-slate-900">{item.sku}</p>

                  <p className="mt-0.5 max-w-[280px] truncate text-xs text-slate-500">
                    {item.description}
                  </p>

                  <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-slate-400">
                    {item.category ? <span>{item.category}</span> : null}

                    {item.brand ? (
                      <>
                        <span>•</span>

                        <span>{item.brand}</span>
                      </>
                    ) : null}
                  </div>
                </TableCell>

                {/* IRI */}

                <TableCell>
                  <span className={`text-lg font-bold ${iriClass(item.iri)}`}>
                    {item.iri}
                  </span>

                  <span className="text-xs text-slate-400">/100</span>
                </TableCell>

                {/* ACCIÓN */}

                <TableCell>
                  <ActionBadge action={item.action} />
                </TableCell>

                {/* STOCK */}

                <TableCell className="text-right font-medium">
                  {numberFormatter.format(item.stockQuantity)}
                </TableCell>

                {/* VALOR */}

                <TableCell className="text-right font-semibold">
                  {currencyFormatter.format(item.stockValue)}
                </TableCell>

                {/* COBERTURA */}

                <TableCell className="text-right">
                  {item.coverageDays !== null
                    ? `${numberFormatter.format(item.coverageDays)} días`
                    : "Sin demanda"}
                </TableCell>

                {/* ROTACIÓN */}

                <TableCell className="text-right">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.potentialRotationPercentage}%
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {numberFormatter.format(item.potentialRotationUnits)} und.
                    </p>
                  </div>
                </TableCell>

                {/* MOTIVO */}

                <TableCell className="whitespace-normal">
                  <p className="max-w-[420px] text-xs leading-5 text-slate-500">
                    {item.reason}
                  </p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* PAGINACIÓN */}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Mostrando {first}–{last} de {total} recomendaciones
          </p>

          <TablePagination page={page} total={total} pageSize={pageSize} />
        </div>
      </CardContent>
    </Card>
  );
}
