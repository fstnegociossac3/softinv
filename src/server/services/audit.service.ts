import "server-only";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";

import { type AuditAction, type AuditModule } from "@/config/audit";

import { sanitizeAuditValue } from "@/server/utils/audit-sanitizer";

import { getRequestMetadata } from "@/server/utils/request-metadata";

import type { AuthContext } from "@/server/services/auth.service";

export type CreateAuditLogInput = {
  companyId?: string | null;
  userId?: string | null;

  module: AuditModule;
  action: AuditAction;

  entityType?: string | null;
  entityId?: string | null;

  oldValues?: unknown;
  newValues?: unknown;

  metadata?: unknown;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  const request = await getRequestMetadata();

  const [audit] = await db
    .insert(auditLogs)
    .values({
      companyId: input.companyId ?? null,

      userId: input.userId ?? null,

      module: input.module,

      action: input.action,

      entityType: input.entityType ?? null,

      entityId: input.entityId ?? null,

      oldValues: sanitizeAuditValue(input.oldValues),

      newValues: sanitizeAuditValue(input.newValues),

      metadata: sanitizeAuditValue(input.metadata),

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    })
    .returning();

  return audit;
}

type AuthAuditInput = Omit<CreateAuditLogInput, "userId"> & {
  companyId?: string | null;
};

export async function createAuthenticatedAuditLog(
  auth: AuthContext,
  input: AuthAuditInput,
) {
  return createAuditLog({
    ...input,

    userId: auth.userId,

    companyId: input.companyId ?? auth.company?.id ?? null,
  });
}
