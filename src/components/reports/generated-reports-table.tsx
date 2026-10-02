import { FileSpreadsheet, FileText, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TablePagination } from "@/components/shared/table-pagination";

import { REPORT_TYPE_LABELS, type ReportType } from "@/config/reports";

type ReportRow = {
  id: string;

  companyId: string;

  companyName: string;

  reportType: ReportType;

  dateFrom: string;

  dateTo: string;

  snapshotVersion: number;

  generatedBy: string;

  generatedByName: string;

  generatedAt: Date;
};

type Props = {
  items: ReportRow[];

  total: number;

  page: number;

  pageSize: number;

  showCompany?: boolean;
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",

  timeStyle: "short",
});

function typeBadge(type: ReportType) {
  const label = REPORT_TYPE_LABELS[type];

  switch (type) {
    case "executive":
      return <Badge className="bg-[#12365A]/10 text-[#12365A]">{label}</Badge>;

    case "critical_inventory":
      return <Badge className="bg-red-50 text-red-700">{label}</Badge>;

    case "recommendations":
      return <Badge className="bg-amber-50 text-amber-700">{label}</Badge>;

    case "recovery":
      return <Badge className="bg-emerald-50 text-emerald-700">{label}</Badge>;
  }
}

export function GeneratedReportsTable({
  items,
  total,
  page,
  pageSize,
  showCompany = false,
}: Props) {
  if (!items.length) {
    return (
      <Card className="bg-white">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-slate-100">
            <History className="size-6 text-slate-400" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            No existen reportes generados
          </h3>

          <p className="mt-1 max-w-md text-sm text-slate-500">
            Genera uno de los reportes disponibles para comenzar a construir el
            historial.
          </p>
        </CardContent>
      </Card>
    );
  }

  const first = (page - 1) * pageSize + 1;

  const last = Math.min(page * pageSize, total);

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <History className="size-5 text-[#12365A]" />
          Reportes generados
        </CardTitle>

        <p className="text-sm text-slate-500">
          Historial de reportes generados y disponibles para volver a descargar.
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>

                {showCompany ? <TableHead>Empresa</TableHead> : null}

                <TableHead>Periodo</TableHead>

                <TableHead>Generado por</TableHead>

                <TableHead>Fecha de generación</TableHead>

                <TableHead className="text-right">Descargar</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{typeBadge(report.reportType)}</TableCell>

                  {showCompany ? (
                    <TableCell className="font-medium">
                      {report.companyName}
                    </TableCell>
                  ) : null}

                  <TableCell className="whitespace-nowrap">
                    {report.dateFrom}
                    {" — "}
                    {report.dateTo}
                  </TableCell>

                  <TableCell>{report.generatedByName}</TableCell>

                  <TableCell className="whitespace-nowrap">
                    {dateTimeFormatter.format(report.generatedAt)}
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {/* EXCEL */}

                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={
                          <a
                            href={`/api/reports/${report.id}/excel`}
                            aria-label={`Descargar ${REPORT_TYPE_LABELS[report.reportType]} en Excel`}
                          />
                        }
                      >
                        <FileSpreadsheet className="size-4" />
                        Excel
                      </Button>

                      {/* PDF */}

                      <Button
                        size="sm"
                        nativeButton={false}
                        render={
                          <a
                            href={`/api/reports/${report.id}/pdf`}
                            aria-label={`Descargar ${REPORT_TYPE_LABELS[report.reportType]} en PDF`}
                          />
                        }
                      >
                        <FileText className="size-4" />
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* PAGINACIÓN */}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Mostrando {first}–{last} de {total} reportes
            </p>

            <p className="text-xs text-slate-400">5 reportes por página</p>
          </div>

          <TablePagination page={page} total={total} pageSize={pageSize} />
        </div>
      </CardContent>
    </Card>
  );
}
