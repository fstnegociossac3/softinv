import Link from "next/link";

import { notFound } from "next/navigation";

import { Map } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import { PageHeader } from "@/components/shared/page-header";

import { ImportSummary } from "@/components/imports/import-summary";

import { ImportRowFilters } from "@/components/imports/import-row-filters";

import { ImportRowsTable } from "@/components/imports/import-rows-table";

import {
  getInventoryImportById,
  getInventoryImportRows,
} from "@/server/queries/inventory-import.queries";

type RowStatus = "pending" | "valid" | "invalid" | "duplicate";

type Props = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    status?: RowStatus;
    page?: string;
  }>;
};

export default async function ImportDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;

  const query = await searchParams;

  const importRecord = await getInventoryImportById(id);

  if (!importRecord) {
    notFound();
  }

  const rows = await getInventoryImportRows(id, {
    status: query.status,

    page: Number(query.page) || 1,

    pageSize: 50,
  });

  const canMap =
    importRecord.status !== "processed" && importRecord.status !== "validating";

  return (
    <div className="space-y-6">
      <PageHeader
        title={importRecord.originalFileName}
        description="Detalle de la importación y resultado de validación."
        actions={
          canMap ? (
            <Link
              href={`/imports/${id}/mapping`}
              className={buttonVariants({
                variant: "outline",
              })}
            >
              <Map className="mr-2 size-4" />

              {importRecord.status === "uploaded"
                ? "Mapear columnas"
                : "Revisar mapeo"}
            </Link>
          ) : undefined
        }
      />

      <ImportSummary record={importRecord} />

      <ImportRowFilters />

      <ImportRowsTable
        rows={rows.data}
        total={rows.total}
        page={rows.page}
        pageSize={rows.pageSize}
      />
    </div>
  );
}
