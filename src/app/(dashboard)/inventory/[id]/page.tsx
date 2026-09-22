import Link from "next/link";

import { ArrowLeft, Boxes, CalendarClock, MapPin, Package } from "lucide-react";

import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";

import { buttonVariants } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getInventoryItemById } from "@/server/queries/inventory.queries";

const numberFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 4,
});

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

type InventoryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function movementLabel(type: string) {
  const labels: Record<string, string> = {
    entry: "Entrada",

    exit: "Salida",

    adjustment: "Ajuste",

    import: "Importación",
  };

  return labels[type] ?? type;
}

export default async function InventoryDetailPage({
  params,
}: InventoryDetailPageProps) {
  const { id } = await params;

  const item = await getInventoryItemById(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* VOLVER */}

      <Link
        href="/inventory"
        className={buttonVariants({
          variant: "ghost",
          className: "-ml-2",
        })}
      >
        <ArrowLeft className="mr-2 size-4" />
        Volver a inventario
      </Link>

      {/* CABECERA */}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#12365A]/10">
            <Package className="size-6 text-[#12365A]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {item.sku}
              </h1>

              {item.status === "active" ? (
                <Badge>Activo</Badge>
              ) : (
                <Badge variant="secondary">Inactivo</Badge>
              )}
            </div>

            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              {item.description}
            </p>

            <p className="mt-1 text-xs text-slate-400">{item.companyName}</p>
          </div>
        </div>
      </div>

      {/* KPI */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* STOCK */}

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Stock actual</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {numberFormatter.format(item.stock)}
            </p>
          </CardContent>
        </Card>

        {/* COSTO */}

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Costo unitario</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {currencyFormatter.format(item.unitCost)}
            </p>
          </CardContent>
        </Card>

        {/* VALOR */}

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Valor de stock</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {currencyFormatter.format(item.stockValue)}
            </p>
          </CardContent>
        </Card>

        {/* MOVIMIENTO */}

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Último movimiento</p>

            <p className="mt-2 text-base font-semibold text-slate-900">
              {item.lastMovementAt
                ? dateFormatter.format(item.lastMovementAt)
                : "Sin movimientos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* INFORMACIÓN + MOVIMIENTOS */}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* INFORMACIÓN */}

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Información del producto</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 text-sm">
            <div>
              <p className="text-slate-500">SKU</p>

              <p className="font-medium text-slate-900">{item.sku}</p>
            </div>

            <div>
              <p className="text-slate-500">Categoría</p>

              <p className="font-medium text-slate-900">
                {item.category ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Marca</p>

              <p className="font-medium text-slate-900">{item.brand ?? "—"}</p>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-slate-400" />

              <div>
                <p className="text-slate-500">Ubicación</p>

                <p className="font-medium text-slate-900">
                  {item.location ?? "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 size-4 text-slate-400" />

              <div>
                <p className="text-slate-500">Actualizado</p>

                <p className="font-medium text-slate-900">
                  {dateFormatter.format(item.updatedAt)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-slate-500">Ventas 30 / 90 / 180 días</p>

              <p className="font-medium text-slate-900">
                {numberFormatter.format(item.sales30d)}
                {" / "}
                {numberFormatter.format(item.sales90d)}
                {" / "}
                {numberFormatter.format(item.sales180d)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* MOVIMIENTOS */}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="size-5" />
              Movimientos
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {item.movements.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>

                      <TableHead className="text-right">Cantidad</TableHead>

                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {item.movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-medium">
                          {movementLabel(movement.movementType)}
                        </TableCell>

                        <TableCell className="text-right">
                          {numberFormatter.format(movement.quantity)}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          {dateFormatter.format(movement.movementDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <Boxes className="mx-auto size-8 text-slate-300" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  Sin movimientos
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Este producto todavía no registra movimientos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
