"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { updateUserEmailAction } from "@/server/actions/user.actions";

type User = {
  id: string;
  fullName: string;
  email: string | null;
};

type Props = {
  user: User;

  open: boolean;

  onOpenChange: (open: boolean) => void;
};

export function UserEmailDialog({ user, open, onOpenChange }: Props) {
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  function handleOpenChange(value: boolean) {
    if (!value) {
      setError(null);
    }

    onOpenChange(value);
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const result = await updateUserEmailAction(user.id, formData);

      if (!result.success) {
        setError(result.fieldErrors?.email?.[0] ?? result.message);

        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      setError(null);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar correo</DialogTitle>

          <DialogDescription>
            Actualiza el correo de {user.fullName}.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>

            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email ?? ""}
              disabled={isPending}
              required
              autoComplete="email"
              placeholder="usuario@empresa.com"
              aria-invalid={Boolean(error)}
            />

            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>

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
              {isPending ? "Actualizando..." : "Actualizar correo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
