"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ImportRowFilters() {
  const router = useRouter();

  const searchParams = useSearchParams();

  function changeStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }

    params.delete("page");

    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
      <p className="font-medium">Filas importadas</p>

      <select
        value={searchParams.get("status") ?? "all"}
        onChange={(event) => changeStatus(event.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="all">Todas</option>

        <option value="valid">Válidas</option>

        <option value="invalid">Inválidas</option>

        <option value="duplicate">Duplicadas</option>

        <option value="pending">Pendientes</option>
      </select>
    </div>
  );
}
