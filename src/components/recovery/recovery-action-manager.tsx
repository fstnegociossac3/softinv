"use client";

import { useState, useTransition } from "react";

import { CheckCircle2, CircleX, Loader2, PlusCircle } from "lucide-react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import {
  closeRecoveryCaseAction,
  registerRecoveryEventAction,
} from "@/server/actions/recovery.actions";

type Props = {
  recoveryCaseId: string;

  status: "pending" | "in_progress" | "recovered" | "unrecovered";

  pendingUnits: number;
};

export function RecoveryActionManager({
  recoveryCaseId,
  status,
  pendingUnits,
}: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [quantity, setQuantity] = useState("");

  const [recoveredValue, setRecoveredValue] = useState("");

  const [recoveryDate, setRecoveryDate] = useState("");

  const [notes, setNotes] = useState("");

  const closed = status === "recovered" || status === "unrecovered";

  function registerEvent() {
    const parsedQuantity = Number(quantity);

    const parsedValue = Number(recoveredValue);

    if (!parsedQuantity || parsedQuantity <= 0) {
      toast.error("Ingresa una cantidad válida.");

      return;
    }

    if (parsedQuantity > pendingUnits) {
      toast.error(
        `No puedes recuperar más de ${pendingUnits} unidades pendientes.`,
      );

      return;
    }

    if (!parsedValue || parsedValue <= 0) {
      toast.error("Ingresa el capital recuperado.");

      return;
    }

    if (!recoveryDate) {
      toast.error("Selecciona la fecha de recuperación.");

      return;
    }

    startTransition(async () => {
      const result = await registerRecoveryEventAction({
        recoveryCaseId,

        quantity: parsedQuantity,

        recoveredValue: parsedValue,

        recoveryDate,

        notes: notes.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      setQuantity("");
      setRecoveredValue("");
      setRecoveryDate("");
      setNotes("");

      router.refresh();
    });
  }

  function closeCase(finalStatus: "recovered" | "unrecovered") {
    startTransition(async () => {
      const result = await closeRecoveryCaseAction({
        recoveryCaseId,

        status: finalStatus,
      });

      if (!result.success) {
        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      router.refresh();
    });
  }

  if (closed) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
        <CheckCircle2 className="mx-auto size-8 text-slate-400" />

        <p className="mt-3 font-semibold text-slate-800">Caso cerrado</p>

        <p className="mt-1 text-sm text-slate-500">
          Este caso ya no admite nuevos eventos de recuperación.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-900">Registrar recuperación</h3>

        <p className="mt-1 text-sm text-slate-500">
          Registra unidades y dinero realmente recuperado.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recovery-quantity">Unidades recuperadas</Label>

        <Input
          id="recovery-quantity"
          type="number"
          min="0"
          step="0.0001"
          value={quantity}
          disabled={isPending}
          onChange={(event) => setQuantity(event.target.value)}
          placeholder={`Máximo ${pendingUnits}`}
        />

        <p className="text-xs text-slate-400">Pendientes: {pendingUnits}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recovered-value">Capital recuperado</Label>

        <Input
          id="recovered-value"
          type="number"
          min="0"
          step="0.01"
          value={recoveredValue}
          disabled={isPending}
          onChange={(event) => setRecoveredValue(event.target.value)}
          placeholder="Ej. 2500.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recovery-date">Fecha de recuperación</Label>

        <Input
          id="recovery-date"
          type="date"
          value={recoveryDate}
          disabled={isPending}
          onChange={(event) => setRecoveryDate(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recovery-notes">Observación</Label>

        <Textarea
          id="recovery-notes"
          rows={4}
          maxLength={2000}
          value={notes}
          disabled={isPending}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ej.: Recuperación obtenida mediante campaña comercial..."
        />
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={isPending}
        onClick={registerEvent}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PlusCircle className="size-4" />
        )}
        Registrar recuperación
      </Button>

      <div className="border-t border-slate-200 pt-5">
        <p className="text-sm font-semibold text-slate-800">Cerrar caso</p>

        <p className="mt-1 text-xs text-slate-500">
          Utiliza estas opciones cuando ya no se registrarán más resultados.
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => closeCase("recovered")}
          >
            <CheckCircle2 className="size-4" />
            Cerrar recuperado
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => closeCase("unrecovered")}
          >
            <CircleX className="size-4" />
            Sin recuperación
          </Button>
        </div>
      </div>
    </div>
  );
}
