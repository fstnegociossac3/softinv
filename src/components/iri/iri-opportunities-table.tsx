import Link from "next/link";

import { Eye, Target } from "lucide-react";

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

import type { IriItemResult } from "@/lib/iri/types";

type Opportunity = IriItemResult & {
  rank: number;
};

type Props = {
  opportunities: Opportunity[];

  companyId?: string;

  from?: string;

  to?: string;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

function classificationBadge(iri: number) {
  if (iri >= 75) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
        Alta
      </Badge>
    );
  }

  if (iri >= 50) {
    return (
      <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">
        Media
      </Badge>
    );
  }

  return <Badge variant="destructive">Baja</Badge>;
}

export function IriOpportunitiesTable({
  opportunities,
  companyId,
  from,
  to,
}: Props) {
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

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5 text-[#12365A]" />
          Oportunidades priorizadas
        </CardTitle>

        <p className="text-sm text-slate-500">
          SKU ordenados por potencial económico de recuperación.
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {!opportunities.length ? (
          <div className="p-10 text-center">
            <Target className="mx-auto size-8 text-slate-300" />

            <p className="mt-3 font-medium text-slate-700">Sin oportunidades</p>

            <p className="mt-1 text-sm text-slate-500">
              No se encontraron SKU priorizables para el periodo seleccionado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>

                  <TableHead>SKU / Producto</TableHead>

                  <TableHead>IRI</TableHead>

                  <TableHead>Nivel</TableHead>

                  <TableHead className="text-right">Stock</TableHead>

                  <TableHead className="text-right">Valor stock</TableHead>

                  <TableHead className="text-right">Oportunidad</TableHead>

                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {opportunities.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-slate-400">
                      {item.rank}
                    </TableCell>

                    <TableCell className="min-w-[240px]">
                      <p className="font-semibold text-slate-900">{item.sku}</p>

                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-slate-900">
                        {item.iri}
                      </span>
                      <span className="text-xs text-slate-400">/100</span>
                    </TableCell>

                    <TableCell>{classificationBadge(item.iri)}</TableCell>

                    <TableCell className="text-right">
                      {numberFormatter.format(item.stockQuantity)}
                    </TableCell>

                    <TableCell className="text-right">
                      {currencyFormatter.format(item.stockValue)}
                    </TableCell>

                    <TableCell className="text-right font-semibold text-[#12365A]">
                      {currencyFormatter.format(item.opportunityValue)}
                    </TableCell>

                    <TableCell>
                      <Link
                        href={detailHref(item.id)}
                        aria-label={`Analizar ${item.sku}`}
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
        )}
      </CardContent>
    </Card>
  );
}
