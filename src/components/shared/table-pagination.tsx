"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  total: number;
  pageSize: number;
};

export function TablePagination({ page, total, pageSize }: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", String(newPage));

    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => goToPage(page - 1)}
      >
        <ChevronLeft className="size-4" />
        Anterior
      </Button>

      <span className="px-2 text-sm">
        Página {page} de {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => goToPage(page + 1)}
      >
        Siguiente
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
