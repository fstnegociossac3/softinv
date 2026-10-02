import { NextResponse } from "next/server";

import { REPORT_TYPE_LABELS } from "@/config/reports";

import { buildReportExcel } from "@/server/reports/report-excel";

import { getCurrentAuthContext } from "@/server/services/auth.service";

import {
  getReportExportPayload,
  registerReportExport,
} from "@/server/services/report.service";

import { getActionErrorMessage } from "@/server/utils/action-error";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/*
|--------------------------------------------------------------------------
| FILENAME SEGURO
|--------------------------------------------------------------------------
*/

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/*
|--------------------------------------------------------------------------
| GET /api/reports/[id]/excel
|--------------------------------------------------------------------------
*/

export async function GET(
  _request: Request,

  context: RouteContext,
) {
  /*
  |--------------------------------------------------------------------------
  | AUTENTICACIÓN
  |--------------------------------------------------------------------------
  */

  const auth = await getCurrentAuthContext();

  if (!auth) {
    return NextResponse.json(
      {
        success: false,

        message: "No autenticado.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const { id } = await context.params;

    /*
    |--------------------------------------------------------------------------
    | SNAPSHOT HISTÓRICO
    |--------------------------------------------------------------------------
    |
    | NO recalculamos:
    |
    | IRI
    | recomendaciones
    | seguimiento
    | recuperación
    |
    */

    const report = await getReportExportPayload(auth, id);

    /*
    |--------------------------------------------------------------------------
    | GENERAR XLSX
    |--------------------------------------------------------------------------
    */

    const excel = buildReportExcel(report.snapshotData);

    /*
    |--------------------------------------------------------------------------
    | NOMBRE
    |--------------------------------------------------------------------------
    */

    const reportLabel = REPORT_TYPE_LABELS[report.reportType];

    const companyName = report.snapshotData.company.name;

    const fileName = sanitizeFileName(
      `${reportLabel}_${companyName}_${report.dateFrom}_${report.dateTo}`,
    );

    /*
    |--------------------------------------------------------------------------
    | AUDITORÍA
    |--------------------------------------------------------------------------
    |
    | Solo registramos exportación
    | después de haber generado
    | correctamente el archivo.
    |
    */

    await registerReportExport(auth, id, "excel");

    /*
    |--------------------------------------------------------------------------
    | DESCARGA
    |--------------------------------------------------------------------------
    */

    return new Response(excel, {
      status: 200,

      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,

        "Cache-Control": "private, no-store, max-age=0",

        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("REPORT_EXCEL_EXPORT_ERROR", error);

    return NextResponse.json(
      {
        success: false,

        message: getActionErrorMessage(error),
      },
      {
        status: 400,
      },
    );
  }
}
