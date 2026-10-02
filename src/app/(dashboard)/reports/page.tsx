import { Building2, FileText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { ReportTypeCards } from "@/components/reports/report-type-cards";

import { ReportHistoryFilter } from "@/components/reports/report-history-filter";

import { GeneratedReportsTable } from "@/components/reports/generated-reports-table";

import { getCompanies } from "@/server/queries/company.queries";

import { getGeneratedReports } from "@/server/queries/report.queries";

import { requireAuth } from "@/server/services/auth.service";

type PageProps = {
  searchParams: Promise<{
    companyId?: string;

    page?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: PageProps) {
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

  const page = Math.max(Number(params.page) || 1, 1);

  /*
  |--------------------------------------------------------------------------
  | HISTORIAL
  |--------------------------------------------------------------------------
  |
  | USER:
  | auth.company.id automáticamente.
  |
  | ADMIN:
  | necesita empresa seleccionada.
  |
  */

  const history = isAdmin
    ? params.companyId
      ? await getGeneratedReports({
          companyId: params.companyId,

          page,
        })
      : null
    : await getGeneratedReports({
        page,
      });

  return (
    <div className="space-y-8">
      {/* ================================================================
          CABECERA
      ================================================================= */}

      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#12365A]/10">
          <FileText className="size-5 text-[#12365A]" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Reportes
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Genera y consulta reportes consolidados del inventario.
          </p>
        </div>
      </div>

      {/* ================================================================
          TIPOS DE REPORTES
      ================================================================= */}

      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Generar reporte
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Selecciona el tipo de reporte que deseas generar.
          </p>
        </div>

        <ReportTypeCards isAdmin={isAdmin} companies={companies} />
      </div>

      {/* ================================================================
          HISTORIAL
      ================================================================= */}

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Historial</h2>

          <p className="mt-1 text-sm text-slate-500">
            Consulta y vuelve a descargar reportes generados anteriormente.
          </p>
        </div>

        {/* ADMIN */}

        {isAdmin ? (
          <ReportHistoryFilter
            companies={companies}
            companyId={params.companyId}
          />
        ) : null}

        {/* ADMIN SIN EMPRESA */}

        {isAdmin && !params.companyId ? (
          <Card className="bg-white">
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#12365A]/10">
                <Building2 className="size-6 text-[#12365A]" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                Selecciona una empresa
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Selecciona una empresa para visualizar su historial de reportes.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* HISTORIAL */}

        {history ? (
          <GeneratedReportsTable
            items={history.data}
            total={history.total}
            page={history.page}
            pageSize={history.pageSize}
            showCompany={isAdmin}
          />
        ) : null}
      </div>
    </div>
  );
}
