"use client";

import { useState, useTransition, type FormEvent } from "react";

import { CalendarClock, ClipboardCheck, Loader2 } from "lucide-react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createTrackingActionAction } from "@/server/actions/tracking.actions";

type Props = {
  /*
   * ID real de inventory_items.
   */
  inventoryItemId: string;

  sku: string;

  description: string;

  recommendationLabel: string;

  iri: number;

  stockValue: number;

  /*
   * ADMIN:
   * empresa seleccionada.
   *
   * USER:
   * undefined.
   */
  companyId?: string;

  /*
   * Periodo utilizado para
   * generar la recomendación.
   */
  from: string;

  to: string;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

export function CreateTrackingDialog({
  inventoryItemId,
  sku,
  description,
  recommendationLabel,
  iri,
  stockValue,
  companyId,
  from,
  to,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [dueDate, setDueDate] = useState("");

  const [notes, setNotes] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [isPending, startTransition] = useTransition();

  /*
  |--------------------------------------------------------------------------
  | CERRAR / ABRIR
  |--------------------------------------------------------------------------
  */

  function handleOpenChange(value: boolean) {
    setOpen(value);

    /*
     * Limpiar formulario
     * al cerrar.
     */
    if (!value) {
      setDueDate("");
      setNotes("");
      setFieldErrors({});
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CREAR SEGUIMIENTO
  |--------------------------------------------------------------------------
  */

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFieldErrors({});

    if (!dueDate) {
      setFieldErrors({
        dueDate: ["Selecciona una fecha límite."],
      });

      return;
    }

    startTransition(async () => {
      /*
       * IMPORTANTE:
       *
       * NO enviamos:
       *
       * - IRI
       * - recomendación
       * - stock
       * - valor
       *
       * El backend vuelve a
       * calcular esos valores.
       */
      const result = await createTrackingActionAction({
        companyId,

        inventoryItemId,

        from,

        to,

        dueDate,

        notes: notes.trim() || undefined,
      });

      /*
        |--------------------------------------------------------------------------
        | ERROR
        |--------------------------------------------------------------------------
        */

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});

        toast.error(result.message);

        return;
      }

      /*
        |--------------------------------------------------------------------------
        | CORRECTO
        |--------------------------------------------------------------------------
        */

      toast.success(result.message);

      setOpen(false);

      /*
       * Vamos directamente
       * al seguimiento creado.
       */
      if (result.data?.id) {
        router.push(`/tracking/${result.data.id}`);

        return;
      }

      router.push("/tracking");

      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* ================================================================
          TRIGGER BASE UI
      ================================================================= */}

      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <ClipboardCheck className="size-4" />
            Dar seguimiento
          </Button>
        }
      />

      {/* ================================================================
          MODAL
      ================================================================= */}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear seguimiento</DialogTitle>

          <DialogDescription>
            Registra esta recomendación como una acción para realizar
            seguimiento.
          </DialogDescription>
        </DialogHeader>

        {/* ================================================================
            RESUMEN SKU
        ================================================================= */}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{sku}</p>

              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>

            <div className="shrink-0 rounded-lg bg-[#12365A] px-3 py-2 text-center text-white">
              <p className="text-[10px] uppercase tracking-wider text-white/70">
                IRI
              </p>

              <p className="font-bold">{iri}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400">Recomendación</p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {recommendationLabel}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Capital asociado</p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {currencyFormatter.format(stockValue)}
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================
            FORMULARIO
        ================================================================= */}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* FECHA */}

          <div className="space-y-2">
            <Label htmlFor={`tracking-date-${inventoryItemId}`}>
              Fecha límite *
            </Label>

            <div className="relative">
              <CalendarClock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <Input
                id={`tracking-date-${inventoryItemId}`}
                type="date"
                value={dueDate}
                disabled={isPending}
                onChange={(event) => setDueDate(event.target.value)}
                aria-invalid={Boolean(fieldErrors.dueDate?.length)}
                className="pl-9"
              />
            </div>

            {fieldErrors.dueDate?.[0] ? (
              <p className="text-xs text-red-600">{fieldErrors.dueDate[0]}</p>
            ) : (
              <p className="text-xs text-slate-400">
                Define hasta qué fecha debe ejecutarse la acción.
              </p>
            )}
          </div>

          {/* OBSERVACIONES */}

          <div className="space-y-2">
            <Label htmlFor={`tracking-notes-${inventoryItemId}`}>
              Observación
            </Label>

            <Textarea
              id={`tracking-notes-${inventoryItemId}`}
              value={notes}
              disabled={isPending}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej.: Coordinar campaña comercial con el área de ventas..."
              rows={4}
              maxLength={2000}
              aria-invalid={Boolean(fieldErrors.notes?.length)}
            />

            <div className="flex items-center justify-between">
              {fieldErrors.notes?.[0] ? (
                <p className="text-xs text-red-600">{fieldErrors.notes[0]}</p>
              ) : (
                <p className="text-xs text-slate-400">Opcional</p>
              )}

              <p className="text-xs text-slate-400">
                {notes.length}
                /2000
              </p>
            </div>
          </div>

          {/* PERIODO */}

          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-400">Periodo de análisis</p>

            <p className="mt-0.5 text-sm font-medium text-slate-700">
              {from}
              {" — "}
              {to}
            </p>
          </div>

          {/* BOTONES */}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={isPending || !dueDate}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <ClipboardCheck className="size-4" />
                  Crear seguimiento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
