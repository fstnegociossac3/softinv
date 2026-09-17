import "server-only";

import { and, count, desc, eq, ilike } from "drizzle-orm";

import { db } from "@/db";

import { inventoryImportRows, inventoryImports, profiles } from "@/db/schema";

import { PERMISSIONS } from "@/config/permissions";

import { requireAuth } from "@/server/services/auth.service";

import {
  requireCompanyAccess,
  requirePermission,
} from "@/server/services/authorization.service";

type ImportFilters = {
  companyId?: string;

  status?: "uploaded" | "validating" | "ready" | "processed" | "failed";

  search?: string;

  page?: number;
  pageSize?: number;
};

export async function getInventoryImports(filters: ImportFilters = {}) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.IMPORT_VIEW);

  const page = Math.max(filters.page ?? 1, 1);

  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);

  const conditions = [];

  if (auth.profile.role === "user") {
    conditions.push(eq(inventoryImports.companyId, auth.company!.id));
  } else if (filters.companyId) {
    conditions.push(eq(inventoryImports.companyId, filters.companyId));
  }

  if (filters.status) {
    conditions.push(eq(inventoryImports.status, filters.status));
  }

  if (filters.search) {
    conditions.push(
      ilike(inventoryImports.originalFileName, `%${filters.search}%`),
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: inventoryImports.id,

        companyId: inventoryImports.companyId,

        fileName: inventoryImports.originalFileName,

        sourceType: inventoryImports.sourceType,

        status: inventoryImports.status,

        totalRows: inventoryImports.totalRows,

        validRows: inventoryImports.validRows,

        invalidRows: inventoryImports.invalidRows,

        duplicateRows: inventoryImports.duplicateRows,

        createdAt: inventoryImports.createdAt,

        createdById: profiles.id,

        createdByName: profiles.fullName,
      })
      .from(inventoryImports)
      .leftJoin(profiles, eq(profiles.id, inventoryImports.createdBy))
      .where(where)
      .orderBy(desc(inventoryImports.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),

    db
      .select({
        total: count(),
      })
      .from(inventoryImports)
      .where(where),
  ]);

  return {
    data: rows,

    total: totalRows[0]?.total ?? 0,

    page,
    pageSize,
  };
}

export async function getInventoryImportById(importId: string) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.IMPORT_VIEW);

  const [record] = await db
    .select()
    .from(inventoryImports)
    .where(eq(inventoryImports.id, importId))
    .limit(1);

  if (!record) {
    return null;
  }

  requireCompanyAccess(auth, record.companyId);

  return record;
}

type ImportRowFilters = {
  status?: "pending" | "valid" | "invalid" | "duplicate";

  page?: number;
  pageSize?: number;
};

export async function getInventoryImportRows(
  importId: string,
  filters: ImportRowFilters = {},
) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.IMPORT_VIEW);

  const page = Math.max(filters.page ?? 1, 1);

  const pageSize = Math.min(Math.max(filters.pageSize ?? 50, 1), 100);

  const [importRecord] = await db
    .select({
      id: inventoryImports.id,
      companyId: inventoryImports.companyId,
    })
    .from(inventoryImports)
    .where(eq(inventoryImports.id, importId))
    .limit(1);

  if (!importRecord) {
    return {
      data: [],
      total: 0,
      page,
      pageSize,
    };
  }

  requireCompanyAccess(auth, importRecord.companyId);

  const conditions = [eq(inventoryImportRows.importId, importId)];

  if (filters.status) {
    conditions.push(eq(inventoryImportRows.status, filters.status));
  }

  const where = and(...conditions);

  const [rows, total] = await Promise.all([
    db
      .select()
      .from(inventoryImportRows)
      .where(where)
      .orderBy(inventoryImportRows.rowNumber)
      .limit(pageSize)
      .offset((page - 1) * pageSize),

    db
      .select({
        total: count(),
      })
      .from(inventoryImportRows)
      .where(where),
  ]);

  return {
    data: rows,
    total: total[0]?.total ?? 0,
    page,
    pageSize,
  };
}
