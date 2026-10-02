import Link from "next/link";

import {
  ArrowLeftRight,
  BadgePercent,
  CircleCheck,
  Eye,
  LoaderCircle,
  PackageSearch,
  PackageX,
  TimerReset,
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

type RecoveryRow = {
  id: string;

  trackingActionId: string;

  inventoryItemId: string;

  sku: string;

  description: string;

  recommendationAction: "maintain" | "redistribute" | "offer" | "liquidate";

  initialStockQuantity: number;

  initialUnitCost: number;

  initialStockValue: number;

  potentialRecoverableValue: number;

  status: "pending" | "in_progress" | "recovered" | "unrecovered";

  startedAt: Date;

  executedAt: Date | null;

  closedAt: Date | null;

  recoveredUnits: number;

  recoveredValue: number;

  recoveryRate: number;

  lastRecoveryDate: string | null;
};

type Props = {
  items: RecoveryRow[];

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

function ActionBadge({
  action,
}: {
  action: RecoveryRow["recommendationAction"];
}) {
  switch (action) {
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

    default:
      return (
        <Badge className="bg-emerald-50 text-emerald-700">
          <CircleCheck className="size-3" />
          Mantener
        </Badge>
      );
  }
}

function StatusBadge({ status }: { status: RecoveryRow["status"] }) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-slate-100 text-slate-700">
          <TimerReset className="size-3" />
          Pendiente
        </Badge>
      );

    case "in_progress":
      return (
        <Badge className="bg-blue-50 text-blue-700">
          <LoaderCircle className="size-3" />
          En recuperación
        </Badge>
      );

    case "recovered":
      return (
        <Badge className="bg-emerald-50 text-emerald-700">
          <CircleCheck className="size-3" />
          Recuperado
        </Badge>
      );

    case "unrecovered":
      return (
        <Badge className="bg-red-50 text-red-700">
          <PackageX className="size-3" />
          Sin recuperación
        </Badge>
      );
  }
}

export function RecoveryActionsTable({ items, total, page, pageSize }: Props) {
  if (!items.length) {
    return (
      <Card className="bg-white">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-slate-100">
            <PackageSearch className="size-6 text-slate-400" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            No existen acciones de recuperación
          </h3>

          <p className="mt-1 max-w-md text-sm text-slate-500">
            Los casos aparecerán cuando las acciones de Seguimiento sean
            marcadas como ejecutadas.
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
        <CardTitle>Acciones recuperadas ejecutadas</CardTitle>

        <p className="text-sm text-slate-500">
          Resultado financiero de las acciones ejecutadas desde Seguimiento.
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU / Producto</TableHead>

                <TableHead>Acción</TableHead>

                <TableHead>Ejecutada</TableHead>

                <TableHead className="text-right">Capital objetivo</TableHead>

                <TableHead className="text-right">Recuperado</TableHead>

                <TableHead className="text-right">Tasa</TableHead>

                <TableHead>Estado</TableHead>

                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="min-w-[240px]">
                    <p className="font-semibold text-slate-900">{item.sku}</p>

                    <p className="mt-0.5 max-w-[280px] truncate text-xs text-slate-500">
                      {item.description}
                    </p>
                  </TableCell>

                  <TableCell>
                    <ActionBadge action={item.recommendationAction} />
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {dateFormatter.format(item.executedAt ?? item.startedAt)}
                  </TableCell>

                  <TableCell className="text-right font-semibold">
                    {currencyFormatter.format(item.potentialRecoverableValue)}
                  </TableCell>

                  <TableCell className="text-right font-semibold text-emerald-700">
                    {currencyFormatter.format(item.recoveredValue)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="min-w-[90px]">
                      <p className="font-semibold text-slate-900">
                        {item.recoveryRate}%
                      </p>

                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${Math.min(item.recoveryRate, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/recovery/${item.id}`}
                          aria-label={`Ver recuperación de ${item.sku}`}
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

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Mostrando {first}–{last} de {total} acciones
            </p>

            <p className="text-xs text-slate-400">5 registros por página</p>
          </div>

          <TablePagination page={page} total={total} pageSize={pageSize} />
        </div>
      </CardContent>
    </Card>
  );
}
