"use client";

import { useTransition } from "react";

import { toast } from "sonner";

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

import { changeUserStatusAction } from "@/server/actions/user.actions";

type User = {
  id: string;
  fullName: string;
  status: "active" | "inactive";
};

type Props = {
  user: User;

  open: boolean;

  onOpenChange: (open: boolean) => void;
};

export function UserStatusDialog({ user, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();

  const activating = user.status === "inactive";

  function handleConfirm() {
    startTransition(async () => {
      const result = await changeUserStatusAction(
        user.id,
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
            {activating ? "¿Activar usuario?" : "¿Desactivar usuario?"}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {activating
              ? `${user.fullName} podrá volver a iniciar sesión y utilizar la plataforma.`
              : `${user.fullName} dejará de tener acceso a la plataforma mientras permanezca inactivo.`}
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
