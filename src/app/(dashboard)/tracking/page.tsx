import { Building2, ClipboardCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { TrackingActionsTable } from "@/components/tracking/tracking-actions-table";

import { TrackingFilters } from "@/components/tracking/tracking-filters";

import { TrackingOverdueActions } from "@/components/tracking/tracking-overdue-actions";

import { TrackingRecentActivities } from "@/components/tracking/tracking-recent-activities";

import { TrackingStatusCards } from "@/components/tracking/tracking-status-cards";

import { TrackingStatusSummary } from "@/components/tracking/tracking-status-summary";

import type { TrackingDisplayStatus } from "@/config/tracking";

import { getCompanies } from "@/server/queries/company.queries";

import { getTrackingDashboard } from "@/server/queries/tracking.queries";

import { requireAuth } from "@/server/services/auth.service";

type PageProps = {
  searchParams: Promise<{
    companyId?: string;

    from?: string;

    to?: string;

    status?: string;

    search?: string;

    page?: string;
  }>;
};

const allowedStatuses = new Set<TrackingDisplayStatus>([
  "pending",
  "executed",
  "overdue",
]);

export default async function TrackingPage({ searchParams }: PageProps) {
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
  | ESTADO
  |--------------------------------------------------------------------------
  */

  const status =
    params.status && allowedStatuses.has(params.status as TrackingDisplayStatus)
      ? (params.status as TrackingDisplayStatus)
      : undefined;

  const page = Math.max(Number(params.page) || 1, 1);

  /*
  |--------------------------------------------------------------------------
  | ADMIN SIN EMPRESA
  |--------------------------------------------------------------------------
  */

  if (isAdmin && !params.companyId) {
    return (
      <div className="space-y-8">
        <Header />

        <TrackingFilters
          isAdmin
          companies={companies}
          initialCompanyId={params.companyId}
          initialFrom={params.from}
          initialTo={params.to}
          initialSearch={params.search}
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
              Selecciona la empresa cuyo seguimiento deseas consultar.
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
  */

  const result = await getTrackingDashboard({
    companyId: isAdmin ? params.companyId : undefined,

    from: params.from,

    to: params.to,

    status,

    search: params.search,

    page,
  });

  return (
    <div className="space-y-8">
      {/* CABECERA */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Header />

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
          <p className="text-xs text-slate-400">Empresa</p>

          <p className="font-semibold text-slate-800">
            {result.filters.companyName}
          </p>
        </div>
      </div>

      {/* 1. FILTROS */}

      <TrackingFilters
        isAdmin={isAdmin}
        companies={companies}
        initialCompanyId={isAdmin ? result.filters.companyId : undefined}
        initialFrom={result.filters.from ?? undefined}
        initialTo={result.filters.to ?? undefined}
        initialSearch={result.filters.search ?? undefined}
      />

      {/* 2. ESTADOS */}

      <TrackingStatusCards
        pending={result.summary.pending}
        executed={result.summary.executed}
        overdue={result.summary.overdue}
        activeStatus={result.filters.status}
      />

      {/* 3. TABLA — 5 POR PÁGINA */}

      <TrackingActionsTable
        items={result.actions.data}
        total={result.actions.total}
        page={result.actions.page}
        pageSize={result.actions.pageSize}
      />

      {/* 4 Y 5 */}

      <div className="grid gap-6 xl:grid-cols-2">
        <TrackingRecentActivities activities={result.recentActivities} />

        <TrackingOverdueActions actions={result.overdueActions} />
      </div>

      {/* 6. RESUMEN */}

      <TrackingStatusSummary
        pending={result.statusSummary.pending}
        executed={result.statusSummary.executed}
        overdue={result.statusSummary.overdue}
      />
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
        <ClipboardCheck className="size-5 text-[#12365A]" />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Seguimiento
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Control y seguimiento de acciones recomendadas.
        </p>
      </div>
    </div>
  );
}
