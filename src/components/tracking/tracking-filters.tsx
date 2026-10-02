"use client";

import { useState, type FormEvent } from "react";

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
  isAdmin?: boolean;

  companies?: CompanyOption[];

  initialCompanyId?: string;

  initialFrom?: string;

  initialTo?: string;

  initialSearch?: string;
};

export function TrackingFilters({
  isAdmin = false,
  companies = [],
  initialCompanyId,
  initialFrom,
  initialTo,
  initialSearch,
}: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [companyId, setCompanyId] = useState(initialCompanyId ?? "");

  const [from, setFrom] = useState(initialFrom ?? "");

  const [to, setTo] = useState(initialTo ?? "");

  const [search, setSearch] = useState(initialSearch ?? "");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isAdmin && !companyId) {
      toast.error("Selecciona una empresa.");

      return;
    }

    if (from && to && from > to) {
      toast.error("La fecha Desde no puede ser posterior a Hasta.");

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

    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    /*
     * Al modificar filtros:
     * regresar a página 1.
     */
    params.delete("page");

    router.push(`/tracking?${params.toString()}`);
  }

  function clear() {
    setCompanyId("");
    setFrom("");
    setTo("");
    setSearch("");

    router.push("/tracking");
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div
        className={`grid gap-4 ${
          isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"
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
          <Label htmlFor="tracking-from">Desde</Label>

          <Input
            id="tracking-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>

        {/* HASTA */}

        <div className="space-y-2">
          <Label htmlFor="tracking-to">Hasta</Label>

          <Input
            id="tracking-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>

        {/* BUSCAR */}

        <div className="space-y-2">
          <Label htmlFor="tracking-search">Buscar</Label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <Input
              id="tracking-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="SKU o producto..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={clear}>
          <RotateCcw className="size-4" />
          Limpiar
        </Button>

        <Button type="submit">
          <CalendarRange className="size-4" />
          Aplicar filtros
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        El periodo se aplica a la fecha límite de las acciones.
      </p>
    </form>
  );
}
