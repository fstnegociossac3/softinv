import "server-only";

import { and, count, desc, eq, type SQL } from "drizzle-orm";

import { PERMISSIONS } from "@/config/permissions";

import { REPORT_LIMITS, type ReportType } from "@/config/reports";

import { db } from "@/db";

import { companies, profiles, reports } from "@/db/schema";

import { DomainError } from "@/server/errors/domain.error";

import { requireAuth } from "@/server/services/auth.service";

import {
  requireCompanyAccess,
  requirePermission,
  resolveCompanyId,
} from "@/server/services/authorization.service";

export type GeneratedReportFilters = {
  companyId?: string;

  reportType?: ReportType;

  page?: number;
};

/*
|--------------------------------------------------------------------------
| HISTORIAL
|--------------------------------------------------------------------------
|
| Siempre:
| 5 por página.
|
*/

export async function getGeneratedReports(
  filters: GeneratedReportFilters = {},
) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.REPORT_VIEW);

  const companyId = resolveCompanyId(auth, filters.companyId);

  const [company] = await db
    .select({
      id: companies.id,

      name: companies.name,

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

  const conditions: SQL[] = [eq(reports.companyId, companyId)];

  if (filters.reportType) {
    conditions.push(eq(reports.reportType, filters.reportType));
  }

  const where = and(...conditions);

  const pageSize = REPORT_LIMITS.PAGE_SIZE;

  const requestedPage = Math.max(filters.page ?? 1, 1);

  const [totalRow] = await db
    .select({
      total: count(),
    })
    .from(reports)
    .where(where);

  const total = totalRow?.total ?? 0;

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const page = Math.min(requestedPage, totalPages);

  const data = await db
    .select({
      id: reports.id,

      companyId: reports.companyId,

      companyName: companies.name,

      reportType: reports.reportType,

      dateFrom: reports.dateFrom,

      dateTo: reports.dateTo,

      snapshotVersion: reports.snapshotVersion,

      generatedBy: reports.generatedBy,

      generatedByName: profiles.fullName,

      generatedAt: reports.generatedAt,
    })
    .from(reports)
    .innerJoin(companies, eq(companies.id, reports.companyId))
    .innerJoin(profiles, eq(profiles.id, reports.generatedBy))
    .where(where)
    .orderBy(desc(reports.generatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    filters: {
      companyId: company.id,

      companyName: company.name,

      reportType: filters.reportType ?? null,
    },

    data,

    total,

    page,

    pageSize,

    totalPages,
  };
}

/*
|--------------------------------------------------------------------------
| DETALLE / SNAPSHOT
|--------------------------------------------------------------------------
*/

export async function getGeneratedReportById(reportId: string) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.REPORT_VIEW);

  const [report] = await db
    .select({
      id: reports.id,

      companyId: reports.companyId,

      companyName: companies.name,

      reportType: reports.reportType,

      dateFrom: reports.dateFrom,

      dateTo: reports.dateTo,

      snapshotVersion: reports.snapshotVersion,

      snapshotData: reports.snapshotData,

      generatedBy: reports.generatedBy,

      generatedByName: profiles.fullName,

      generatedAt: reports.generatedAt,
    })
    .from(reports)
    .innerJoin(companies, eq(companies.id, reports.companyId))
    .innerJoin(profiles, eq(profiles.id, reports.generatedBy))
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report) {
    return null;
  }

  requireCompanyAccess(auth, report.companyId);

  return report;
}
