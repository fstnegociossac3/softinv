import {
  CircleDollarSign,
  FileChartColumn,
  Lightbulb,
  TriangleAlert,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ReportGenerationDialog } from "@/components/reports/report-generation-dialog";

import type { ReportType } from "@/config/reports";

type CompanyOption = {
  id: string;
  name: string;
};

type Props = {
  isAdmin: boolean;

  companies?: CompanyOption[];
};

const reportTypes: Array<{
  type: ReportType;

  title: string;

  description: string;

  icon: typeof FileChartColumn;

  iconClass: string;

  iconBackground: string;
}> = [
  {
    type: "executive",

    title: "Reporte Ejecutivo",

    description:
      "Resumen consolidado de inventario, IRI, recomendaciones, seguimiento y recuperación.",

    icon: FileChartColumn,

    iconClass: "text-[#12365A]",

    iconBackground: "bg-[#12365A]/10",
  },

  {
    type: "critical_inventory",

    title: "Inventario Crítico",

    description:
      "Identifica SKU con mayor nivel de criticidad, capital comprometido y necesidad de intervención.",

    icon: TriangleAlert,

    iconClass: "text-red-600",

    iconBackground: "bg-red-50",
  },

  {
    type: "recommendations",

    title: "Recomendaciones",

    description:
      "Detalle de acciones Mantener, Redistribuir, Ofertar y Liquidar para el periodo.",

    icon: Lightbulb,

    iconClass: "text-amber-600",

    iconBackground: "bg-amber-50",
  },

  {
    type: "recovery",

    title: "Recuperación",

    description:
      "Resultados financieros, capital recuperado, tasa de recuperación y acciones ejecutadas.",

    icon: CircleDollarSign,

    iconClass: "text-emerald-600",

    iconBackground: "bg-emerald-50",
  },
];

export function ReportTypeCards({ isAdmin, companies = [] }: Props) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {reportTypes.map((report) => {
        const Icon = report.icon;

        return (
          <Card key={report.type} className="bg-white">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${report.iconBackground}`}
                >
                  <Icon className={`size-5 ${report.iconClass}`} />
                </div>

                <div>
                  <CardTitle>{report.title}</CardTitle>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {report.description}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <ReportGenerationDialog
                reportType={report.type}
                isAdmin={isAdmin}
                companies={companies}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
