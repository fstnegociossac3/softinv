"use client";

import { useState, type FormEvent } from "react";

import { Building2, RefreshCw } from "lucide-react";

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

type DashboardFiltersProps = {
  companies?: CompanyOption[];

  isAdmin?: boolean;

  initialCompanyId?: string;

  initialFrom?: string;

  initialTo?: string;
};

export function DashboardFilters({
  companies = [],
  isAdmin = false,
  initialCompanyId,
  initialFrom,
  initialTo,
}: DashboardFiltersProps) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [companyId, setCompanyId] = useState(initialCompanyId ?? "");

  const [from, setFrom] = useState(initialFrom ?? "");

  const [to, setTo] = useState(initialTo ?? "");

  function applyFilters(event: FormEvent) {
    event.preventDefault();

    if (isAdmin && !companyId) {
      toast.error("Selecciona una empresa.");

      return;
    }

    if (from && to && from > to) {
      toast.error("El rango de fechas no es válido.");

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

    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <form
      onSubmit={applyFilters}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div
        className={`grid gap-4 lg:items-end ${
          isAdmin ? "lg:grid-cols-[1fr_1fr_1fr_auto]" : "lg:grid-cols-[1fr_1fr_auto]"
        }`}
      >
        {/* EMPRESA (SOLO ADMIN) */}

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
          <Label htmlFor="dashboard-from">Desde</Label>

          <Input
            id="dashboard-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>

        {/* HASTA */}

        <div className="space-y-2">
          <Label htmlFor="dashboard-to">Hasta</Label>

          <Input
            id="dashboard-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>

        {/* ACTUALIZAR */}

        <Button type="submit">
          <RefreshCw className="mr-2 size-4" />
          Actualizar
        </Button>
      </div>
    </form>
  );
}