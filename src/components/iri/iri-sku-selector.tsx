"use client";

import { useMemo, useState } from "react";

import { Search } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SkuOption = {
  id: string;

  sku: string;

  description: string;

  iri: number;
};

type Props = {
  items: SkuOption[];

  selectedId?: string;
};

export function IriSkuSelector({ items, selectedId }: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return items.slice(0, 100);
    }

    return items
      .filter(
        (item) =>
          item.sku.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term),
      )
      .slice(0, 100);
  }, [items, search]);

  function selectSku(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "none") {
      params.delete("skuId");
    } else {
      params.set("skuId", value);
    }

    router.push(`/iri?${params.toString()}#sku-analysis`);
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1.5fr]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar SKU o producto..."
          className="pl-9"
        />
      </div>

      <Select value={selectedId ?? "none"} onValueChange={selectSku}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Selecciona un SKU">
            {(value: string | null) => {
              if (!value || value === "none") {
                return "Selecciona un SKU";
              }

              const selectedItem = itemById.get(value);

              return selectedItem
                ? `${selectedItem.sku} — ${selectedItem.description}`
                : "SKU no disponible";
            }}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="none">Selecciona un SKU</SelectItem>

          {filtered.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.sku}
              {" — "}
              {item.description}
              {" · IRI "}
              {item.iri}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
