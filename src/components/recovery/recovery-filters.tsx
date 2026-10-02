"use client";

import { useState, type FormEvent } from "react";

import { Building2, CalendarRange, RotateCcw } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

type Props = {
  isAdmin?: boolean;

  companies?: CompanyOption[];

  initialCompanyId?: string;

  initialFrom?: string;

  initialTo?: string;
};

function countDays(from: string, to: string) {
  if (!from || !to) {
    return null;
  }

  const start = new Date(`${from}T00:00:00`);

  const end = new Date(`${to}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return null;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function RecoveryFilters({
  isAdmin = false,
  companies = [],
  initialCompanyId,
  initialFrom,
  initialTo,
}: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [companyId, setCompanyId] = useState(initialCompanyId ?? "");

  const [from, setFrom] = useState(initialFrom ?? "");

  const [to, setTo] = useState(initialTo ?? "");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isAdmin && !companyId) {
      toast.error("Selecciona una empresa.");

      return;
    }

    const days = countDays(from, to);

    if (from && to && !days) {
      toast.error("El rango de fechas no es válido.");

      return;
    }

    if (days && days > 180) {
      toast.error("El periodo máximo es de 180 días.");

      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (isAdmin && companyId) {
      params.set("companyId", companyId);
    } else {
      params.delete("companyId");
    }

    if (from) {
      params.set("from", from);
    } else {
      params.delete("from");
    }

    if (to) {
      params.set("to", to);
    } else {
      params.delete("to");
    }

    params.delete("page");

    router.push(`/recovery?${params.toString()}`);
  }

  function clear() {
    setCompanyId("");
    setFrom("");
    setTo("");

    router.push("/recovery");
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div
        className={`grid gap-4 ${
          isAdmin
            ? "lg:grid-cols-[1.4fr_1fr_1fr_auto_auto]"
            : "lg:grid-cols-[1fr_1fr_auto_auto]"
        } lg:items-end`}
      >
        {isAdmin ? (
          <div className="space-y-2">
            <Label>Empresa</Label>

            <Select
              value={companyId || "none"}
              onValueChange={(value) =>
                setCompanyId(value === "none" ? "" : String(value))
              }
            >
              <SelectTrigger className="h-10 w-full">
                <Building2 className="mr-2 size-4 text-slate-400" />

                <SelectValue placeholder="Selecciona empresa" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">Selecciona empresa</SelectItem>

                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="recovery-from">Desde</Label>

          <Input
            id="recovery-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recovery-to">Hasta</Label>

          <Input
            id="recovery-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>

        <Button type="submit">
          <CalendarRange className="size-4" />
          Aplicar
        </Button>

        <Button type="button" variant="outline" onClick={clear}>
          <RotateCcw className="size-4" />
          Limpiar
        </Button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Si no seleccionas fechas se utilizará el mes actual hasta hoy. Máximo
        180 días.
      </p>
    </form>
  );
}
