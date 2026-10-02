import { Building2, LayoutDashboard } from "lucide-react";

import { DashboardFilters } from "@/components/dashboard/dashboard-filters";

import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards";

import { InventoryRotationChart } from "@/components/dashboard/inventory-rotation-chart";

import { PrioritySkusTable } from "@/components/dashboard/priority-skus-table";

import { TrafficLightDistribution } from "@/components/dashboard/traffic-light-distribution";

import { Card, CardContent } from "@/components/ui/card";

import { getCompanies } from "@/server/queries/company.queries";

import { getMainDashboard } from "@/server/queries/dashboard.queries";

import { requireAuth } from "@/server/services/auth.service";

type DashboardPageProps = {
  searchParams: Promise<{
    companyId?: string;

    from?: string;

    to?: string;

    trendMonths?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const auth = await requireAuth();

  const params = await searchParams;

  const isAdmin = auth.profile.role === "admin";

  /*
  |--------------------------------------------------------------------------
  | EMPRESAS (SOLO ADMIN)
  |--------------------------------------------------------------------------
  */

  const companies = isAdmin
    ? (
        await getCompanies({
          status: "active",

          pageSize: 100,
        })
      ).data
        .filter((company) => company.status === "active")
        .map((company) => ({
          id: company.id,

          name: company.name,
        }))
    : [];

  /*
  |--------------------------------------------------------------------------
  | RESOLVER EMPRESA
  |--------------------------------------------------------------------------
  |
  | Admin: empresa del query string,
  | solo si pertenece a las empresas activas.
  |
  | User: el backend utiliza auth.company.id.
  | Cualquier ?companyId=... externo se ignora.
  |
  */

  const resolvedCompanyId = isAdmin
    ? params.companyId &&
      companies.some((company) => company.id === params.companyId)
      ? params.companyId
      : null
    : null;

  /*
  |--------------------------------------------------------------------------
  | TENDENCIA
  |--------------------------------------------------------------------------
  |
  | trendMonths sí puede venir del query string
  | para Admin y para User.
  |
  | Solo se aceptan 3 o 6; cualquier otro valor
  | queda en 6.
  |
  */

  const trendMonths = params.trendMonths === "3" ? 3 : 6;

  /*
  |--------------------------------------------------------------------------
  | ADMIN SIN EMPRESA
  |--------------------------------------------------------------------------
  |
  | No ejecutamos el cálculo del dashboard
  | hasta seleccionar una empresa.
  |
  */

  if (isAdmin && !resolvedCompanyId) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
            <LayoutDashboard className="size-5 text-[#12365A]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Vista general de tu inventario y oportunidades de recuperación.
            </p>
          </div>
        </div>

        <DashboardFilters
          isAdmin
          companies={companies}
          initialCompanyId={params.companyId}
          initialFrom={params.from}
          initialTo={params.to}
        />

        <Card className="bg-white">
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#12365A]/10">
              <Building2 className="size-6 text-[#12365A]" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Selecciona una empresa
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              Selecciona una empresa para visualizar el resumen de inventario.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD
  |--------------------------------------------------------------------------
  |
  | User: companyId undefined → el backend usa auth.company.id.
  | Admin: empresa seleccionada válida.
  |
  */

  const dashboard = await getMainDashboard({
    companyId: isAdmin ? resolvedCompanyId! : undefined,

    from: params.from,

    to: params.to,

    trendMonths,
  });

  return (
    <div className="space-y-8">
      {/* ENCABEZADO */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
            <LayoutDashboard className="size-5 text-[#12365A]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Vista general de tu inventario y oportunidades de recuperación.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
          <p className="text-xs text-slate-400">Empresa analizada</p>

          <p className="font-semibold text-slate-800">
            {dashboard.filters.companyName}
          </p>
        </div>
      </div>

      {/* FILTROS */}

      <DashboardFilters
        isAdmin={isAdmin}
        companies={companies}
        initialCompanyId={isAdmin ? dashboard.filters.companyId : undefined}
        initialFrom={dashboard.filters.from}
        initialTo={dashboard.filters.to}
      />

      {/* KPI SUPERIORES */}

      <DashboardKpiCards kpis={dashboard.kpis} />

      {/* SEMÁFORO + ROTACIÓN */}

      <div className="grid gap-6 xl:grid-cols-2">
        <TrafficLightDistribution
          items={dashboard.trafficLightDistribution}
          totalSku={dashboard.kpis.skuAnalyzed.current}
        />

        <InventoryRotationChart
          data={dashboard.rotationTrend}
          trendMonths={dashboard.filters.trendMonths}
        />
      </div>

      {/* SKU PRIORITARIOS */}

      <PrioritySkusTable
        items={dashboard.prioritySkus}
        companyId={isAdmin ? dashboard.filters.companyId : undefined}
        from={dashboard.filters.from}
        to={dashboard.filters.to}
      />
    </div>
  );
}