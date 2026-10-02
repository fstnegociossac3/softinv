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

import { updateIriSettingsAction } from "@/server/actions/settings.actions";

import type { IriSettingsConfig } from "@/lib/settings/types";

import { cn } from "@/lib/utils";

type Props = {
  companyId: string;

  initialConfig: IriSettingsConfig;
};

type IriFormValues = {
  demand: string;

  recency: string;

  coverage: string;

  trend: string;

  high: string;

  medium: string;

  defaultDays: string;

  opportunityMinIri: string;

  demandReferencePercentile: string;
};

function toPercent(value: number) {
  return String(Math.round(value * 100));
}

function parseNumber(raw: string) {
  return raw.trim() === "" ? Number.NaN : Number(raw);
}

export function IriSettingsForm({ companyId, initialConfig }: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState<IriFormValues>({
    demand: toPercent(initialConfig.weights.demand),

    recency: toPercent(initialConfig.weights.recency),

    coverage: toPercent(initialConfig.weights.coverage),

    trend: toPercent(initialConfig.weights.trend),

    high: String(initialConfig.thresholds.high),

    medium: String(initialConfig.thresholds.medium),

    defaultDays: String(initialConfig.defaultDays),

    opportunityMinIri: String(initialConfig.opportunityMinIri),

    demandReferencePercentile: toPercent(
      initialConfig.demandReferencePercentile,
    ),
  });

  /*
  |--------------------------------------------------------------------------
  | VALIDACIÓN
  |--------------------------------------------------------------------------
  */

  const demand = parseNumber(values.demand);

  const recency = parseNumber(values.recency);

  const coverage = parseNumber(values.coverage);

  const trend = parseNumber(values.trend);

  const weights = [demand, recency, coverage, trend];

  const weightsComplete = weights.every((value) => !Number.isNaN(value));

  const weightsInRange = weights.every(
    (value) => value >= 0 && value <= 100,
  );

  const total = demand + recency + coverage + trend;

  const totalValid =
    weightsComplete && weightsInRange && Math.abs(total - 100) < 0.0001;

  const weightsMessage = !weightsComplete
    ? "Completa los cuatro pesos."
    : !weightsInRange
      ? "Cada peso debe estar entre 0 y 100%."
      : "Los pesos deben sumar exactamente 100%.";

  const high = parseNumber(values.high);

  const medium = parseNumber(values.medium);

  const thresholdsComplete = !Number.isNaN(high) && !Number.isNaN(medium);

  const thresholdsValid =
    thresholdsComplete && medium < high && high <= 100 && medium >= 0;

  const thresholdsHasError = thresholdsComplete && !thresholdsValid;

  const defaultDays = parseNumber(values.defaultDays);

  const defaultDaysValid =
    !Number.isNaN(defaultDays) &&
    Number.isInteger(defaultDays) &&
    defaultDays >= 1 &&
    defaultDays <= 180;

  const defaultDaysHasError = !Number.isNaN(defaultDays) && !defaultDaysValid;

  const opportunityMinIri = parseNumber(values.opportunityMinIri);

  const opportunityValid =
    !Number.isNaN(opportunityMinIri) &&
    opportunityMinIri >= 0 &&
    opportunityMinIri <= 100;

  const opportunityHasError =
    !Number.isNaN(opportunityMinIri) && !opportunityValid;

  const percentile = parseNumber(values.demandReferencePercentile);

  const percentileValid = !Number.isNaN(percentile) && percentile >= 50 && percentile <= 100;

  const percentileHasError = !Number.isNaN(percentile) && !percentileValid;

  const canSave =
    totalValid &&
    thresholdsValid &&
    defaultDaysValid &&
    opportunityValid &&
    percentileValid;

  const formattedTotal = weightsComplete ? Number(total.toFixed(2)) : null;

  const displayHigh = thresholdsComplete ? high : "—";

  const displayMedium = thresholdsComplete ? medium : "—";

  /*
  |--------------------------------------------------------------------------
  | ACCIONES
  |--------------------------------------------------------------------------
  */

  function updateField(key: keyof IriFormValues, value: string) {
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
      const result = await updateIriSettingsAction({
        companyId,

        config: {
          weights: {
            demand: demand / 100,

            recency: recency / 100,

            coverage: coverage / 100,

            trend: trend / 100,
          },

          thresholds: {
            high,

            medium,
          },

          defaultDays,

          opportunityMinIri,

          demandReferencePercentile: percentile / 100,
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
          Configuración IRI

          <Badge variant="secondary">IRI</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* PESOS */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Pesos del índice IRI
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Distribuye la importancia de cada factor. Los cuatro pesos deben
                sumar exactamente 100%.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="iri-weight-demand">Demanda</Label>

                <div className="relative">
                  <Input
                    id="iri-weight-demand"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={values.demand}
                    onChange={(event) =>
                      updateField("demand", event.target.value)
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
                <Label htmlFor="iri-weight-recency">Recencia</Label>

                <div className="relative">
                  <Input
                    id="iri-weight-recency"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={values.recency}
                    onChange={(event) =>
                      updateField("recency", event.target.value)
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
                <Label htmlFor="iri-weight-coverage">Cobertura</Label>

                <div className="relative">
                  <Input
                    id="iri-weight-coverage"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={values.coverage}
                    onChange={(event) =>
                      updateField("coverage", event.target.value)
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
                <Label htmlFor="iri-weight-trend">Tendencia</Label>

                <div className="relative">
                  <Input
                    id="iri-weight-trend"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={values.trend}
                    onChange={(event) =>
                      updateField("trend", event.target.value)
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

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">Total</p>

                <p
                  className={cn(
                    "text-sm font-semibold",
                    totalValid ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {formattedTotal === null ? "—%" : `${formattedTotal}%`}
                </p>
              </div>

              {!totalValid ? (
                <p className="mt-1 text-xs text-red-600">{weightsMessage}</p>
              ) : null}
            </div>
          </section>

          <Separator />

          {/* CLASIFICACIÓN */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Clasificación del IRI
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Define los límites que determinan la recuperabilidad de un
                producto.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="iri-threshold-high">
                  Alta recuperabilidad desde
                </Label>

                <Input
                  id="iri-threshold-high"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={values.high}
                  onChange={(event) => updateField("high", event.target.value)}
                  disabled={isPending}
                  className="max-w-32"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="iri-threshold-medium">
                  Recuperabilidad media desde
                </Label>

                <Input
                  id="iri-threshold-medium"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={values.medium}
                  onChange={(event) =>
                    updateField("medium", event.target.value)
                  }
                  disabled={isPending}
                  className="max-w-32"
                />
              </div>
            </div>

            {thresholdsHasError ? (
              <p className="text-xs text-red-600">
                El límite medio debe ser menor que el límite alto, y ambos deben
                estar entre 0 y 100.
              </p>
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">
                    IRI &gt;= {displayHigh}
                  </span>

                  <span className="text-slate-400">→</span>

                  <span>Alta</span>
                </li>

                <li className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">
                    IRI &gt;= {displayMedium} y &lt; {displayHigh}
                  </span>

                  <span className="text-slate-400">→</span>

                  <span>Media</span>
                </li>

                <li className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">
                    IRI &lt; {displayMedium}
                  </span>

                  <span className="text-slate-400">→</span>

                  <span>Baja</span>
                </li>
              </ul>
            </div>
          </section>

          <Separator />

          {/* PARÁMETROS */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Parámetros de análisis
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="iri-default-days">
                  Periodo predeterminado
                </Label>

                <div className="relative">
                  <Input
                    id="iri-default-days"
                    type="number"
                    min={1}
                    max={180}
                    step={1}
                    value={values.defaultDays}
                    onChange={(event) =>
                      updateField("defaultDays", event.target.value)
                    }
                    disabled={isPending}
                    className="pr-14"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                    días
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Se utilizará cuando el usuario no seleccione un periodo
                  manualmente.
                </p>

                {defaultDaysHasError ? (
                  <p className="text-xs text-red-600">
                    El periodo debe estar entre 1 y 180 días.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="iri-opportunity-min">
                  IRI mínimo para oportunidad
                </Label>

                <Input
                  id="iri-opportunity-min"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={values.opportunityMinIri}
                  onChange={(event) =>
                    updateField("opportunityMinIri", event.target.value)
                  }
                  disabled={isPending}
                  className="max-w-32"
                />

                {opportunityHasError ? (
                  <p className="text-xs text-red-600">
                    El valor debe estar entre 0 y 100.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="iri-percentile">
                  Percentil de referencia de demanda
                </Label>

                <div className="relative">
                  <Input
                    id="iri-percentile"
                    type="number"
                    min={50}
                    max={100}
                    step={1}
                    value={values.demandReferencePercentile}
                    onChange={(event) =>
                      updateField("demandReferencePercentile", event.target.value)
                    }
                    disabled={isPending}
                    className="pr-8"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                    %
                  </span>
                </div>

                {percentileHasError ? (
                  <p className="text-xs text-red-600">
                    El percentil debe estar entre 50 y 100%.
                  </p>
                ) : null}
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