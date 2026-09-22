import { Building2, Lightbulb } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { RecommendationActionCards } from "@/components/recommendations/recommendation-action-cards";

import { RecommendationFilters } from "@/components/recommendations/recommendation-filters";

import { RecommendationKpiCards } from "@/components/recommendations/recommendation-kpi-cards";

import { RecommendationsTable } from "@/components/recommendations/recommendations-table";

import { getCompanies } from "@/server/queries/company.queries";

import {
  getRecommendationsDashboard,
  type RecommendationSortDirection,
  type RecommendationSortField,
} from "@/server/queries/recommendation.queries";

import type { RecommendationAction } from "@/lib/recommendations/types";

import { requireAuth } from "@/server/services/auth.service";

type PageProps = {
  searchParams: Promise<{
    companyId?: string;

    from?: string;

    to?: string;

    action?: string;

    search?: string;

    sort?: string;

    direction?: string;

    page?: string;
  }>;
};

const actions = new Set<RecommendationAction>([
  "maintain",
  "redistribute",
  "offer",
  "liquidate",
]);

const sorts = new Set<RecommendationSortField>([
  "sku",
  "iri",
  "stock",
  "stockValue",
  "coverage",
  "potentialRotation",
]);

export default async function RecommendationsPage({ searchParams }: PageProps) {
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
  | FILTROS
  |--------------------------------------------------------------------------
  */

  const action =
    params.action && actions.has(params.action as RecommendationAction)
      ? (params.action as RecommendationAction)
      : undefined;

  const sort =
    params.sort && sorts.has(params.sort as RecommendationSortField)
      ? (params.sort as RecommendationSortField)
      : "stockValue";

  const direction: RecommendationSortDirection =
    params.direction === "asc" ? "asc" : "desc";

  const page = Math.max(Number(params.page) || 1, 1);

  /*
  |--------------------------------------------------------------------------
  | ADMIN SIN EMPRESA
  |--------------------------------------------------------------------------
  */

  if (isAdmin && !params.companyId) {
    return (
      <div className="space-y-8">
        {/* ENCABEZADO */}

        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
            <Lightbulb className="size-5 text-[#12365A]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Recomendaciones
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Acciones sugeridas para optimizar la recuperación del inventario.
            </p>
          </div>
        </div>

        <RecommendationFilters
          isAdmin
          companies={companies}
          initialCompanyId={params.companyId}
          initialFrom={params.from}
          initialTo={params.to}
          initialSearch={params.search}
          initialSort={sort}
          initialDirection={direction}
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
              Selecciona la empresa cuyo inventario deseas analizar para generar
              recomendaciones.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | BACKEND
  |--------------------------------------------------------------------------
  */

  const result = await getRecommendationsDashboard({
    companyId: isAdmin ? params.companyId : undefined,

    from: params.from,

    to: params.to,

    action,

    search: params.search,

    sort,

    direction,

    page,

    pageSize: 20,
  });

  return (
    <div className="space-y-8">
      {/* ================================================================
          ENCABEZADO
      ================================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
            <Lightbulb className="size-5 text-[#12365A]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Recomendaciones
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Acciones sugeridas para optimizar la recuperación del inventario.
            </p>
          </div>
        </div>

        {/* EMPRESA */}

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
          <p className="text-xs text-slate-400">Empresa analizada</p>

          <p className="text-sm font-semibold text-slate-800">
            {result.filters.companyName}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {result.filters.from}
            {" — "}
            {result.filters.to}
          </p>
        </div>
      </div>

      {/* ================================================================
          1. FILTRO DE FECHAS
      ================================================================= */}

      <RecommendationFilters
        isAdmin={isAdmin}
        companies={companies}
        initialCompanyId={isAdmin ? result.filters.companyId : undefined}
        initialFrom={result.filters.from}
        initialTo={result.filters.to}
        initialSearch={result.filters.search ?? undefined}
        initialSort={result.filters.sort}
        initialDirection={result.filters.direction}
      />

      {/* ================================================================
          2. MANTENER / REDISTRIBUIR / OFERTAR / LIQUIDAR
      ================================================================= */}

      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Acciones recomendadas
          </h2>

          <p className="text-sm text-slate-500">
            Selecciona una acción para filtrar las recomendaciones.
          </p>
        </div>

        <RecommendationActionCards
          distribution={result.distribution}
          activeAction={action}
        />
      </div>

      {/* ================================================================
          3. KPI
      ================================================================= */}

      <RecommendationKpiCards summary={result.summary} />

      {/* ================================================================
          4. RECOMENDACIONES POR SKU
      ================================================================= */}

      <RecommendationsTable
        items={result.recommendations.data}
        total={result.recommendations.total}
        page={result.recommendations.page}
        pageSize={result.recommendations.pageSize}
      />
    </div>
  );
}
