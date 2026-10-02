import Link from "next/link";

import {
  ArrowLeftRight,
  BadgePercent,
  CircleCheck,
  Clock3,
  Eye,
  PackageSearch,
  PackageX,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

type TrackingRow = {
  id: string;

  companyId: string;

  inventoryItemId: string;

  sku: string;

  description: string;

  category: string | null;

  brand: string | null;

  recommendationAction: "maintain" | "redistribute" | "offer" | "liquidate";

  recommendationReason: string;

  iriValue: number;

  stockQuantity: number;

  stockValue: number;

  potentialRotationPercentage: number;

  recommendationDate: Date;

  dueDate: string;

  rawStatus: "pending" | "executed";

  status: "pending" | "executed" | "overdue";

  executedAt: Date | null;

  daysOverdue: number;
};

type Props = {
  items: TrackingRow[];

  total: number;

  page: number;

  pageSize: number;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
});

function recommendationBadge(action: TrackingRow["recommendationAction"]) {
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

function StatusBadge({
  status,
  daysOverdue,
}: {
  status: TrackingRow["status"];

  daysOverdue: number;
}) {
  if (status === "executed") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700">
        <CircleCheck className="size-3" />
        Ejecutada
      </Badge>
    );
  }

  if (status === "overdue") {
    return (
      <div>
        <Badge className="bg-red-50 text-red-700">
          <TriangleAlert className="size-3" />
          Vencida
        </Badge>

        <p className="mt-1 text-[11px] text-red-500">
          {daysOverdue} {daysOverdue === 1 ? "día" : "días"} de retraso
        </p>
      </div>
    );
  }

  return (
    <Badge className="bg-amber-50 text-amber-700">
      <Clock3 className="size-3" />
      Pendiente
    </Badge>
  );
}

export function TrackingActionsTable({ items, total, page, pageSize }: Props) {
  if (!items.length) {
    return (
      <Card className="bg-white">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-slate-100">
            <PackageSearch className="size-6 text-slate-400" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            No se encontraron acciones
          </h3>

          <p className="mt-1 max-w-md text-sm text-slate-500">
            Modifica los filtros o genera seguimientos desde el módulo de
            Recomendaciones.
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
        <CardTitle>Seguimiento de recomendaciones</CardTitle>

        <p className="text-sm text-slate-500">
          Estado de las acciones creadas a partir de las recomendaciones del
          inventario.
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU / Producto</TableHead>

                <TableHead>Recomendación</TableHead>

                <TableHead>IRI inicial</TableHead>

                <TableHead className="text-right">Capital</TableHead>

                <TableHead>Fecha límite</TableHead>

                <TableHead>Estado</TableHead>

                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  {/* PRODUCTO */}

                  <TableCell className="min-w-[240px]">
                    <p className="font-semibold text-slate-900">{item.sku}</p>

                    <p className="mt-0.5 max-w-[280px] truncate text-xs text-slate-500">
                      {item.description}
                    </p>
                  </TableCell>

                  {/* RECOMENDACIÓN */}

                  <TableCell>
                    {recommendationBadge(item.recommendationAction)}
                  </TableCell>

                  {/* IRI */}

                  <TableCell>
                    <span className="font-bold text-slate-900">
                      {item.iriValue}
                    </span>

                    <span className="text-xs text-slate-400">/100</span>
                  </TableCell>

                  {/* CAPITAL */}

                  <TableCell className="text-right font-semibold">
                    {currencyFormatter.format(item.stockValue)}
                  </TableCell>

                  {/* FECHA */}

                  <TableCell className="whitespace-nowrap">
                    {dateFormatter.format(new Date(`${item.dueDate}T00:00:00`))}
                  </TableCell>

                  {/* ESTADO */}

                  <TableCell>
                    <StatusBadge
                      status={item.status}
                      daysOverdue={item.daysOverdue}
                    />
                  </TableCell>

                  {/* DETALLE */}

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/tracking/${item.id}`}
                          aria-label={`Ver seguimiento de ${item.sku}`}
                        />
                      }
                    >
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* PAGINACIÓN */}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Mostrando {first}–{last} de {total} acciones
          </p>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              5 registros por página
            </span>

            <TablePagination page={page} total={total} pageSize={pageSize} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
