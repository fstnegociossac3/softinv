"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CompanyOption = {
  id: string;
  name: string;
};

type UserFormValues = {
  fullName?: string;
  email?: string | null;
  companyId?: string | null;
};

type UserFormProps = {
  companies: CompanyOption[];

  defaultValues?: UserFormValues;

  disabled?: boolean;

  mode?: "create" | "edit";

  errors?: Record<string, string[]>;
};

export function UserForm({
  companies,
  defaultValues,
  disabled = false,
  mode = "create",
  errors,
}: UserFormProps) {
  return (
    <div className="grid gap-5">
      {/* Nombre */}
      <div className="grid gap-2">
        <Label htmlFor="fullName">Nombre completo *</Label>

        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultValues?.fullName ?? ""}
          disabled={disabled}
          required
          maxLength={200}
          placeholder="Ej. Carlos Ramírez"
          aria-invalid={Boolean(errors?.fullName)}
        />

        {errors?.fullName?.[0] ? (
          <p className="text-xs text-destructive">{errors.fullName[0]}</p>
        ) : null}
      </div>

      {/* Email solo creación */}
      {mode === "create" ? (
        <div className="grid gap-2">
          <Label htmlFor="email">Correo electrónico *</Label>

          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={defaultValues?.email ?? ""}
            disabled={disabled}
            required
            placeholder="usuario@empresa.com"
            aria-invalid={Boolean(errors?.email)}
          />

          {errors?.email?.[0] ? (
            <p className="text-xs text-destructive">{errors.email[0]}</p>
          ) : null}
        </div>
      ) : null}

      {/* Contraseña solo creación */}
      {mode === "create" ? (
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña temporal *</Label>

          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            disabled={disabled}
            required
            minLength={10}
            placeholder="Mínimo 10 caracteres"
            aria-invalid={Boolean(errors?.password)}
          />

          {errors?.password?.[0] ? (
            <p className="text-xs text-destructive">{errors.password[0]}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Debe contener al menos 10 caracteres.
            </p>
          )}
        </div>
      ) : null}

      {/* Empresa */}
      <div className="grid gap-2">
        <Label htmlFor="companyId">Empresa *</Label>

        <Select
          name="companyId"
          defaultValue={defaultValues?.companyId ?? undefined}
          disabled={disabled}
          required
        >
          <SelectTrigger id="companyId" className="w-full">
            <SelectValue placeholder="Selecciona una empresa" />
          </SelectTrigger>

          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {errors?.companyId?.[0] ? (
          <p className="text-xs text-destructive">{errors.companyId[0]}</p>
        ) : null}
      </div>
    </div>
  );
}
