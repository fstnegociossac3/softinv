import Link from "next/link";

import { FileSpreadsheet, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import { ImportFilters } from "@/components/imports/import-filters";
import { ImportTable } from "@/components/imports/import-table";

import { cn } from "@/lib/utils";

import { requireAuth } from "@/server/services/auth.service";

import { getInventoryImports } from "@/server/queries/inventory-import.queries";

import { getCompanies } from "@/server/queries/company.queries";

type ImportStatus =
  | "uploaded"
  | "validating"
  | "ready"
  | "processed"
  | "failed";

type ImportsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: ImportStatus;
    companyId?: string;
    page?: string;
  }>;
};

export default async function ImportsPage({ searchParams }: ImportsPageProps) {
  const auth = await requireAuth();

  const params = await searchParams;

  const page = Math.max(Number(params.page) || 1, 1);

  const result = await getInventoryImports({
    search: params.search,
    status: params.status,
    companyId: auth.profile.role === "admin" ? params.companyId : undefined,
    page,
    pageSize: 20,
  });

  const companyResult =
    auth.profile.role === "admin"
      ? await getCompanies({
          page: 1,
          pageSize: 100,
        })
      : null;

  const companies = companyResult?.data ?? [];

  return (
    <div className="space-y-8">
      {/* ENCABEZADO */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#12365A]/10">
              <FileSpreadsheet className="size-5 text-[#12365A]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Importaciones
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Carga, valida y revisa los inventarios de tu empresa.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/imports/new"
          className={cn(
            buttonVariants(),
            "bg-[#12365A] text-white hover:bg-[#0F2D4C]",
          )}
        >
          <Plus className="mr-2 size-4" />
          Nueva importación
        </Link>
      </div>

      {/* FILTROS */}
      <ImportFilters
        companies={companies}
        showCompanyFilter={auth.profile.role === "admin"}
      />

      {/* TABLA */}
      <ImportTable
        imports={result.data}
        companies={companies}
        currentCompanyName={auth.company?.name ?? null}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
