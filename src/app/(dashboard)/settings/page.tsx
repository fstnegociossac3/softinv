import { Building2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";

import { CompanySettingsSelector } from "@/components/settings/company-settings-selector";

import { SettingsPanel } from "@/components/settings/settings-panel";

import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getCompanies } from "@/server/queries/company.queries";

import { getSettingsDashboard } from "@/server/queries/settings.queries";

import { requireAuth } from "@/server/services/auth.service";

type SettingsPageProps = {
  searchParams: Promise<{
    companyId?: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",

  month: "short",

  year: "numeric",
});

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const params = await searchParams;

  const auth = await requireAuth();

  const isAdmin = auth.profile.role === "admin";

  /*
  |--------------------------------------------------------------------------
  | EMPRESAS ACTIVAS (SOLO ADMIN)
  |--------------------------------------------------------------------------
  */

  const companies = isAdmin
    ? (
        await getCompanies({
          status: "active",

          pageSize: 100,
        })
      ).data.map((company) => ({
        id: company.id,

        name: company.name,
      }))
    : [];

  /*
  |--------------------------------------------------------------------------
  | RESOLVER EMPRESA
  |--------------------------------------------------------------------------
  |
  | Admin: empresa seleccionada en el query string,
  | solo si pertenece a las empresas activas.
  |
  | User: siempre su propia empresa.
  | El companyId del query string se ignora por completo.
  |
  */

  const resolvedCompanyId = isAdmin
    ? params.companyId &&
      companies.some((company) => company.id === params.companyId)
      ? params.companyId
      : null
    : auth.company?.id ?? null;

  const dashboard = resolvedCompanyId
    ? await getSettingsDashboard(resolvedCompanyId)
    : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configuración"
        description="Administra los parámetros de análisis y operación de cada empresa."
      />

      {isAdmin ? (
        <CompanySettingsSelector
          companies={companies}
          companyId={resolvedCompanyId ?? undefined}
        />
      ) : null}

      {dashboard ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-[#12365A]" />

                {dashboard.company.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-wrap items-center gap-3">
              {dashboard.customized ? (
                <Badge className="bg-[#12365A] text-white">
                  Configuración personalizada
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Usando configuración predeterminada
                </Badge>
              )}

              {dashboard.updatedAt ? (
                <p className="text-sm text-muted-foreground">
                  Última actualización:{" "}
                  <span className="font-medium text-slate-700">
                    {dateFormatter.format(dashboard.updatedAt)}
                  </span>
                </p>
              ) : null}
            </CardContent>
          </Card>

          <SettingsPanel
            key={dashboard.company.id}
            companyId={dashboard.company.id}
            settings={dashboard.settings}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <h3 className="text-base font-medium text-slate-900">
              Selecciona una empresa
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Selecciona una empresa para visualizar y modificar su
              configuración.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}