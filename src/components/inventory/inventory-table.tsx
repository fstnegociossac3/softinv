import Link from "next/link";

import { Eye, PackageSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { buttonVariants } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TablePagination } from "@/components/shared/table-pagination";

type InventoryRow = {
  id: string;

  companyId: string;

  companyName: string;

  sku: string;

  description: string;

  category: string | null;

  brand: string | null;

  stock: number;

  unitCost: number;

  stockValue: number;

  lastMovementAt: Date | null;

  location: string | null;

  status: "active" | "inactive";

  createdAt: Date;

  updatedAt: Date;
};

type InventoryTableProps = {
  items: InventoryRow[];

  total: number;

  page: number;

  pageSize: number;

  showCompany?: boolean;
};

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

export function InventoryTable({
  items,
  total,
  page,
  pageSize,
  showCompany = false,
}: InventoryTableProps) {
  /*
   * ESTADO VACÍO
   */
  if (!items.length) {
    return (
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
            <PackageSearch className="size-6 text-slate-400" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            No se encontraron productos
          </h3>

          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Modifica los filtros o importa inventario para comenzar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const first = (page - 1) * pageSize + 1;

  const last = Math.min(page * pageSize, total);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU / Producto</TableHead>

                {showCompany ? <TableHead>Empresa</TableHead> : null}

                <TableHead>Categoría</TableHead>

                <TableHead>Marca</TableHead>

                <TableHead>Ubicación</TableHead>

                <TableHead className="text-right">Stock</TableHead>

                <TableHead className="text-right">Costo unit.</TableHead>

                <TableHead className="text-right">Valor stock</TableHead>

                <TableHead>Último movimiento</TableHead>

                <TableHead>Estado</TableHead>

                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  {/* PRODUCTO */}

                  <TableCell className="min-w-[260px]">
                    <p className="font-semibold text-slate-900">{item.sku}</p>

                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {item.description}
                    </p>
                  </TableCell>

                  {/* EMPRESA */}

                  {showCompany ? (
                    <TableCell className="whitespace-nowrap">
                      {item.companyName}
                    </TableCell>
                  ) : null}

                  {/* CATEGORÍA */}

                  <TableCell>{item.category ?? "—"}</TableCell>

                  {/* MARCA */}

                  <TableCell>{item.brand ?? "—"}</TableCell>

                  {/* UBICACIÓN */}

                  <TableCell>{item.location ?? "—"}</TableCell>

                  {/* STOCK */}

                  <TableCell className="text-right font-medium">
                    {numberFormatter.format(item.stock)}
                  </TableCell>

                  {/* COSTO */}

                  <TableCell className="text-right">
                    {currencyFormatter.format(item.unitCost)}
                  </TableCell>

                  {/* VALOR STOCK */}

                  <TableCell className="text-right font-semibold">
                    {currencyFormatter.format(item.stockValue)}
                  </TableCell>

                  {/* MOVIMIENTO */}

                  <TableCell className="whitespace-nowrap text-sm">
                    {item.lastMovementAt
                      ? dateFormatter.format(item.lastMovementAt)
                      : "—"}
                  </TableCell>

                  {/* ESTADO */}

                  <TableCell>
                    {item.status === "active" ? (
                      <Badge>Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>

                  {/* DETALLE */}

                  <TableCell>
                    <Link
                      href={`/inventory/${item.id}`}
                      aria-label={`Ver ${item.sku}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "icon",
                      })}
                    >
                      <Eye className="size-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* PAGINACIÓN */}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Mostrando {first}–{last} de {total} productos
          </p>

          <TablePagination page={page} total={total} pageSize={pageSize} />
        </div>
      </CardContent>
    </Card>
  );
}
