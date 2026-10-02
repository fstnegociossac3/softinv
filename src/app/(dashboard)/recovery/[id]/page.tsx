import Link from "next/link";

import {
  ArrowLeft,
  CircleDollarSign,
  History,
  PackageCheck,
} from "lucide-react";

import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { RecoveryActionManager } from "@/components/recovery/recovery-action-manager";

import { getRecoveryCaseById } from "@/server/queries/recovery.queries";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 4,
});

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
});

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendiente",

    in_progress: "En recuperación",

    recovered: "Recuperado",

    unrecovered: "Sin recuperación",
  };

  return labels[status] ?? status;
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    maintain: "Mantener",

    redistribute: "Redistribuir",

    offer: "Ofertar",

    liquidate: "Liquidar",
  };

  return labels[action] ?? action;
}

export default async function RecoveryDetailPage({ params }: PageProps) {
  const { id } = await params;

  const recovery = await getRecoveryCaseById(id);

  if (!recovery) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        nativeButton={false}
        render={<Link href="/recovery" />}
      >
        <ArrowLeft className="size-4" />
        Volver a recuperación
      </Button>

      <Card className="bg-white">
        <CardContent>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {recovery.sku}
                </h1>

                <Badge>{statusLabel(recovery.status)}</Badge>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {recovery.description}
              </p>

              <p className="mt-3 text-sm font-semibold text-[#12365A]">
                Acción ejecutada: {actionLabel(recovery.recommendationAction)}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-600 px-8 py-5 text-center text-white">
              <p className="text-xs uppercase tracking-wider text-white/70">
                Capital recuperado
              </p>

              <p className="mt-1 text-2xl font-bold">
                {currencyFormatter.format(recovery.recoveredValue)}
              </p>

              <p className="text-xs text-white/80">
                {recovery.recoveryRate}% del potencial
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Stock inicial"
          value={numberFormatter.format(recovery.initialStockQuantity)}
        />

        <Metric
          label="Capital inicial"
          value={currencyFormatter.format(recovery.initialStockValue)}
        />

        <Metric
          label="Potencial recuperable"
          value={currencyFormatter.format(recovery.potentialRecoverableValue)}
        />

        <Metric
          label="Unidades recuperadas"
          value={numberFormatter.format(recovery.recoveredUnits)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="size-5 text-[#12365A]" />
                Estado del caso
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Info
                label="Fecha de inicio"
                value={dateFormatter.format(recovery.startedAt)}
              />

              <Info
                label="Costo unitario inicial"
                value={currencyFormatter.format(recovery.initialUnitCost)}
              />

              <Info
                label="Unidades pendientes"
                value={numberFormatter.format(recovery.pendingUnits)}
              />

              <Info label="Estado" value={statusLabel(recovery.status)} />
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-5 text-[#12365A]" />
                Historial de recuperación
              </CardTitle>
            </CardHeader>

            <CardContent>
              {!recovery.events.length ? (
                <div className="py-10 text-center">
                  <CircleDollarSign className="mx-auto size-8 text-slate-300" />

                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Sin recuperaciones registradas
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {recovery.events.map((event) => (
                    <div
                      key={event.id}
                      className="relative border-l border-slate-200 pb-6 pl-6 last:pb-0"
                    >
                      <div className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-emerald-500" />

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {numberFormatter.format(event.quantity)} unidades
                          </p>

                          {event.notes ? (
                            <p className="mt-1 text-sm text-slate-500">
                              {event.notes}
                            </p>
                          ) : null}
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-emerald-700">
                            {currencyFormatter.format(event.recoveredValue)}
                          </p>

                          <p className="text-xs text-slate-400">
                            {event.recoveryDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit bg-white">
          <CardHeader>
            <CardTitle>Gestionar recuperación</CardTitle>
          </CardHeader>

          <CardContent>
            <RecoveryActionManager
              recoveryCaseId={recovery.id}
              status={recovery.status}
              pendingUnits={recovery.pendingUnits}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-white">
      <CardContent>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-1 font-medium text-slate-800">{value}</p>
    </div>
  );
}
