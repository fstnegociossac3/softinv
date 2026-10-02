"use client";

import { useState, useTransition } from "react";

import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  addTrackingNoteAction,
  executeTrackingActionAction,
  updateTrackingDueDateAction,
} from "@/server/actions/tracking.actions";

type Props = {
  trackingActionId: string;

  status: "pending" | "executed" | "overdue";

  dueDate: string;
};

export function TrackingActionManager({
  trackingActionId,
  status,
  dueDate: initialDueDate,
}: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [dueDate, setDueDate] = useState(initialDueDate);

  const [note, setNote] = useState("");

  /*
  |--------------------------------------------------------------------------
  | EJECUTAR
  |--------------------------------------------------------------------------
  */

  function execute() {
    startTransition(async () => {
      const result = await executeTrackingActionAction({
        trackingActionId,
      });

      if (!result.success) {
        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      router.refresh();
    });
  }

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR FECHA
  |--------------------------------------------------------------------------
  */

  function updateDate() {
    if (!dueDate) {
      toast.error("Selecciona una fecha.");

      return;
    }

    startTransition(async () => {
      const result = await updateTrackingDueDateAction({
        trackingActionId,
        dueDate,
      });

      if (!result.success) {
        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      router.refresh();
    });
  }

  /*
  |--------------------------------------------------------------------------
  | NOTA
  |--------------------------------------------------------------------------
  */

  function addNote() {
    if (!note.trim()) {
      toast.error("Escribe una observación.");

      return;
    }

    startTransition(async () => {
      const result = await addTrackingNoteAction({
        trackingActionId,
        note,
      });

      if (!result.success) {
        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      setNote("");

      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* EJECUTAR */}

      {status !== "executed" ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />

            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">
                Marcar como ejecutada
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Utiliza esta opción cuando la acción recomendada haya sido
                completada.
              </p>

              <Button className="mt-4" disabled={isPending} onClick={execute}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Marcar ejecutada
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* FECHA */}

      {status !== "executed" ? (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-[#12365A]" />

            <h3 className="font-semibold text-slate-900">Fecha límite</h3>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="tracking-due-date">Nueva fecha</Label>

              <Input
                id="tracking-due-date"
                type="date"
                className="mt-2"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <Button
              variant="outline"
              className="sm:self-end"
              disabled={isPending}
              onClick={updateDate}
            >
              Actualizar fecha
            </Button>
          </div>
        </div>
      ) : null}

      {/* OBSERVACIÓN */}

      <div className="space-y-3 rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="size-5 text-[#12365A]" />

          <h3 className="font-semibold text-slate-900">Agregar observación</h3>
        </div>

        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Escribe una observación sobre el seguimiento..."
          rows={4}
        />

        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled={isPending || !note.trim()}
            onClick={addNote}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="size-4" />
            )}
            Agregar observación
          </Button>
        </div>
      </div>
    </div>
  );
}
