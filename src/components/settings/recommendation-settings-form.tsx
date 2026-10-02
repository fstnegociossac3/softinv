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

import { updateRecommendationSettingsAction } from "@/server/actions/settings.actions";

import type { RecommendationSettingsConfig } from "@/lib/settings/types";

type Props = {
  companyId: string;

  initialConfig: RecommendationSettingsConfig;
};

type RecommendationFormValues = {
  healthyMinIri: string;

  redistributeMinCoverageDays: string;

  offerMinIri: string;

  liquidateMaxIri: string;
};

function parseNumber(raw: string) {
  return raw.trim() === "" ? Number.NaN : Number(raw);
}

export function RecommendationSettingsForm({
  companyId,
  initialConfig,
}: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState<RecommendationFormValues>({
    healthyMinIri: String(initialConfig.healthyMinIri),

    redistributeMinCoverageDays: String(
      initialConfig.redistributeMinCoverageDays,
    ),

    offerMinIri: String(initialConfig.offerMinIri),

    liquidateMaxIri: String(initialConfig.liquidateMaxIri),
  });

  /*
  |--------------------------------------------------------------------------
  | VALIDACIÓN
  |--------------------------------------------------------------------------
  */

  const healthyMinIri = parseNumber(values.healthyMinIri);

  const healthyComplete = !Number.isNaN(healthyMinIri);

  const healthyValid = healthyComplete && healthyMinIri >= 0 && healthyMinIri <= 100;

  const redistributeDays = parseNumber(values.redistributeMinCoverageDays);

  const redistributeComplete = !Number.isNaN(redistributeDays);

  const redistributeValid =
    redistributeComplete &&
    Number.isInteger(redistributeDays) &&
    redistributeDays > 0;

  const offerMinIri = parseNumber(values.offerMinIri);

  const offerComplete = !Number.isNaN(offerMinIri);

  const offerValid = offerComplete && offerMinIri >= 0 && offerMinIri <= 100;

  const liquidateMaxIri = parseNumber(values.liquidateMaxIri);

  const liquidateComplete = !Number.isNaN(liquidateMaxIri);

  const liquidateValid =
    liquidateComplete && liquidateMaxIri >= 0 && liquidateMaxIri <= 100;

  const allComplete =
    healthyComplete &&
    redistributeComplete &&
    offerComplete &&
    liquidateComplete;

  const offerBelowHealthy = offerValid && healthyValid && offerMinIri < healthyMinIri;

  const contiguous =
    offerValid && liquidateValid && offerMinIri === liquidateMaxIri;

  const canSave =
    allComplete &&
    healthyValid &&
    redistributeValid &&
    offerValid &&
    liquidateValid &&
    offerBelowHealthy &&
    contiguous;

  /*
  |--------------------------------------------------------------------------
  | VALORES PARA LA EXPLICACIÓN VISUAL
  |--------------------------------------------------------------------------
  */

  const displayHealthy = healthyComplete ? healthyMinIri : "—";

  const displayDays = redistributeComplete ? redistributeDays : "—";

  const displayOffer = offerComplete ? offerMinIri : "—";

  const displayLiquidate = liquidateComplete ? liquidateMaxIri : "—";

  /*
  |--------------------------------------------------------------------------
  | ACCIONES
  |--------------------------------------------------------------------------
  */

  function updateField(key: keyof RecommendationFormValues, value: string) {
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
      const result = await updateRecommendationSettingsAction({
        companyId,

        config: {
          healthyMinIri,

          redistributeMinCoverageDays: redistributeDays,

          offerMinIri,

          liquidateMaxIri,
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
          Configuración de recomendaciones

          <Badge variant="secondary">Recomendaciones</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* REGLAS */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Reglas de recomendación
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Define los límites que determinan la acción recomendada para
                cada producto.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="rec-healthy-min-iri">
                  IRI mínimo para Mantener
                </Label>

                <Input
                  id="rec-healthy-min-iri"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={values.healthyMinIri}
                  onChange={(event) =>
                    updateField("healthyMinIri", event.target.value)
                  }
                  disabled={isPending}
                  className="max-w-32"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rec-redistribute-coverage-days">
                  Cobertura máxima antes de Redistribuir
                </Label>

                <div className="relative">
                  <Input
                    id="rec-redistribute-coverage-days"
                    type="number"
                    min={1}
                    step={1}
                    value={values.redistributeMinCoverageDays}
                    onChange={(event) =>
                      updateField(
                        "redistributeMinCoverageDays",
                        event.target.value,
                      )
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
                <Label htmlFor="rec-offer-min-iri">
                  IRI mínimo para Ofertar
                </Label>

                <Input
                  id="rec-offer-min-iri"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={values.offerMinIri}
                  onChange={(event) =>
                    updateField("offerMinIri", event.target.value)
                  }
                  disabled={isPending}
                  className="max-w-32"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rec-liquidate-max-iri">
                  IRI máximo para Liquidar
                </Label>

                <Input
                  id="rec-liquidate-max-iri"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={values.liquidateMaxIri}
                  onChange={(event) =>
                    updateField("liquidateMaxIri", event.target.value)
                  }
                  disabled={isPending}
                  className="max-w-32"
                />
              </div>
            </div>

            {allComplete && offerMinIri >= healthyMinIri ? (
              <p className="text-xs text-red-600">
                El límite de Ofertar debe ser menor que el límite de Mantener.
              </p>
            ) : null}

            {allComplete && offerMinIri !== liquidateMaxIri ? (
              <p className="text-xs text-red-600">
                El límite de Liquidar debe coincidir con el inicio de Ofertar.
              </p>
            ) : null}
          </section>

          <Separator />

          {/* EXPLICACIÓN VISUAL */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Cómo se aplicarán estas reglas
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-900">
                  IRI &lt; {displayLiquidate}
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Liquidar</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-900">
                  IRI &gt;= {displayLiquidate} y &lt; {displayHealthy}
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Ofertar</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-900">
                  IRI &gt;= {displayHealthy} y cobertura &gt; {displayDays} días
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Redistribuir</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-900">
                  IRI &gt;= {displayHealthy} y cobertura &lt;= {displayDays} días
                </span>

                <span className="text-slate-400">→</span>

                <span className="text-sm text-slate-600">Mantener</span>
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