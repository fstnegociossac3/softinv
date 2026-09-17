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

import { CompanyForm } from "./company-form";

import { createCompanyAction } from "@/server/actions/company.actions";

export function CreateCompanyDialog() {
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
      const result = await createCompanyAction(formData);

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
            Nueva empresa
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>

          <DialogDescription>
            Registra una nueva empresa en RecuperaStock AI.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
          <CompanyForm disabled={isPending} errors={fieldErrors} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Crear empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
