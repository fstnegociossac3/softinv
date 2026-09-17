import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";

import { MappingForm } from "@/components/imports/mapping-form";

import { RawPreviewTable } from "@/components/imports/raw-preview-table";

import {
  getInventoryImportById,
  getInventoryImportRows,
} from "@/server/queries/inventory-import.queries";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ImportMappingPage({ params }: Props) {
  const { id } = await params;

  const importRecord = await getInventoryImportById(id);

  if (!importRecord) {
    notFound();
  }

  if (importRecord.status === "processed") {
    redirect(`/imports/${id}`);
  }

  const rows = await getInventoryImportRows(id, {
    page: 1,
    pageSize: 10,
  });

  const preview = rows.data.map((row) => row.rawData);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapear columnas"
        description={`Archivo: ${importRecord.originalFileName}`}
      />

      <MappingForm
        importId={id}
        headers={importRecord.headers}
        existingMapping={importRecord.columnMapping}
      />

      <RawPreviewTable headers={importRecord.headers} rows={preview} />
    </div>
  );
}
