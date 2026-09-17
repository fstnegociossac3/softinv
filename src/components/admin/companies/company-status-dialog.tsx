"use client";

import { useTransition } from "react";

import { toast } from "sonner";

/* import { Button } from "@/components/ui/button"; */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { changeCompanyStatusAction } from "@/server/actions/company.actions";

type Props = {
  company: {
    id: string;
    name: string;

    status: "active" | "inactive";
  };

  open: boolean;

  onOpenChange: (open: boolean) => void;
};

export function CompanyStatusDialog({ company, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();

  const activating = company.status === "inactive";

  function handleConfirm() {
    startTransition(async () => {
      const result = await changeCompanyStatusAction(
        company.id,
        activating ? "active" : "inactive",
      );

      if (!result.success) {
        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      onOpenChange(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {activating ? "¿Activar empresa?" : "¿Desactivar empresa?"}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {activating
              ? `La empresa ${company.name} volverá a estar disponible para sus usuarios.`
              : `Los usuarios asociados a ${company.name} dejarán de poder operar mientras la empresa permanezca inactiva.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>

          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();

              handleConfirm();
            }}
          >
            {isPending
              ? "Procesando..."
              : activating
                ? "Activar"
                : "Desactivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
