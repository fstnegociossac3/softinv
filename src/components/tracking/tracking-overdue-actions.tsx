import Link from "next/link";

import {
  ArrowLeftRight,
  BadgePercent,
  Eye,
  PackageX,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OverdueAction = {
  id: string;

  inventoryItemId: string;

  sku: string;

  description: string;

  recommendationAction: "maintain" | "redistribute" | "offer" | "liquidate";

  iriValue: number;

  stockValue: number;

  dueDate: string;

  daysOverdue: number;
};

type Props = {
  actions: OverdueAction[];
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

function ActionBadge({
  action,
}: {
  action: OverdueAction["recommendationAction"];
}) {
  if (action === "redistribute") {
    return (
      <Badge className="bg-blue-50 text-blue-700">
        <ArrowLeftRight className="size-3" />
        Redistribuir
      </Badge>
    );
  }

  if (action === "offer") {
    return (
      <Badge className="bg-amber-50 text-amber-700">
        <BadgePercent className="size-3" />
        Ofertar
      </Badge>
    );
  }

  if (action === "liquidate") {
    return (
      <Badge className="bg-red-50 text-red-700">
        <PackageX className="size-3" />
        Liquidar
      </Badge>
    );
  }

  return <Badge className="bg-emerald-50 text-emerald-700">Mantener</Badge>;
}

export function TrackingOverdueActions({ actions }: Props) {
  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-red-600" />
          Acciones vencidas
        </CardTitle>

        <p className="text-sm text-slate-500">
          Acciones pendientes cuyo plazo ya finalizó.
        </p>
      </CardHeader>

      <CardContent>
        {!actions.length ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-emerald-50">
              <TriangleAlert className="size-5 text-emerald-600" />
            </div>

            <p className="mt-3 text-sm font-medium text-slate-700">
              Sin acciones vencidas
            </p>

            <p className="mt-1 text-xs text-slate-500">
              No existen acciones fuera de plazo para el periodo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="rounded-xl border border-red-100 bg-red-50/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{action.sku}</p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {action.description}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/tracking/${action.id}`}
                        aria-label={`Ver seguimiento de ${action.sku}`}
                      />
                    }
                  >
                    <Eye className="size-4" />
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ActionBadge action={action.recommendationAction} />

                  <Badge className="bg-red-100 text-red-700">
                    {action.daysOverdue}{" "}
                    {action.daysOverdue === 1 ? "día vencida" : "días vencida"}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Capital involucrado</span>

                  <span className="font-semibold text-slate-800">
                    {currencyFormatter.format(action.stockValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
