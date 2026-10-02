"use client";

import { useState, useTransition } from "react";

import type { FormEvent } from "react";

import { Loader2, Save } from "lucide-react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";

import { updateTrafficLightSettingsAction } from "@/server/actions/settings.actions";

import type { TrafficLightSettingsConfig } from "@/lib/settings/types";

type Props = {
  companyId: string;

  initialConfig: TrafficLightSettingsConfig;
};

type TrafficLightFormValues = {
  coverageHealthy: string;

  coverageWarning: string;

  trackingWarning: string;

  trackingCritical: string;

  recoveryHigh: string;

  recoveryMedium: string;
};

function parseNumber(raw: string) {
  return raw.trim() === "" ? Number.NaN : Number(raw);
}

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

export function TrafficLightSettingsForm({
  companyId,
  initialConfig,
}: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState<TrafficLightFormValues>({
    coverageHealthy: String(initialConfig.coverage.healthyMaxDays),

    coverageWarning: String(initialConfig.coverage.warningMaxDays),

    trackingWarning: String(initialConfig.tracking.warningDays),

    trackingCritical: String(initialConfig.tracking.criticalDays),

    recoveryHigh: String(initialConfig.recovery.high),

    recoveryMedium: String(initialConfig.recovery.medium),
  });

  /*
  |--------------------------------------------------------------------------
  | VALIDACIÓN — COBERTURA
  |--------------------------------------------------------------------------
  */

  const coverageHealthy = parseNumber(values.coverageHealthy);

  const coverageWarning = parseNumber(values.coverageWarning);

  const coverageComplete =
    !Number.isNaN(coverageHealthy) && !Number.isNaN(coverageWarning);

  const coverageValuesValid =
    coverageComplete &&
    isPositiveInteger(coverageHealthy) &&
    isPositiveInteger(coverageWarning);

  const coverageOrderValid =
    coverageValuesValid && coverageHealthy < coverageWarning;

  const coverageValid = coverageValuesValid && coverageOrderValid;

  /*
  |--------------------------------------------------------------------------
  | VALIDACIÓN — SEGUIMIENTO
  |--------------------------------------------------------------------------
  */

  const trackingWarning = parseNumber(values.trackingWarning);

  const trackingCritical = parseNumber(values.trackingCritical);

  const trackingComplete =
    !Number.isNaN(trackingWarning) && !Number.isNaN(trackingCritical);

  const trackingValuesValid =
    trackingComplete &&
    Number.isInteger(trackingWarning) &&
    trackingWarning >= 1 &&
    Number.isInteger(trackingCritical) &&
    trackingCritical >= 1;

  const trackingOrderValid =
    trackingValuesValid && trackingCritical <= trackingWarning;

  const trackingValid = trackingValuesValid && trackingOrderValid;

  /*
  |--------------------------------------------------------------------------
  | VALIDACIÓN — RECUPERACIÓN
  |--------------------------------------------------------------------------
  */

  const recoveryHigh = parseNumber(values.recoveryHigh);

  const recoveryMedium = parseNumber(values.recoveryMedium);

  const recoveryComplete =
    !Number.isNaN(recoveryHigh) && !Number.isNaN(recoveryMedium);

  const recoveryValuesValid =
    recoveryComplete &&
    recoveryHigh >= 0 &&
    recoveryHigh <= 100 &&
    recoveryMedium >= 0 &&
    recoveryMedium <= 100;

  const recoveryOrderValid =
    recoveryValuesValid && recoveryMedium < recoveryHigh;

  const recoveryValid = recoveryValuesValid && recoveryOrderValid;

  /*
  |--------------------------------------------------------------------------
  | VALORES PARA EXPLICACIONES
  |--------------------------------------------------------------------------
  */

  const displayCoverageHealthy = coverageComplete ? coverageHealthy : "—";

  const displayCoverageWarning = coverageComplete ? coverageWarning : "—";

  const displayTrackingWarning = trackingComplete ? trackingWarning : "—";

  const displayTrackingCritical = trackingComplete ? trackingCritical : "—";

  const displayWarningStart =
    trackingComplete && trackingCritical + 1 <= trackingWarning
      ? trackingCritical + 1
      : "—";

  const displayRecoveryHigh = recoveryComplete ? recoveryHigh : "—";

  const displayRecoveryMedium = recoveryComplete ? recoveryMedium : "—";

  const canSave =
    coverageValid && trackingValid && recoveryValid;

  /*
  |--------------------------------------------------------------------------
  | ACCIONES
  |--------------------------------------------------------------------------
  */

  function updateField(key: keyof TrafficLightFormValues, value: string) {
    setValues((prev) => ({
      ...prev,

      [key]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    startTransition(async () => {
      const result = await updateTrafficLightSettingsAction({
        companyId,

        config: {
          coverage: {
            healthyMaxDays: coverageHealthy,

            warningMaxDays: coverageWarning,
          },

          tracking: {
            warningDays: trackingWarning,

            criticalDays: trackingCritical,
          },

          recovery: {
            high: recoveryHigh,

            medium: recoveryMedium,
          },
        },
      });

      if (!result.success) {
        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Configuración de semáforos

          <Badge variant="secondary">Semáforos</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* COBERTURA */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Semáforo de cobertura
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Define los umbrales de días de cobertura para clasificar el
                inventario.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tl-coverage-healthy">Máximo saludable</Label>

                <div className="relative">
                  <Input
                    id="tl-coverage-healthy"
                    type="number"
                    min={1}
                    step={1}
                    value={values.coverageHealthy}
                    onChange={(event) =>
                      updateField("coverageHealthy", event.target.value)
                    }
                    disabled={isPending}
                    className="pr-14"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                    días
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tl-coverage-warning">
                  Máximo de advertencia
                </Label>

                <div className="relative">
                  <Input
                    id="tl-coverage-warning"
                    type="number"
                    min={1}
                    step={1}
                    value={values.coverageWarning}
                    onChange={(event) =>
                      updateField("coverageWarning", event.target.value)
                    }
                    disabled={isPending}
                    className="pr-14"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                    días
                  </span>
                </div>
              </div>
            </div>

            {coverageComplete && !coverageValuesValid ? (
              <p className="text-xs text-red-600">
                Los valores deben ser números enteros positivos.
              </p>
            ) : null}

            {coverageValuesValid && !coverageOrderValid ? (
              <p className="text-xs text-red-600">
                El máximo saludable debe ser menor que el máximo de advertencia.
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="size-2 rounded-full bg-emerald-500" />

                <span className="font-medium text-slate-900">
                  0 a {displayCoverageHealthy} días
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Saludable</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="size-2 rounded-full bg-amber-500" />

                <span className="font-medium text-slate-900">
                  {coverageComplete ? coverageHealthy + 1 : "—"} a{" "}
                  {displayCoverageWarning} días
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Advertencia</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="size-2 rounded-full bg-red-500" />

                <span className="font-medium text-slate-900">
                  Más de {displayCoverageWarning} días
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Crítica</span>
              </div>
            </div>
          </section>

          <Separator />

          {/* SEGUIMIENTO */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Semáforo de seguimiento
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Define los umbrales de días antes del vencimiento de una acción
                de seguimiento.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tl-tracking-warning">Días de advertencia</Label>

                <Input
                  id="tl-tracking-warning"
                  type="number"
                  min={1}
                  max={90}
                  step={1}
                  value={values.trackingWarning}
                  onChange={(event) =>
                    updateField("trackingWarning", event.target.value)
                  }
                  disabled={isPending}
                  className="max-w-32"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tl-tracking-critical">Días críticos</Label>

                <Input
                  id="tl-tracking-critical"
                  type="number"
                  min={1}
                  max={90}
                  step={1}
                  value={values.trackingCritical}
                  onChange={(event) =>
                    updateField("trackingCritical", event.target.value)
                  }
                  disabled={isPending}
                  className="max-w-32"
                />
              </div>
            </div>

            {trackingComplete && !trackingValuesValid ? (
              <p className="text-xs text-red-600">
                Los días deben ser números enteros mayores o iguales a 1.
              </p>
            ) : null}

            {trackingValuesValid && !trackingOrderValid ? (
              <p className="text-xs text-red-600">
                Los días críticos no pueden superar los días de advertencia.
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="size-2 rounded-full bg-emerald-500" />

                <span className="font-medium text-slate-900">
                  Más de {displayTrackingWarning} días para vencer
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Normal</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="size-2 rounded-full bg-amber-500" />

                <span className="font-medium text-slate-900">
                  Entre {displayWarningStart} y {displayTrackingWarning} días
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Advertencia</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="size-2 rounded-full bg-red-500" />

                <span className="font-medium text-slate-900">
                  {displayTrackingCritical} días o menos
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Crítico</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="size-2 rounded-full bg-slate-400" />

                <span className="font-medium text-slate-900">Fecha vencida</span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Vencido</span>
              </div>
            </div>
          </section>

          <Separator />

          {/* RECUPERACIÓN */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Semáforo de recuperación
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Define los umbrales de porcentaje de recuperación.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tl-recovery-high">
                  Alta recuperación desde
                </Label>

                <div className="relative">
                  <Input
                    id="tl-recovery-high"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={values.recoveryHigh}
                    onChange={(event) =>
                      updateField("recoveryHigh", event.target.value)
                    }
                    disabled={isPending}
                    className="pr-8"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tl-recovery-medium">
                  Recuperación media desde
                </Label>

                <div className="relative">
                  <Input
                    id="tl-recovery-medium"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={values.recoveryMedium}
                    onChange={(event) =>
                      updateField("recoveryMedium", event.target.value)
                    }
                    disabled={isPending}
                    className="pr-8"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                    %
                  </span>
                </div>
              </div>
            </div>

            {recoveryComplete && !recoveryValuesValid ? (
              <p className="text-xs text-red-600">
                Los porcentajes deben estar entre 0 y 100.
              </p>
            ) : null}

            {recoveryValuesValid && !recoveryOrderValid ? (
              <p className="text-xs text-red-600">
                El nivel medio de recuperación debe ser menor que el nivel alto.
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="size-2 rounded-full bg-emerald-500" />

                <span className="font-medium text-slate-900">
                  &gt;= {displayRecoveryHigh}%
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Alta</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="size-2 rounded-full bg-amber-500" />

                <span className="font-medium text-slate-900">
                  &gt;= {displayRecoveryMedium}% y &lt; {displayRecoveryHigh}%
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Media</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="size-2 rounded-full bg-red-500" />

                <span className="font-medium text-slate-900">
                  &lt; {displayRecoveryMedium}%
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Baja</span>
              </div>
            </div>
          </section>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <Button type="submit" disabled={!canSave || isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}

              {isPending ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}