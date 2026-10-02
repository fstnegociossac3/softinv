import "server-only";

import { eq } from "drizzle-orm";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/config/audit";

import { PERMISSIONS } from "@/config/permissions";

import { REPORT_LIMITS, type ReportExportFormat } from "@/config/reports";

import { db } from "@/db";

import { auditLogs, companies, reports } from "@/db/schema";

import { countInclusiveDays, isValidDateOnly } from "@/lib/recovery/date";

import type { GenerateReportInput } from "@/lib/validations/report";

import { DomainError } from "@/server/errors/domain.error";

import { buildReportSnapshot } from "@/server/reports/report-builders";

import type { AuthContext } from "@/server/services/auth.service";

import {
  requireCompanyAccess,
  requirePermission,
  resolveCompanyId,
} from "@/server/services/authorization.service";

import { getRequestMetadata } from "@/server/utils/request-metadata";

/*
|--------------------------------------------------------------------------
| EMPRESA
|--------------------------------------------------------------------------
*/

async function resolveReportCompany(
  auth: AuthContext,

  requestedCompanyId?: string | null,
) {
  const companyId = resolveCompanyId(auth, requestedCompanyId);

  const [company] = await db
    .select({
      id: companies.id,

      name: companies.name,

      ruc: companies.ruc,

      sector: companies.sector,

      country: companies.country,

      timezone: companies.timezone,

      currency: companies.currency,

      status: companies.status,
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!company || company.status !== "active") {
    throw new DomainError(
      "REPORT_COMPANY_INVALID",

      "La empresa seleccionada no existe o está inactiva.",
    );
  }

  return company;
}

/*
|--------------------------------------------------------------------------
| VALIDAR PERIODO
|--------------------------------------------------------------------------
*/

function validatePeriod(from: string, to: string) {
  if (!isValidDateOnly(from) || !isValidDateOnly(to)) {
    throw new DomainError(
      "REPORT_DATE_INVALID",

      "El periodo del reporte no es válido.",
    );
  }

  if (from > to) {
    throw new DomainError(
      "REPORT_DATE_RANGE_INVALID",

      "La fecha Desde no puede ser posterior a Hasta.",
    );
  }

  const days = countInclusiveDays(from, to);

  if (days > REPORT_LIMITS.MAX_PERIOD_DAYS) {
    throw new DomainError(
      "REPORT_DATE_RANGE_TOO_LARGE",

      `El periodo máximo es de ${REPORT_LIMITS.MAX_PERIOD_DAYS} días.`,
    );
  }
}

/*
|--------------------------------------------------------------------------
| GENERAR
|--------------------------------------------------------------------------
*/

export async function generateReport(
  auth: AuthContext,

  input: GenerateReportInput,
) {
  requirePermission(auth, PERMISSIONS.REPORT_GENERATE);

  validatePeriod(input.from, input.to);

  const company = await resolveReportCompany(auth, input.companyId);

  const generatedAt = new Date();

  /*
  |--------------------------------------------------------------------------
  | SNAPSHOT INMUTABLE
  |--------------------------------------------------------------------------
  */

  const snapshot = await buildReportSnapshot({
    type: input.reportType,

    company: {
      id: company.id,

      name: company.name,

      ruc: company.ruc,

      sector: company.sector,

      country: company.country,

      timezone: company.timezone,

      currency: company.currency,
    },

    generatedBy: {
      id: auth.userId,

      name: auth.profile.fullName,
    },

    from: input.from,

    to: input.to,

    generatedAt,
  });

  const request = await getRequestMetadata();

  return db.transaction(async (tx) => {
    const [report] = await tx
      .insert(reports)
      .values({
        companyId: company.id,

        reportType: input.reportType,

        dateFrom: input.from,

        dateTo: input.to,

        snapshotData: snapshot,

        snapshotVersion: REPORT_LIMITS.SNAPSHOT_VERSION,

        generatedBy: auth.userId,

        generatedAt,
      })
      .returning({
        id: reports.id,

        reportType: reports.reportType,

        dateFrom: reports.dateFrom,

        dateTo: reports.dateTo,

        generatedAt: reports.generatedAt,
      });

    /*
      |--------------------------------------------------------------------------
      | AUDITORÍA
      |--------------------------------------------------------------------------
      */

    await tx.insert(auditLogs).values({
      companyId: company.id,

      userId: auth.userId,

      module: AUDIT_MODULES.REPORTS,

      action: AUDIT_ACTIONS.GENERATE,

      entityType: "report",

      entityId: report.id,

      metadata: {
        reportType: input.reportType,

        dateFrom: input.from,

        dateTo: input.to,

        snapshotVersion: REPORT_LIMITS.SNAPSHOT_VERSION,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return report;
  });
}

/*
|--------------------------------------------------------------------------
| OBTENER SNAPSHOT PARA EXPORTACIÓN
|--------------------------------------------------------------------------
|
| Posteriormente:
|
| /api/reports/[id]/pdf
| /api/reports/[id]/excel
|
| utilizarán esta función.
|
*/

export async function getReportExportPayload(
  auth: AuthContext,

  reportId: string,
) {
  requirePermission(auth, PERMISSIONS.REPORT_EXPORT);

  const [report] = await db
    .select({
      id: reports.id,

      companyId: reports.companyId,

      reportType: reports.reportType,

      dateFrom: reports.dateFrom,

      dateTo: reports.dateTo,

      snapshotVersion: reports.snapshotVersion,

      snapshotData: reports.snapshotData,

      generatedBy: reports.generatedBy,

      generatedAt: reports.generatedAt,
    })
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report) {
    throw new DomainError(
      "REPORT_NOT_FOUND",

      "El reporte no existe.",
    );
  }

  requireCompanyAccess(auth, report.companyId);

  return report;
}

/*
|--------------------------------------------------------------------------
| AUDITAR EXPORTACIÓN
|--------------------------------------------------------------------------
|
| Se llamará una vez que PDF/XLSX
| se haya generado correctamente.
|
*/

export async function registerReportExport(
  auth: AuthContext,

  reportId: string,

  format: ReportExportFormat,
) {
  requirePermission(auth, PERMISSIONS.REPORT_EXPORT);

  const report = await getReportExportPayload(auth, reportId);

  const request = await getRequestMetadata();

  await db.insert(auditLogs).values({
    companyId: report.companyId,

    userId: auth.userId,

    module: AUDIT_MODULES.REPORTS,

    action: AUDIT_ACTIONS.EXPORT,

    entityType: "report",

    entityId: report.id,

    metadata: {
      format,

      reportType: report.reportType,

      dateFrom: report.dateFrom,

      dateTo: report.dateTo,
    },

    requestId: request.requestId,

    ipAddress: request.ipAddress,

    userAgent: request.userAgent,
  });
}
