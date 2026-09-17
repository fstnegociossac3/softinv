"use client";

import { useState, useTransition } from "react";

import { Plus } from "lucide-react";

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

import { UserForm } from "./user-form";

import { createUserAction } from "@/server/actions/user.actions";

type CompanyOption = {
  id: string;
  name: string;
};

type Props = {
  companies: CompanyOption[];
};

export function CreateUserDialog({ companies }: Props) {
  const [open, setOpen] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [isPending, startTransition] = useTransition();

  function handleOpenChange(value: boolean) {
    setOpen(value);

    if (!value) {
      setFieldErrors({});
    }
  }

  function handleSubmit(formData: FormData) {
    setFieldErrors({});

    startTransition(async () => {
      const result = await createUserAction(formData);

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});

        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      setFieldErrors({});
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 size-4" />
            Nuevo usuario
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>

          <DialogDescription>
            Crea una cuenta y asígnala a una empresa.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
          <UserForm
            companies={companies}
            disabled={isPending}
            errors={fieldErrors}
            mode="create"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isPending || companies.length === 0}
            >
              {isPending ? "Creando..." : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
