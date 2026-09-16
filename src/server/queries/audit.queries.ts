import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db";

import { auditLogs, companies, profiles } from "@/db/schema";

import { requireAdmin } from "@/server/services/auth.service";

type AuditFilters = {
  companyId?: string;
  userId?: string;

  module?: string;
  action?: string;

  from?: Date;
  to?: Date;

  page?: number;
  pageSize?: number;
};

export async function getAuditLogs(filters: AuditFilters = {}) {
  await requireAdmin();

  const page = Math.max(filters.page ?? 1, 1);

  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);

  const conditions = [];

  if (filters.companyId) {
    conditions.push(eq(auditLogs.companyId, filters.companyId));
  }

  if (filters.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }

  if (filters.module) {
    conditions.push(eq(auditLogs.module, filters.module));
  }

  if (filters.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }

  if (filters.from) {
    conditions.push(gte(auditLogs.createdAt, filters.from));
  }

  if (filters.to) {
    conditions.push(lte(auditLogs.createdAt, filters.to));
  }

  return db
    .select({
      id: auditLogs.id,

      module: auditLogs.module,

      action: auditLogs.action,

      entityType: auditLogs.entityType,

      entityId: auditLogs.entityId,

      oldValues: auditLogs.oldValues,

      newValues: auditLogs.newValues,

      metadata: auditLogs.metadata,

      ipAddress: auditLogs.ipAddress,

      userAgent: auditLogs.userAgent,

      requestId: auditLogs.requestId,

      createdAt: auditLogs.createdAt,

      companyId: companies.id,

      companyName: companies.name,

      userId: profiles.id,

      userName: profiles.fullName,
    })
    .from(auditLogs)

    .leftJoin(companies, eq(companies.id, auditLogs.companyId))

    .leftJoin(profiles, eq(profiles.id, auditLogs.userId))

    .where(conditions.length ? and(...conditions) : undefined)

    .orderBy(desc(auditLogs.createdAt))

    .limit(pageSize)

    .offset((page - 1) * pageSize);
}
