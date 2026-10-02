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

import { updateNotificationSettingsAction } from "@/server/actions/settings.actions";

import type { NotificationSettingsConfig } from "@/lib/settings/types";

type Props = {
  companyId: string;

  initialConfig: NotificationSettingsConfig;
};

type NotificationFormValues = {
  trackingDueEnabled: boolean;

  trackingDueDays: string;

  trackingOverdueEnabled: boolean;

  recoveryPendingEnabled: boolean;

  recoveryPendingDays: string;
};

function parseNumber(raw: string) {
  return raw.trim() === "" ? Number.NaN : Number(raw);
}

export function NotificationSettingsForm({
  companyId,
  initialConfig,
}: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState<NotificationFormValues>({
    trackingDueEnabled: initialConfig.trackingDueEnabled,

    trackingDueDays: String(initialConfig.trackingDueDays),

    trackingOverdueEnabled: initialConfig.trackingOverdueEnabled,

    recoveryPendingEnabled: initialConfig.recoveryPendingEnabled,

    recoveryPendingDays: String(initialConfig.recoveryPendingDays),
  });

  /*
  |--------------------------------------------------------------------------
  | VALIDACIÓN
  |--------------------------------------------------------------------------
  */

  const trackingDueDays = parseNumber(values.trackingDueDays);

  const trackingDueComplete = !Number.isNaN(trackingDueDays);

  const trackingDueDaysValid =
    trackingDueComplete &&
    Number.isInteger(trackingDueDays) &&
    trackingDueDays >= 1 &&
    trackingDueDays <= 90;

  const trackingDueDaysHasError = trackingDueComplete && !trackingDueDaysValid;

  const recoveryPendingDays = parseNumber(values.recoveryPendingDays);

  const recoveryPendingComplete = !Number.isNaN(recoveryPendingDays);

  const recoveryPendingDaysValid =
    recoveryPendingComplete &&
    Number.isInteger(recoveryPendingDays) &&
    recoveryPendingDays >= 1 &&
    recoveryPendingDays <= 180;

  const recoveryPendingDaysHasError =
    recoveryPendingComplete && !recoveryPendingDaysValid;

  const canSave = trackingDueDaysValid && recoveryPendingDaysValid;

  const displayTrackingDays = trackingDueComplete ? trackingDueDays : "—";

  const displayRecoveryDays = recoveryPendingComplete
    ? recoveryPendingDays
    : "—";

  /*
  |--------------------------------------------------------------------------
  | ACCIONES
  |--------------------------------------------------------------------------
  */

  function updateField<K extends keyof NotificationFormValues>(
    key: K,

    value: NotificationFormValues[K],
  ) {
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
      const result = await updateNotificationSettingsAction({
        companyId,

        config: {
          trackingDueEnabled: values.trackingDueEnabled,

          trackingDueDays,

          trackingOverdueEnabled: values.trackingOverdueEnabled,

          recoveryPendingEnabled: values.recoveryPendingEnabled,

          recoveryPendingDays,
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
          Configuración de notificaciones

          <Badge variant="secondary">Notificaciones</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SEGUIMIENTO */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Notificaciones de seguimiento
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Define cuándo se debe avisar sobre las acciones de seguimiento.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                id="notification-tracking-due-enabled"
                type="checkbox"
                checked={values.trackingDueEnabled}
                onChange={(event) =>
                  updateField(
                    "trackingDueEnabled",
                    event.target.checked,
                  )
                }
                disabled={isPending}
                className="mt-0.5 size-4 accent-[#12365A]"
              />

              <div className="grid gap-1">
                <Label
                  htmlFor="notification-tracking-due-enabled"
                  className="text-slate-900"
                >
                  Avisar acciones próximas a vencer
                </Label>

                <p className="text-xs text-muted-foreground">
                  Recibe avisos antes de que una acción de seguimiento alcance
                  su fecha límite.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notification-tracking-due-days">
                Días de anticipación
              </Label>

              <div className="relative">
                <Input
                  id="notification-tracking-due-days"
                  type="number"
                  min={1}
                  max={90}
                  step={1}
                  value={values.trackingDueDays}
                  onChange={(event) =>
                    updateField("trackingDueDays", event.target.value)
                  }
                  disabled={isPending || !values.trackingDueEnabled}
                  className="max-w-32 pr-14"
                />

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                  días
                </span>
              </div>

              {trackingDueDaysHasError ? (
                <p className="text-xs text-red-600">
                  Los días de anticipación deben ser un número entero entre 1 y
                  90.
                </p>
              ) : null}
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                id="notification-tracking-overdue-enabled"
                type="checkbox"
                checked={values.trackingOverdueEnabled}
                onChange={(event) =>
                  updateField(
                    "trackingOverdueEnabled",
                    event.target.checked,
                  )
                }
                disabled={isPending}
                className="mt-0.5 size-4 accent-[#12365A]"
              />

              <div className="grid gap-1">
                <Label
                  htmlFor="notification-tracking-overdue-enabled"
                  className="text-slate-900"
                >
                  Avisar acciones vencidas
                </Label>

                <p className="text-xs text-muted-foreground">
                  Permite identificar acciones cuya fecha límite ya fue
                  superada.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* RECUPERACIÓN */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Notificaciones de recuperación
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Define cuándo se debe avisar sobre las recuperaciones
                pendientes.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                id="notification-recovery-pending-enabled"
                type="checkbox"
                checked={values.recoveryPendingEnabled}
                onChange={(event) =>
                  updateField(
                    "recoveryPendingEnabled",
                    event.target.checked,
                  )
                }
                disabled={isPending}
                className="mt-0.5 size-4 accent-[#12365A]"
              />

              <div className="grid gap-1">
                <Label
                  htmlFor="notification-recovery-pending-enabled"
                  className="text-slate-900"
                >
                  Avisar recuperaciones pendientes
                </Label>

                <p className="text-xs text-muted-foreground">
                  Permite identificar acciones ejecutadas que todavía no
                  registran recuperación.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notification-recovery-pending-days">
                Días sin recuperación
              </Label>

              <div className="relative">
                <Input
                  id="notification-recovery-pending-days"
                  type="number"
                  min={1}
                  max={180}
                  step={1}
                  value={values.recoveryPendingDays}
                  onChange={(event) =>
                    updateField("recoveryPendingDays", event.target.value)
                  }
                  disabled={isPending || !values.recoveryPendingEnabled}
                  className="max-w-32 pr-14"
                />

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                  días
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Permite identificar acciones ejecutadas que todavía no registran
                recuperación después del periodo indicado.
              </p>

              {recoveryPendingDaysHasError ? (
                <p className="text-xs text-red-600">
                  Los días sin recuperación deben ser un número entero entre 1 y
                  180.
                </p>
              ) : null}
            </div>
          </section>

          <Separator />

          {/* RESUMEN */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Resumen de alertas
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">
                  Seguimiento próximo a vencer
                </p>

                <p
                  className={
                    values.trackingDueEnabled
                      ? "text-xs font-medium text-emerald-600"
                      : "text-xs font-medium text-slate-500"
                  }
                >
                  {values.trackingDueEnabled
                    ? `Activo · ${displayTrackingDays} días antes`
                    : "Desactivado"}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">
                  Seguimiento vencido
                </p>

                <p
                  className={
                    values.trackingOverdueEnabled
                      ? "text-xs font-medium text-emerald-600"
                      : "text-xs font-medium text-slate-500"
                  }
                >
                  {values.trackingOverdueEnabled ? "Activo" : "Desactivado"}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">
                  Recuperación pendiente
                </p>

                <p
                  className={
                    values.recoveryPendingEnabled
                      ? "text-xs font-medium text-emerald-600"
                      : "text-xs font-medium text-slate-500"
                  }
                >
                  {values.recoveryPendingEnabled
                    ? `Activo · después de ${displayRecoveryDays} días`
                    : "Desactivado"}
                </p>
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