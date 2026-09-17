"use client";

import type { FormEvent } from "react";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CompanyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const status = searchParams.get("status") ?? "all";

  function updateParams(values: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(values).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    params.delete("page");

    const query = params.toString();

    router.push(query ? `/admin/companies?${query}` : "/admin/companies");
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateParams({
      search: search.trim() || undefined,
    });
  }

  function clearFilters() {
    setSearch("");

    router.push("/admin/companies");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-center">
      <form onSubmit={handleSearch} className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar empresa o RUC..."
            className="pl-9"
          />
        </div>

        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <Select
        value={status}
        onValueChange={(value) =>
          updateParams({
            status: !value || value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>

          <SelectItem value="active">Activas</SelectItem>

          <SelectItem value="inactive">Inactivas</SelectItem>
        </SelectContent>
      </Select>

      <Button type="button" variant="ghost" onClick={clearFilters}>
        <X className="mr-2 size-4" />
        Limpiar
      </Button>
    </div>
  );
}
