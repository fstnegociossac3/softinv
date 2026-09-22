import { Building2, ChartNoAxesCombined } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { IriDistribution } from "@/components/iri/iri-distribution";

import { IriFilters } from "@/components/iri/iri-filters";

import { IriKpiCards } from "@/components/iri/iri-kpi-cards";

import { IriOpportunitiesTable } from "@/components/iri/iri-opportunities-table";

import { IriSkuAnalysis } from "@/components/iri/iri-sku-analysis";

import { IriSkuSelector } from "@/components/iri/iri-sku-selector";

import { IriVariables } from "@/components/iri/iri-variables";

import { getCompanies } from "@/server/queries/company.queries";

import {
  getIriDashboard,
  getIriSkuAnalysis,
} from "@/server/queries/iri.queries";

import { requireAuth } from "@/server/services/auth.service";

type IriPageProps = {
  searchParams: Promise<{
    companyId?: string;

    from?: string;

    to?: string;

    skuId?: string;
  }>;
};

export default async function IriPage({ searchParams }: IriPageProps) {
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
  |
  | No ejecutamos el cálculo IRI
  | hasta seleccionar una empresa.
  |
  */

  if (isAdmin && !params.companyId) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
            <ChartNoAxesCombined className="size-5 text-[#12365A]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Análisis IRI
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Índice de Recuperabilidad del Inventario.
            </p>
          </div>
        </div>

        <IriFilters
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
              Para iniciar el análisis IRI debes seleccionar la empresa cuyo
              inventario deseas evaluar.
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

  const result = await getIriDashboard({
    companyId: isAdmin ? params.companyId : undefined,

    from: params.from,

    to: params.to,
  });

  const { dashboard } = result;

  /*
  |--------------------------------------------------------------------------
  | OPCIONES SKU
  |--------------------------------------------------------------------------
  */

  const skuOptions = dashboard.items
    .map((item) => ({
      id: item.id,

      sku: item.sku,

      description: item.description,

      iri: item.iri,
    }))
    .sort((a, b) => a.sku.localeCompare(b.sku, "es"));

  /*
  |--------------------------------------------------------------------------
  | SKU SELECCIONADO
  |--------------------------------------------------------------------------
  */

  const selectedSkuExists = params.skuId
    ? dashboard.items.some((item) => item.id === params.skuId)
    : false;

  const skuAnalysis =
    params.skuId && selectedSkuExists
      ? await getIriSkuAnalysis(
          params.skuId,

          {
            companyId: isAdmin ? result.filters.companyId : undefined,

            from: result.filters.from,

            to: result.filters.to,
          },
        )
      : null;

  return (
    <div className="space-y-8">
      {/* ENCABEZADO */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
            <ChartNoAxesCombined className="size-5 text-[#12365A]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Análisis IRI
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Índice de Recuperabilidad del Inventario.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
          <p className="text-xs text-slate-400">Empresa analizada</p>

          <p className="font-semibold text-slate-800">
            {result.filters.companyName}
          </p>
        </div>
      </div>

      {/* 1. FILTRO FECHAS */}

      <IriFilters
        isAdmin={isAdmin}
        companies={companies}
        initialCompanyId={isAdmin ? result.filters.companyId : undefined}
        initialFrom={result.filters.from}
        initialTo={result.filters.to}
      />

      {/* 2, 3 y 4 KPIs */}

      <IriKpiCards summary={dashboard.summary} />

      {/* 5. DISTRIBUCIÓN + 6. VARIABLES */}

      <div className="grid gap-6 xl:grid-cols-2">
        <IriDistribution distribution={dashboard.distribution} />

        <IriVariables scores={dashboard.variableAverages} />
      </div>

      {/* 4. OPORTUNIDADES */}

      <IriOpportunitiesTable
        opportunities={dashboard.opportunities}
        companyId={isAdmin ? result.filters.companyId : undefined}
        from={result.filters.from}
        to={result.filters.to}
      />

      {/* 7. SKU */}

      <Card className="bg-white">
        <CardContent>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Análisis de SKU seleccionado
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Selecciona un producto para analizar las variables que componen su
              IRI.
            </p>
          </div>

          <IriSkuSelector items={skuOptions} selectedId={params.skuId} />
        </CardContent>
      </Card>

      <IriSkuAnalysis analysis={skuAnalysis} />
    </div>
  );
}
