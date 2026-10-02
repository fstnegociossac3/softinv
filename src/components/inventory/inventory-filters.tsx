"use client";

import type { FormEvent } from "react";

import { useState } from "react";

import { Search, X } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

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

type InventoryFiltersProps = {
  categories: string[];

  brands: string[];

  companies?: CompanyOption[];

  showCompanyFilter?: boolean;
};

export function InventoryFilters({
  categories,
  brands,
  companies = [],
  showCompanyFilter = false,
}: InventoryFiltersProps) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateParams(values: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(values)) {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    /*
     * Cada cambio de filtro
     * vuelve a la primera página.
     */
    params.delete("page");

    const query = params.toString();

    router.push(query ? `/inventory?${query}` : "/inventory");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateParams({
      search: search.trim() || undefined,
    });
  }

  function clearFilters() {
    setSearch("");

    router.push("/inventory");
  }

  const sortValue = `${searchParams.get("sort") ?? "lastMovementAt"}:${
    searchParams.get("direction") ?? "desc"
  }`;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* BUSCADOR + EMPRESA */}

      <div className="flex flex-col gap-3 xl:flex-row">
        <form onSubmit={submitSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por SKU, descripción, categoría, marca o ubicación..."
              className="pl-9"
            />
          </div>

          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        {showCompanyFilter ? (
          <Select
            value={searchParams.get("companyId") ?? "all"}
            onValueChange={(value) =>
              updateParams({
                companyId: !value || value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-full xl:w-[230px]">
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
        ) : null}
      </div>

      {/* FILTROS */}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* CATEGORÍA */}

        <Select
          value={searchParams.get("category") ?? "all"}
          onValueChange={(value) =>
            updateParams({
              category: !value || value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>

            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* MARCA */}

        <Select
          value={searchParams.get("brand") ?? "all"}
          onValueChange={(value) =>
            updateParams({
              brand: !value || value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Marca" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Todas las marcas</SelectItem>

            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* STOCK */}

        <Select
          value={searchParams.get("stock") ?? "all"}
          onValueChange={(value) =>
            updateParams({
              stock: !value || value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Stock" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Todo el stock</SelectItem>

            <SelectItem value="with-stock">Con stock</SelectItem>

            <SelectItem value="zero-stock">Sin stock</SelectItem>
          </SelectContent>
        </Select>

        {/* ESTADO */}

        <Select
          value={searchParams.get("status") ?? "all"}
          onValueChange={(value) =>
            updateParams({
              status: !value || value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>

            <SelectItem value="active">Activo</SelectItem>

            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>

        {/* ORDENAMIENTO */}

        <Select
          value={sortValue}
          onValueChange={(value) => {
            if (!value) {
              return;
            }

            const [sort, direction] = value.split(":");

            updateParams({
              sort,
              direction,
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="lastMovementAt:desc">
              Movimiento reciente
            </SelectItem>

            <SelectItem value="sku:asc">SKU A-Z</SelectItem>

            <SelectItem value="sku:desc">SKU Z-A</SelectItem>

            <SelectItem value="stock:desc">Mayor stock</SelectItem>

            <SelectItem value="stock:asc">Menor stock</SelectItem>

            <SelectItem value="stockValue:desc">Mayor valor</SelectItem>

            <SelectItem value="stockValue:asc">Menor valor</SelectItem>

            <SelectItem value="unitCost:desc">Mayor costo</SelectItem>
          </SelectContent>
        </Select>

        {/* LIMPIAR */}

        <Button type="button" variant="ghost" onClick={clearFilters}>
          <X className="mr-2 size-4" />
          Limpiar
        </Button>
      </div>
    </div>
  );
}
