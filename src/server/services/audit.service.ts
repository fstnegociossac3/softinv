import { db } from "@/db";
import { auditLogs } from "@/db/schema";

type AuditInput = {
  companyId?: string | null;
  userId?: string | null;

  module: string;
  action: string;

  entityType?: string;
  entityId?: string;

  oldValues?: unknown;
  newValues?: unknown;

  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(input: AuditInput) {
  await db.insert(auditLogs).values({
    companyId: input.companyId ?? null,
    userId: input.userId ?? null,

    module: input.module,
    action: input.action,

    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,

    oldValues: input.oldValues,
    newValues: input.newValues,

    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });
}

