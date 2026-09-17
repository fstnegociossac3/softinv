import "server-only";

import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";

import { auditLogs, companies } from "@/db/schema";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/config/audit";

import { PERMISSIONS } from "@/config/permissions";

import type { CompanyInput } from "@/lib/validations/company";

import type { AuthContext } from "@/server/services/auth.service";

import { requirePermission } from "@/server/services/authorization.service";

import { DomainError } from "@/server/errors/domain.error";

import { sanitizeAuditValue } from "@/server/utils/audit-sanitizer";

import { getRequestMetadata } from "@/server/utils/request-metadata";

// cREAR EMPRESA
export async function createCompany(auth: AuthContext, input: CompanyInput) {
  requirePermission(auth, PERMISSIONS.COMPANY_CREATE);

  const request = await getRequestMetadata();

  return db.transaction(async (tx) => {
    if (input.ruc) {
      const [existing] = await tx
        .select({
          id: companies.id,
        })
        .from(companies)
        .where(eq(companies.ruc, input.ruc))
        .limit(1);

      if (existing) {
        throw new DomainError(
          "COMPANY_RUC_EXISTS",
          "Ya existe una empresa con ese RUC.",
        );
      }
    }

    const [company] = await tx
      .insert(companies)
      .values({
        name: input.name,

        ruc: input.ruc ?? null,

        sector: input.sector ?? null,

        address: input.address ?? null,

        country: input.country,

        timezone: input.timezone,

        currency: input.currency,

        status: "active",
      })
      .returning();

    await tx.insert(auditLogs).values({
      companyId: company.id,

      userId: auth.userId,

      module: AUDIT_MODULES.COMPANIES,

      action: AUDIT_ACTIONS.CREATE,

      entityType: "company",

      entityId: company.id,

      newValues: sanitizeAuditValue(company),

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return company;
  });
}

// ACTUALIZAR EMPRESA
export async function updateCompany(
  auth: AuthContext,
  companyId: string,
  input: CompanyInput,
) {
  requirePermission(auth, PERMISSIONS.COMPANY_UPDATE);

  const request = await getRequestMetadata();

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!current) {
      throw new DomainError("COMPANY_NOT_FOUND", "La empresa no existe.");
    }

    if (input.ruc) {
      const [duplicate] = await tx
        .select({
          id: companies.id,
        })
        .from(companies)
        .where(
          and(
            eq(companies.ruc, input.ruc),

            ne(companies.id, companyId),
          ),
        )
        .limit(1);

      if (duplicate) {
        throw new DomainError(
          "COMPANY_RUC_EXISTS",
          "El RUC ya está registrado en otra empresa.",
        );
      }
    }

    const [updated] = await tx
      .update(companies)
      .set({
        name: input.name,

        ruc: input.ruc ?? null,

        sector: input.sector ?? null,

        address: input.address ?? null,

        country: input.country,

        timezone: input.timezone,

        currency: input.currency,

        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))
      .returning();

    await tx.insert(auditLogs).values({
      companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.COMPANIES,

      action: AUDIT_ACTIONS.UPDATE,

      entityType: "company",

      entityId: companyId,

      oldValues: sanitizeAuditValue(current),

      newValues: sanitizeAuditValue(updated),

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return updated;
  });
}

// ACTIVAR Y DESACTIVAR EMPRESA
export async function changeCompanyStatus(
  auth: AuthContext,
  companyId: string,
  status: "active" | "inactive",
) {
  requirePermission(auth, PERMISSIONS.COMPANY_CHANGE_STATUS);

  const request = await getRequestMetadata();

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!current) {
      throw new DomainError("COMPANY_NOT_FOUND", "La empresa no existe.");
    }

    if (current.status === status) {
      return current;
    }

    const [updated] = await tx
      .update(companies)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))
      .returning();

    await tx.insert(auditLogs).values({
      companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.COMPANIES,

      action:
        status === "active" ? AUDIT_ACTIONS.ACTIVATE : AUDIT_ACTIONS.DEACTIVATE,

      entityType: "company",

      entityId: companyId,

      oldValues: {
        status: current.status,
      },

      newValues: {
        status: updated.status,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return updated;
  });
}
