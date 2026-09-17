import { AdminPageHeader } from "@/components/admin/admin-page-header";

import { CreateUserDialog } from "@/components/admin/users/create-user-dialog";
import { UserFilters } from "@/components/admin/users/user-filters";
import { UserTable } from "@/components/admin/users/user-table";

import { getCompanies } from "@/server/queries/company.queries";
import { getUsers } from "@/server/queries/user.queries";

type UsersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "active" | "inactive";
    companyId?: string;
    page?: string;
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;

  const page = Math.max(Number(params.page) || 1, 1);

  const [usersResult, activeCompaniesResult, allCompaniesResult] =
    await Promise.all([
      getUsers({
        search: params.search,
        status: params.status,
        companyId: params.companyId,
        page,
        pageSize: 20,
      }),

      /*
       * Solo empresas activas:
       * crear y editar usuarios.
       */
      getCompanies({
        status: "active",
        page: 1,
        pageSize: 100,
      }),

      /*
       * Todas las empresas:
       * filtros administrativos.
       */
      getCompanies({
        page: 1,
        pageSize: 100,
      }),
    ]);

  const activeCompanies = activeCompaniesResult.data.map((company) => ({
    id: company.id,
    name: company.name,
  }));

  const filterCompanies = allCompaniesResult.data.map((company) => ({
    id: company.id,
    name: company.name,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Usuarios"
        description="Gestiona los usuarios y su acceso a las empresas registradas."
        actions={<CreateUserDialog companies={activeCompanies} />}
      />

      <UserFilters companies={filterCompanies} />

      <UserTable
        users={usersResult.data}
        activeCompanies={activeCompanies}
        total={usersResult.total}
        page={usersResult.page}
        pageSize={usersResult.pageSize}
      />
    </div>
  );
}
