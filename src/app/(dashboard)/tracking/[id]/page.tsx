import Link from "next/link";

import {
  ArrowLeft,
  CalendarClock,
  CircleCheck,
  ClipboardCheck,
  TriangleAlert,
} from "lucide-react";

import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { TrackingActionManager } from "@/components/tracking/tracking-action-manager";

import { getTrackingActionById } from "@/server/queries/tracking.queries";

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
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",

  timeStyle: "short",
});

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    maintain: "Mantener",

    redistribute: "Redistribuir",

    offer: "Ofertar",

    liquidate: "Liquidar",
  };

  return labels[action] ?? action;
}

export default async function TrackingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const action = await getTrackingActionById(id);

  if (!action) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* VOLVER */}

      <Button
        variant="ghost"
        nativeButton={false}
        render={<Link href="/tracking" />}
      >
        <ArrowLeft className="size-4" />
        Volver a seguimiento
      </Button>

      {/* CABECERA */}

      <Card className="bg-white">
        <CardContent>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {action.sku}
                </h1>

                <StatusBadge status={action.status} />
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {action.description}
              </p>

              <p className="mt-3 text-sm font-medium text-[#12365A]">
                Recomendación: {actionLabel(action.recommendationAction)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#12365A] px-8 py-5 text-center text-white">
              <p className="text-xs uppercase tracking-wider text-white/70">
                IRI inicial
              </p>

              <p className="mt-1 text-4xl font-bold">{action.iriValue}</p>

              <p className="text-xs text-white/70">/100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MÉTRICAS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Stock inicial"
          value={numberFormatter.format(action.stockQuantity)}
        />

        <Metric
          label="Costo unitario"
          value={currencyFormatter.format(action.unitCost)}
        />

        <Metric
          label="Capital involucrado"
          value={currencyFormatter.format(action.stockValue)}
        />

        <Metric
          label="Rotación potencial"
          value={`${action.potentialRotationPercentage}%`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* INFORMACIÓN */}

        <div className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Recomendación original</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <p className="text-sm leading-6 text-slate-600">
                {action.recommendationReason}
              </p>

              <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <Info
                  label="Periodo analizado"
                  value={`${action.analysisFrom} — ${action.analysisTo}`}
                />

                <Info
                  label="Fecha recomendación"
                  value={dateFormatter.format(action.recommendationDate)}
                />

                <Info
                  label="Fecha límite"
                  value={dateFormatter.format(
                    new Date(`${action.dueDate}T00:00:00`),
                  )}
                />

                <Info
                  label="Cobertura inicial"
                  value={
                    action.coverageDays !== null
                      ? `${numberFormatter.format(action.coverageDays)} días`
                      : "Sin demanda"
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* ACTIVIDADES */}

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Historial de actividades</CardTitle>
            </CardHeader>

            <CardContent>
              {!action.activities.length ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No existen actividades.
                </p>
              ) : (
                <div className="space-y-0">
                  {action.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="relative border-l border-slate-200 pb-6 pl-6 last:pb-0"
                    >
                      <div className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-[#12365A]" />

                      <p className="font-medium text-slate-800">
                        {activity.description}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-400">
                        <span>
                          {dateTimeFormatter.format(activity.createdAt)}
                        </span>

                        {activity.userName ? (
                          <span>{activity.userName}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* GESTIÓN */}

        <Card className="h-fit bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-[#12365A]" />
              Gestionar seguimiento
            </CardTitle>
          </CardHeader>

          <CardContent>
            <TrackingActionManager
              trackingActionId={action.id}
              status={action.status}
              dueDate={action.dueDate}
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

function StatusBadge({
  status,
}: {
  status: "pending" | "executed" | "overdue";
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
      <Badge className="bg-red-50 text-red-700">
        <TriangleAlert className="size-3" />
        Vencida
      </Badge>
    );
  }

  return (
    <Badge className="bg-amber-50 text-amber-700">
      <CalendarClock className="size-3" />
      Pendiente
    </Badge>
  );
}
