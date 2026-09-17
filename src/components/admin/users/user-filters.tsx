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

type CompanyOption = {
  id: string;
  name: string;
};

type Props = {
  companies: CompanyOption[];
};

export function UserFilters({ companies }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const status = searchParams.get("status") ?? "all";

  const companyId = searchParams.get("companyId") ?? "all";

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

    router.push(query ? `/admin/users?${query}` : "/admin/users");
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateParams({
      search: search.trim() || undefined,
    });
  }

  function clearFilters() {
    setSearch("");

    router.push("/admin/users");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 lg:flex-row lg:items-center">
      <form onSubmit={handleSearch} className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar usuario o empresa..."
            className="pl-9"
          />
        </div>

        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <Select
        value={companyId}
        onValueChange={(value) =>
          updateParams({
            companyId: !value || value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-full lg:w-[240px]">
          <SelectValue placeholder="Empresa" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">Todas las empresas</SelectItem>

          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(value) =>
          updateParams({
            status: !value || value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-full lg:w-[170px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>

          <SelectItem value="active">Activos</SelectItem>

          <SelectItem value="inactive">Inactivos</SelectItem>
        </SelectContent>
      </Select>

      <Button type="button" variant="ghost" onClick={clearFilters}>
        <X className="mr-2 size-4" />
        Limpiar
      </Button>
    </div>
  );
}
