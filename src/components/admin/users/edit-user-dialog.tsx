"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { UserForm } from "./user-form";

import { updateUserAction } from "@/server/actions/user.actions";

type CompanyOption = {
  id: string;
  name: string;
};

type User = {
  id: string;
  fullName: string;
  companyId: string | null;
};

type Props = {
  user: User;

  companies: CompanyOption[];

  open: boolean;

  onOpenChange: (open: boolean) => void;
};

export function EditUserDialog({ user, companies, open, onOpenChange }: Props) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [isPending, startTransition] = useTransition();

  function handleOpenChange(value: boolean) {
    if (!value) {
      setFieldErrors({});
    }

    onOpenChange(value);
  }

  function handleSubmit(formData: FormData) {
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateUserAction(user.id, formData);

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});

        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      setFieldErrors({});

      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>

          <DialogDescription>
            Actualiza los datos de {user.fullName}.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
          <UserForm
            companies={companies}
            disabled={isPending}
            errors={fieldErrors}
            mode="edit"
            defaultValues={{
              fullName: user.fullName,
              companyId: user.companyId,
            }}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
