"use client";

import { useMemo, useState, type FormEvent } from "react";

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

type IriFiltersProps = {
  companies?: CompanyOption[];

  isAdmin?: boolean;

  initialCompanyId?: string;

  initialFrom?: string;

  initialTo?: string;
};

function calculatePeriodDays(from: string, to: string) {
  if (!from || !to) {
    return null;
  }

  const fromDate = new Date(`${from}T00:00:00`);

  const toDate = new Date(`${to}T00:00:00`);

  if (
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(toDate.getTime()) ||
    fromDate > toDate
  ) {
    return null;
  }

  const dayMs = 24 * 60 * 60 * 1000;

  return Math.floor((toDate.getTime() - fromDate.getTime()) / dayMs) + 1;
}

export function IriFilters({
  companies = [],
  isAdmin = false,
  initialCompanyId,
  initialFrom,
  initialTo,
}: IriFiltersProps) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [companyId, setCompanyId] = useState(initialCompanyId ?? "");

  const [from, setFrom] = useState(initialFrom ?? "");

  const [to, setTo] = useState(initialTo ?? "");

  const periodDays = useMemo(() => calculatePeriodDays(from, to), [from, to]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();

    if (isAdmin && !companyId) {
      toast.error("Selecciona una empresa.");

      return;
    }

    if (from && to && !periodDays) {
      toast.error("El rango de fechas no es válido.");

      return;
    }

    if (periodDays && periodDays > 180) {
      toast.error("El periodo máximo de análisis es de 180 días.");

      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    /*
     * Si el administrador cambia
     * de empresa eliminamos el SKU
     * seleccionado.
     */
    if (isAdmin && companyId !== initialCompanyId) {
      params.delete("skuId");
    }

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

    router.push(`/iri?${params.toString()}`);
  }

  function resetFilters() {
    setCompanyId("");
    setFrom("");
    setTo("");

    router.push("/iri");
  }

  return (
    <form
      onSubmit={applyFilters}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
        {/* EMPRESA */}

        {isAdmin ? (
          <div className="space-y-2">
            <Label>Empresa</Label>

            <Select
              value={companyId || "none"}
              onValueChange={(value) =>
                setCompanyId(!value || value === "none" ? "" : value)
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

        {/* DESDE */}

        <div className="space-y-2">
          <Label htmlFor="iri-from">Desde</Label>

          <Input
            id="iri-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>

        {/* HASTA */}

        <div className="space-y-2">
          <Label htmlFor="iri-to">Hasta</Label>

          <Input
            id="iri-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>

        {/* APLICAR */}

        <Button type="submit">
          <CalendarRange className="mr-2 size-4" />
          Aplicar
        </Button>

        {/* LIMPIAR */}

        <Button type="button" variant="outline" onClick={resetFilters}>
          <RotateCcw className="mr-2 size-4" />
          Limpiar
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {periodDays ? (
          <span>
            Periodo seleccionado: <strong>{periodDays} días</strong>
          </span>
        ) : (
          <span>
            Si no seleccionas fechas, se analizarán los últimos 90 días.
          </span>
        )}

        <span>• Máximo 180 días</span>
      </div>
    </form>
  );
}
