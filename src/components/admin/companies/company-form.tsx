"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CompanyFormValues = {
  name?: string;
  ruc?: string | null;
  sector?: string | null;
  address?: string | null;
  country?: string;
  timezone?: string;
  currency?: string;
};

type CompanyFormProps = {
  defaultValues?: CompanyFormValues;

  disabled?: boolean;

  errors?: Record<string, string[]>;
};

export function CompanyForm({
  defaultValues,
  disabled = false,
  errors,
}: CompanyFormProps) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">Razón social *</Label>

        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name ?? ""}
          disabled={disabled}
          required
          maxLength={200}
          placeholder="Ej. Repuestos del Norte S.A.C."
          aria-invalid={Boolean(errors?.name)}
        />

        {errors?.name?.[0] ? (
          <p className="text-xs text-destructive">{errors.name[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="ruc">RUC</Label>

          <Input
            id="ruc"
            name="ruc"
            defaultValue={defaultValues?.ruc ?? ""}
            disabled={disabled}
            inputMode="numeric"
            maxLength={11}
            placeholder="20123456789"
            aria-invalid={Boolean(errors?.ruc)}
          />

          {errors?.ruc?.[0] ? (
            <p className="text-xs text-destructive">{errors.ruc[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sector">Sector</Label>

          <Input
            id="sector"
            name="sector"
            defaultValue={defaultValues?.sector ?? ""}
            disabled={disabled}
            maxLength={150}
            placeholder="Automotriz"
            aria-invalid={Boolean(errors?.sector)}
          />

          {errors?.sector?.[0] ? (
            <p className="text-xs text-destructive">{errors.sector[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">Dirección</Label>

        <Input
          id="address"
          name="address"
          defaultValue={defaultValues?.address ?? ""}
          disabled={disabled}
          placeholder="Dirección de la empresa"
          aria-invalid={Boolean(errors?.address)}
        />

        {errors?.address?.[0] ? (
          <p className="text-xs text-destructive">{errors.address[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="country">País</Label>

          <Input
            id="country"
            name="country"
            defaultValue={defaultValues?.country ?? "Perú"}
            disabled={disabled}
            aria-invalid={Boolean(errors?.country)}
          />

          {errors?.country?.[0] ? (
            <p className="text-xs text-destructive">{errors.country[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="timezone">Zona horaria</Label>

          <Input
            id="timezone"
            name="timezone"
            defaultValue={defaultValues?.timezone ?? "America/Lima"}
            disabled={disabled}
            aria-invalid={Boolean(errors?.timezone)}
          />

          {errors?.timezone?.[0] ? (
            <p className="text-xs text-destructive">{errors.timezone[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="currency">Moneda</Label>

          <Input
            id="currency"
            name="currency"
            defaultValue={defaultValues?.currency ?? "PEN"}
            disabled={disabled}
            maxLength={3}
            aria-invalid={Boolean(errors?.currency)}
          />

          {errors?.currency?.[0] ? (
            <p className="text-xs text-destructive">{errors.currency[0]}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
