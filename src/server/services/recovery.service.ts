import "server-only";

import { eq, sql } from "drizzle-orm";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/config/audit";

import { PERMISSIONS } from "@/config/permissions";

import { db } from "@/db";

import {
  auditLogs,
  companies,
  recoveryCases,
  recoveryEvents,
} from "@/db/schema";

import { formatDateInTimeZone } from "@/lib/recovery/date";

import type {
  CloseRecoveryCaseInput,
  RegisterRecoveryEventInput,
} from "@/lib/validations/recovery";

import { getTodayInTimeZone } from "@/lib/tracking/date";

import { DomainError } from "@/server/errors/domain.error";

import type { AuthContext } from "@/server/services/auth.service";

import {
  requireCompanyAccess,
  requirePermission,
} from "@/server/services/authorization.service";

import { sanitizeAuditValue } from "@/server/utils/audit-sanitizer";

import { getRequestMetadata } from "@/server/utils/request-metadata";

function round(value: number, decimals = 4) {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/*
|--------------------------------------------------------------------------
| REGISTRAR EVENTO
|--------------------------------------------------------------------------
*/

export async function registerRecoveryEvent(
  auth: AuthContext,

  input: RegisterRecoveryEventInput,
) {
  requirePermission(auth, PERMISSIONS.RECOVERY_CREATE);

  const request = await getRequestMetadata();

  return db.transaction(async (tx) => {
    /*
     * Bloqueamos el caso para
     * evitar registrar dos eventos
     * simultáneos que excedan stock.
     */
    await tx.execute(
      sql`
          SELECT id
          FROM recovery_cases
          WHERE id =
            ${input.recoveryCaseId}
          FOR UPDATE
        `,
    );

    const [recoveryCase] = await tx
      .select()
      .from(recoveryCases)
      .where(eq(recoveryCases.id, input.recoveryCaseId))
      .limit(1);

    if (!recoveryCase) {
      throw new DomainError(
        "RECOVERY_CASE_NOT_FOUND",

        "El caso de recuperación no existe.",
      );
    }

    requireCompanyAccess(auth, recoveryCase.companyId);

    if (
      recoveryCase.status === "recovered" ||
      recoveryCase.status === "unrecovered"
    ) {
      throw new DomainError(
        "RECOVERY_CASE_CLOSED",

        "El caso de recuperación ya está cerrado.",
      );
    }

    const [company] = await tx
      .select({
        timezone: companies.timezone,
      })
      .from(companies)
      .where(eq(companies.id, recoveryCase.companyId))
      .limit(1);

    if (!company) {
      throw new DomainError(
        "RECOVERY_COMPANY_NOT_FOUND",

        "La empresa no existe.",
      );
    }

    const today = getTodayInTimeZone(company.timezone);

    const startedDate = formatDateInTimeZone(
      recoveryCase.startedAt,
      company.timezone,
    );

    if (input.recoveryDate < startedDate) {
      throw new DomainError(
        "RECOVERY_DATE_INVALID",

        "La recuperación no puede ser anterior a la ejecución de la acción.",
      );
    }

    if (input.recoveryDate > today) {
      throw new DomainError(
        "RECOVERY_DATE_FUTURE",

        "No puedes registrar una recuperación con fecha futura.",
      );
    }

    /*
      |--------------------------------------------------------------------------
      | RECUPERACIÓN ACUMULADA
      |--------------------------------------------------------------------------
      */

    const existingEvents = await tx
      .select({
        quantity: recoveryEvents.quantity,

        recoveredValue: recoveryEvents.recoveredValue,
      })
      .from(recoveryEvents)
      .where(eq(recoveryEvents.recoveryCaseId, recoveryCase.id));

    const currentQuantity = existingEvents.reduce(
      (total, event) => total + event.quantity,

      0,
    );

    const nextQuantity = round(currentQuantity + input.quantity);

    if (nextQuantity > recoveryCase.initialStockQuantity) {
      throw new DomainError(
        "RECOVERY_QUANTITY_EXCEEDED",

        `La cantidad recuperada no puede superar el stock inicial de ${recoveryCase.initialStockQuantity}.`,
      );
    }

    const now = new Date();

    /*
      |--------------------------------------------------------------------------
      | EVENTO
      |--------------------------------------------------------------------------
      */

    const [event] = await tx
      .insert(recoveryEvents)
      .values({
        companyId: recoveryCase.companyId,

        recoveryCaseId: recoveryCase.id,

        quantity: input.quantity,

        recoveredValue: input.recoveredValue,

        recoveryDate: input.recoveryDate,

        notes: input.notes ?? null,

        createdBy: auth.userId,

        createdAt: now,
      })
      .returning();

    /*
     * Si recuperamos todas las
     * unidades, cerramos automáticamente.
     */
    const fullyRecovered = nextQuantity >= recoveryCase.initialStockQuantity;

    const [updatedCase] = await tx
      .update(recoveryCases)
      .set({
        status: fullyRecovered ? "recovered" : "in_progress",

        closedAt: fullyRecovered ? now : null,

        closedBy: fullyRecovered ? auth.userId : null,

        updatedAt: now,
      })
      .where(eq(recoveryCases.id, recoveryCase.id))
      .returning();

    /*
      |--------------------------------------------------------------------------
      | AUDITORÍA
      |--------------------------------------------------------------------------
      */

    await tx.insert(auditLogs).values({
      companyId: recoveryCase.companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.RECOVERY,

      action: AUDIT_ACTIONS.REGISTER,

      entityType: "recovery_event",

      entityId: event.id,

      newValues: sanitizeAuditValue(event),

      metadata: {
        recoveryCaseId: recoveryCase.id,

        quantity: input.quantity,

        recoveredValue: input.recoveredValue,

        automaticallyClosed: fullyRecovered,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return {
      event,

      recoveryCase: updatedCase,
    };
  });
}

/*
|--------------------------------------------------------------------------
| CERRAR CASO
|--------------------------------------------------------------------------
*/

export async function closeRecoveryCase(
  auth: AuthContext,

  input: CloseRecoveryCaseInput,
) {
  requirePermission(auth, PERMISSIONS.RECOVERY_UPDATE);

  const request = await getRequestMetadata();

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`
          SELECT id
          FROM recovery_cases
          WHERE id =
            ${input.recoveryCaseId}
          FOR UPDATE
        `,
    );

    const [current] = await tx
      .select()
      .from(recoveryCases)
      .where(eq(recoveryCases.id, input.recoveryCaseId))
      .limit(1);

    if (!current) {
      throw new DomainError(
        "RECOVERY_CASE_NOT_FOUND",

        "El caso de recuperación no existe.",
      );
    }

    requireCompanyAccess(auth, current.companyId);

    if (current.status === "recovered" || current.status === "unrecovered") {
      return current;
    }

    const events = await tx
      .select({
        recoveredValue: recoveryEvents.recoveredValue,
      })
      .from(recoveryEvents)
      .where(eq(recoveryEvents.recoveryCaseId, current.id));

    const recoveredValue = events.reduce(
      (total, event) => total + event.recoveredValue,

      0,
    );

    if (input.status === "recovered" && recoveredValue <= 0) {
      throw new DomainError(
        "RECOVERY_WITHOUT_RESULT",

        "No puedes cerrar como recuperado un caso sin recuperación registrada.",
      );
    }

    if (input.status === "unrecovered" && recoveredValue > 0) {
      throw new DomainError(
        "RECOVERY_HAS_RESULT",

        "El caso ya registra capital recuperado y no puede cerrarse como sin recuperación.",
      );
    }

    const now = new Date();

    const [updated] = await tx
      .update(recoveryCases)
      .set({
        status: input.status,

        closedAt: now,

        closedBy: auth.userId,

        updatedAt: now,
      })
      .where(eq(recoveryCases.id, current.id))
      .returning();

    await tx.insert(auditLogs).values({
      companyId: current.companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.RECOVERY,

      action: AUDIT_ACTIONS.UPDATE,

      entityType: "recovery_case",

      entityId: current.id,

      oldValues: sanitizeAuditValue(current),

      newValues: sanitizeAuditValue(updated),

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return updated;
  });
}
