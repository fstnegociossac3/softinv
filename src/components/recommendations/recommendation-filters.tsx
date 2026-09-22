"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Building2, CalendarRange, RotateCcw, Search } from "lucide-react";

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
  companies?: CompanyOption[];

  isAdmin?: boolean;

  initialCompanyId?: string;

  initialFrom?: string;

  initialTo?: string;

  initialSearch?: string;

  initialSort?: string;

  initialDirection?: string;
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

export function RecommendationFilters({
  companies = [],
  isAdmin = false,
  initialCompanyId,
  initialFrom,
  initialTo,
  initialSearch,
  initialSort = "stockValue",
  initialDirection = "desc",
}: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [companyId, setCompanyId] = useState(initialCompanyId ?? "");

  const [from, setFrom] = useState(initialFrom ?? "");

  const [to, setTo] = useState(initialTo ?? "");

  const [search, setSearch] = useState(initialSearch ?? "");

  const [sortValue, setSortValue] = useState(
    `${initialSort}:${initialDirection}`,
  );

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
     * Cambio de empresa:
     * removemos filtros derivados.
     */
    if (isAdmin && companyId !== initialCompanyId) {
      params.delete("action");
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

    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    const [sort, direction] = sortValue.split(":");

    params.set("sort", sort);

    params.set("direction", direction);

    /*
     * Cuando cambia un filtro
     * regresamos a página 1.
     */
    params.delete("page");

    router.push(`/recommendations?${params.toString()}`);
  }

  function resetFilters() {
    setCompanyId("");
    setFrom("");
    setTo("");
    setSearch("");
    setSortValue("stockValue:desc");

    router.push("/recommendations");
  }

  return (
    <form
      onSubmit={applyFilters}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div
        className={`grid gap-4 ${
          isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-2"
        }`}
      >
        {/* EMPRESA */}

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

                <SelectValue placeholder="Selecciona una empresa" />
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
          <Label htmlFor="recommendation-from">Desde</Label>

          <Input
            id="recommendation-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>

        {/* HASTA */}

        <div className="space-y-2">
          <Label htmlFor="recommendation-to">Hasta</Label>

          <Input
            id="recommendation-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      </div>

      {/* SEGUNDA FILA */}

      <div className="grid gap-4 lg:grid-cols-[1fr_260px_auto_auto] lg:items-end">
        {/* BUSCAR */}

        <div className="space-y-2">
          <Label htmlFor="recommendation-search">Buscar producto</Label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <Input
              id="recommendation-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="SKU, producto, marca, categoría..."
              className="pl-9"
            />
          </div>
        </div>

        {/* ORDEN */}

        <div className="space-y-2">
          <Label>Ordenar por</Label>

          <Select
            value={sortValue}
            onValueChange={(value) => setSortValue(String(value))}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="stockValue:desc">Mayor capital</SelectItem>

              <SelectItem value="stockValue:asc">Menor capital</SelectItem>

              <SelectItem value="iri:desc">Mayor IRI</SelectItem>

              <SelectItem value="iri:asc">Menor IRI</SelectItem>

              <SelectItem value="stock:desc">Mayor stock</SelectItem>

              <SelectItem value="coverage:desc">Mayor cobertura</SelectItem>

              <SelectItem value="potentialRotation:desc">
                Mayor rotación potencial
              </SelectItem>

              <SelectItem value="sku:asc">SKU A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" size="lg">
          <CalendarRange className="size-4" />
          Aplicar
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={resetFilters}
        >
          <RotateCcw className="size-4" />
          Limpiar
        </Button>
      </div>

      {/* INFORMACIÓN */}

      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        {periodDays ? (
          <span>
            Periodo: <strong>{periodDays} días</strong>
          </span>
        ) : (
          <span>Sin fechas se utilizarán los últimos 90 días.</span>
        )}

        <span>•</span>

        <span>Máximo 180 días</span>
      </div>
    </form>
  );
}
