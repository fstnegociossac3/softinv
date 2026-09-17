import { PageHeader } from "@/components/shared/page-header";

import { UploadInventoryForm } from "@/components/imports/upload-inventory-form";

import { requireAuth } from "@/server/services/auth.service";

import { getCompanies } from "@/server/queries/company.queries";

export default async function NewImportPage() {
  const auth = await requireAuth();

  const companyResult =
    auth.profile.role === "admin"
      ? await getCompanies({
          status: "active",
          page: 1,
          pageSize: 100,
        })
      : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Nueva importación"
        description="Carga un archivo XLSX, XLS o CSV con el inventario de la empresa."
      />

      <UploadInventoryForm
        isAdmin={auth.profile.role === "admin"}
        companies={companyResult?.data ?? []}
        currentCompanyName={auth.company?.name ?? null}
      />
    </div>
  );
}
