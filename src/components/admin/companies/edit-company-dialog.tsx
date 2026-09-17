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

import { CompanyForm } from "./company-form";

import { updateCompanyAction } from "@/server/actions/company.actions";

type Company = {
  id: string;
  name: string;
  ruc: string | null;
  sector: string | null;
  address: string | null;
  country: string;
  timezone: string;
  currency: string;
};

type Props = {
  company: Company;

  open: boolean;

  onOpenChange: (open: boolean) => void;
};

export function EditCompanyDialog({ company, open, onOpenChange }: Props) {
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
      const result = await updateCompanyAction(company.id, formData);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar empresa</DialogTitle>

          <DialogDescription>
            Actualiza la información de {company.name}.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
          <CompanyForm
            disabled={isPending}
            defaultValues={company}
            errors={fieldErrors}
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
