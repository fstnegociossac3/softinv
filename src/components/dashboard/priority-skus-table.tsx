import Link from "next/link";

import { ArrowRight, Eye, PackageSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { buttonVariants } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  PrioritySku,
  TrafficLightKey,
} from "@/lib/dashboard/types";

import { cn } from "@/lib/utils";

type PrioritySkusTableProps = {
  items: PrioritySku[];

  companyId?: string;

  from?: string;

  to?: string;
};

const STATUS_META: Record<
  TrafficLightKey,
  {
    label: string;

    badgeClass: string;

    dotClass: string;
  }
> = {
  green: {
    label: "Verde",

    badgeClass: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",

    dotClass: "bg-emerald-500",
  },

  yellow: {
    label: "Amarillo",

    badgeClass: "bg-amber-50 text-amber-700 hover:bg-amber-50",

    dotClass: "bg-amber-500",
  },

  orange: {
    label: "Naranja",

    badgeClass: "bg-orange-50 text-orange-700 hover:bg-orange-50",

    dotClass: "bg-orange-500",
  },

  red: {
    label: "Rojo",

    badgeClass: "bg-red-50 text-red-700 hover:bg-red-50",

    dotClass: "bg-red-500",
  },
};

const countFormatter = new Intl.NumberFormat("es-PE");

function formatIri(value: number) {
  const rounded = Math.round(value * 10) / 10;

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function PrioritySkusTable({
  items,
  companyId,
  from,
  to,
}: PrioritySkusTableProps) {
  function detailHref(itemId: string) {
    const params = new URLSearchParams();

    if (companyId) {
      params.set("companyId", companyId);
    }

    if (from) {
      params.set("from", from);
    }

    if (to) {
      params.set("to", to);
    }

    params.set("skuId", itemId);

    return `/iri?${params.toString()}#sku-analysis`;
  }

  function allHref() {
    const params = new URLSearchParams();

    if (companyId) {
      params.set("companyId", companyId);
    }

    if (from) {
      params.set("from", from);
    }

    if (to) {
      params.set("to", to);
    }

    const query = params.toString();

    return query ? `/recommendations?${query}` : "/recommendations";
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <PackageSearch className="size-4 text-[#12365A]" />

            SKU prioritarios
          </CardTitle>

          <Link
            href={allHref()}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ver todos

            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <CardDescription>
          SKU con mayor prioridad de intervención según las recomendaciones.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {!items.length ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center p-8 text-center">
            <PackageSearch className="size-8 text-slate-300" />

            <p className="mt-3 text-sm font-medium text-slate-700">
              No hay SKU prioritarios para el periodo seleccionado.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>

                <TableHead>Producto</TableHead>

                <TableHead>Días sin movimiento</TableHead>

                <TableHead>IRI</TableHead>

                <TableHead>Estado</TableHead>

                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((item) => {
                const meta = STATUS_META[item.status];

                return (
                  <TableRow key={item.inventoryItemId}>
                    <TableCell className="min-w-[140px] font-semibold text-slate-900">
                      {item.sku}
                    </TableCell>

                    <TableCell className="min-w-[240px]">
                      <p className="font-medium text-slate-900">
                        {item.description}
                      </p>

                      {item.brand || item.category ? (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[item.brand, item.category]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      ) : null}
                    </TableCell>

                    <TableCell>
                      {item.daysWithoutMovement !== null ? (
                        <span
                          className={cn(
                            item.daysWithoutMovement >= 180
                              ? "font-medium text-red-500"
                              : "text-slate-700",
                          )}
                        >
                          {countFormatter.format(item.daysWithoutMovement)} días
                        </span>
                      ) : (
                        <span className="text-slate-400">Sin registro</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-slate-900">
                        {formatIri(item.iri)}
                      </span>

                      <span className="text-xs text-slate-400">/100</span>
                    </TableCell>

                    <TableCell>
                      <Badge className={meta.badgeClass}>
                        <span
                          className={cn(
                            "size-1.5 rounded-full",

                            meta.dotClass,
                          )}
                        />

                        {meta.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        href={detailHref(item.inventoryItemId)}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        <Eye className="size-3.5" />

                        Ver detalle
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}