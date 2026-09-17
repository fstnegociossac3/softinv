import { AdminPageHeader } from "@/components/admin/admin-page-header";

import { CompanyTable } from "@/components/admin/companies/company-table";

import { CompanyFilters } from "@/components/admin/companies/company-filters";

import { CreateCompanyDialog } from "@/components/admin/companies/create-company-dialog";

import { getCompanies } from "@/server/queries/company.queries";

type CompaniesPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "active" | "inactive";
    page?: string;
  }>;
};

export default async function CompaniesPage({
  searchParams,
}: CompaniesPageProps) {
  const params = await searchParams;

  const page = Number(params.page) || 1;

  const result = await getCompanies({
    search: params.search,

    status: params.status,

    page,

    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Empresas"
        description="Gestiona las empresas registradas en RecuperaStock AI."
        actions={<CreateCompanyDialog />}
      />

      <CompanyFilters />

      <CompanyTable
        companies={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
