import { Building2, CircleDollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { RecoveryFilters } from "@/components/recovery/recovery-filters";

import { RecoveryKpiCards } from "@/components/recovery/recovery-kpi-cards";

import { RecoveredOverTimeChart } from "@/components/recovery/recovered-over-time-chart";

import { RecoveryComparisonChart } from "@/components/recovery/recovery-comparison-chart";

import { RecoveryActionsTable } from "@/components/recovery/recovery-actions-table";

import { RecoveryPeriodTotal } from "@/components/recovery/recovery-period-total";

import { getCompanies } from "@/server/queries/company.queries";

import { getRecoveryDashboard } from "@/server/queries/recovery.queries";

import { requireAuth } from "@/server/services/auth.service";

type PageProps = {
  searchParams: Promise<{
    companyId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

export default async function RecoveryPage({ searchParams }: PageProps) {
  const auth = await requireAuth();

  const params = await searchParams;

  const isAdmin = auth.profile.role === "admin";

  /*
  |--------------------------------------------------------------------------
  | EMPRESAS
  |--------------------------------------------------------------------------
  */

  const companiesResult = isAdmin
    ? await getCompanies({
        status: "active",

        page: 1,

        pageSize: 100,
      })
    : null;

  const companies =
    companiesResult?.data
      .filter((company) => company.status === "active")
      .map((company) => ({
        id: company.id,

        name: company.name,
      })) ?? [];

  /*
  |--------------------------------------------------------------------------
  | ADMIN SIN EMPRESA
  |--------------------------------------------------------------------------
  */

  if (isAdmin && !params.companyId) {
    return (
      <div className="space-y-8">
        <Header />

        <RecoveryFilters
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
              Selecciona la empresa cuyos resultados de recuperación deseas
              analizar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const page = Math.max(Number(params.page) || 1, 1);

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD
  |--------------------------------------------------------------------------
  */

  const result = await getRecoveryDashboard({
    companyId: isAdmin ? params.companyId : undefined,

    from: params.from,

    to: params.to,

    page,
  });

  return (
    <div className="space-y-8">
      {/* CABECERA */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Header />

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
          <p className="text-xs text-slate-400">Empresa analizada</p>

          <p className="font-semibold text-slate-800">
            {result.filters.companyName}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {result.filters.from}
            {" — "}
            {result.filters.to}
          </p>
        </div>
      </div>

      {/* 1. FILTRO */}

      <RecoveryFilters
        isAdmin={isAdmin}
        companies={companies}
        initialCompanyId={isAdmin ? result.filters.companyId : undefined}
        initialFrom={result.filters.from}
        initialTo={result.filters.to}
      />

      {/* 2 - 5. KPI */}

      <RecoveryKpiCards
        immobilizedCapital={result.kpis.immobilizedCapital}
        potentiallyRecoverableCapital={
          result.kpis.potentiallyRecoverableCapital
        }
        recoveredCapital={result.kpis.recoveredCapital}
        recoveryRate={result.kpis.recoveryRate}
      />

      {/* 6 - 7. GRÁFICOS */}

      <div className="grid gap-6 xl:grid-cols-2">
        <RecoveredOverTimeChart data={result.recoveredOverTime} />

        <RecoveryComparisonChart data={result.comparisonByAction} />
      </div>

      {/* 8. TABLA */}

      <RecoveryActionsTable
        items={result.actions.data}
        total={result.actions.total}
        page={result.actions.page}
        pageSize={result.actions.pageSize}
      />

      {/* 9. TOTAL PERIODO */}

      <RecoveryPeriodTotal
        from={result.filters.from}
        to={result.filters.to}
        recoveredCapital={result.periodTotal.recoveredCapital}
        recoveredUnits={result.periodTotal.recoveredUnits}
        casesWithRecovery={result.periodTotal.casesWithRecovery}
        events={result.periodTotal.events}
      />
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
        <CircleDollarSign className="size-5 text-[#12365A]" />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Recuperación
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Resultados financieros obtenidos de las acciones ejecutadas.
        </p>
      </div>
    </div>
  );
}
