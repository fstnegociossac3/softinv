import "server-only";

import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { companies } from "@/db/schema";

import { PERMISSIONS } from "@/config/permissions";

import { requireAuth } from "@/server/services/auth.service";

import { requirePermission } from "@/server/services/authorization.service";

type CompanyFilters = {
  search?: string;
  status?: "active" | "inactive";

  page?: number;
  pageSize?: number;
};

// OBTENER EL TOTAL DE LAS EMPRESAS
export async function getCompanies(filters: CompanyFilters = {}) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.COMPANY_VIEW_ANY);

  const page = Math.max(filters.page ?? 1, 1);

  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);

  const conditions = [];

  if (filters.search) {
    conditions.push(
      or(
        ilike(companies.name, `%${filters.search}%`),
        ilike(companies.ruc, `%${filters.search}%`),
      ),
    );
  }

  if (filters.status) {
    conditions.push(eq(companies.status, filters.status));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(companies)
      .where(where)
      .orderBy(desc(companies.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),

    db
      .select({
        total: count(),
      })
      .from(companies)
      .where(where),
  ]);

  return {
    data: rows,
    total: totalRows[0]?.total ?? 0,
    page,
    pageSize,
  };
}

// OBTENER EMPRESA DE MANERA INDIVIDUAL

export async function getCompanyById(companyId: string) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.COMPANY_VIEW_ANY);

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  return company ?? null;
}

