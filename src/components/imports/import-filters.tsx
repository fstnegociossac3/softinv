"use client";

import type { FormEvent } from "react";

import { useState } from "react";

import { Search, X } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

type Company = {
  id: string;
  name: string;
};

type Props = {
  companies: Company[];
  showCompanyFilter: boolean;
};

export function ImportFilters({ companies, showCompanyFilter }: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function update(values: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(values)) {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    params.delete("page");

    const query = params.toString();

    router.push(query ? `/imports?${query}` : "/imports");
  }

  function submit(event: FormEvent) {
    event.preventDefault();

    update({
      search: search.trim() || undefined,
    });
  }

  function clear() {
    setSearch("");
    router.push("/imports");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 xl:flex-row">
      <form onSubmit={submit} className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar archivo..."
            className="pl-9"
          />
        </div>

        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <select
        className="h-9 rounded-md border bg-background px-3 text-sm"
        value={searchParams.get("status") ?? "all"}
        onChange={(event) =>
          update({
            status: event.target.value,
          })
        }
      >
        <option value="all">Todos los estados</option>

        <option value="uploaded">Pendiente de mapeo</option>

        <option value="validating">Validando</option>

        <option value="ready">Lista</option>

        <option value="processed">Procesada</option>

        <option value="failed">Con errores</option>
      </select>

      {showCompanyFilter && (
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={searchParams.get("companyId") ?? "all"}
          onChange={(event) =>
            update({
              companyId: event.target.value,
            })
          }
        >
          <option value="all">Todas las empresas</option>

          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      )}

      <Button variant="ghost" onClick={clear}>
        <X className="mr-2 size-4" />
        Limpiar
      </Button>
    </div>
  );
}
