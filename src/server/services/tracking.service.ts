import "server-only";

import { and, eq } from "drizzle-orm";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/config/audit";

import { PERMISSIONS } from "@/config/permissions";

import { db } from "@/db";

import {
  auditLogs,
  companies,
  recoveryCases,
  trackingActions,
  trackingActivities,
} from "@/db/schema";

import { calculateRecommendationForItem } from "@/lib/recommendations/calculate-recommendations";

import { getTodayInTimeZone } from "@/lib/tracking/date";

import type { CreateTrackingInput } from "@/lib/validations/tracking";

import { DomainError } from "@/server/errors/domain.error";

import { getIriDashboard } from "@/server/queries/iri.queries";

import type { AuthContext } from "@/server/services/auth.service";

import {
  requireCompanyAccess,
  requirePermission,
  resolveCompanyId,
} from "@/server/services/authorization.service";

import { sanitizeAuditValue } from "@/server/utils/audit-sanitizer";

import { getRequestMetadata } from "@/server/utils/request-metadata";

import { getCompanySettingsByCompanyId } from "@/server/services/settings.service";

/*
|--------------------------------------------------------------------------
| EMPRESA
|--------------------------------------------------------------------------
*/

async function getTrackingCompany(
  auth: AuthContext,

  requestedCompanyId?: string | null,
) {
  const companyId = resolveCompanyId(auth, requestedCompanyId);

  const [company] = await db
    .select({
      id: companies.id,

      name: companies.name,

      timezone: companies.timezone,

      status: companies.status,
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!company || company.status !== "active") {
    throw new DomainError(
      "TRACKING_COMPANY_INVALID",

      "La empresa seleccionada no existe o está inactiva.",
    );
  }

  return company;
}

/*
|--------------------------------------------------------------------------
| CREAR SEGUIMIENTO
|--------------------------------------------------------------------------
|
| No confiamos en valores enviados
| desde frontend como:
|
| IRI
| stock
| recomendación
| capital
|
| Todo se recalcula en servidor.
|
*/

export async function createTrackingAction(
  auth: AuthContext,

  input: CreateTrackingInput,
) {
  requirePermission(auth, PERMISSIONS.TRACKING_MANAGE);

  const company = await getTrackingCompany(auth, input.companyId);

  const today = getTodayInTimeZone(company.timezone);

  /*
   * No permitimos crear
   * una acción ya vencida.
   */
  if (input.dueDate < today) {
    throw new DomainError(
      "TRACKING_DUE_DATE_INVALID",

      "La fecha límite no puede ser anterior a hoy.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RECALCULAR IRI
  |--------------------------------------------------------------------------
  */

  const iriResult = await getIriDashboard({
    companyId: company.id,

    from: input.from,

    to: input.to,
  });

  const iriItem = iriResult.dashboard.items.find(
    (item) => item.id === input.inventoryItemId,
  );

  if (!iriItem || !iriItem.eligible || iriItem.stockQuantity <= 0) {
    throw new DomainError(
      "TRACKING_ITEM_INVALID",

      "El SKU no está disponible para generar seguimiento.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RECALCULAR RECOMENDACIÓN
  |--------------------------------------------------------------------------
  */

  const settings = await getCompanySettingsByCompanyId(company.id);

  const recommendation = calculateRecommendationForItem(
    iriItem,

    settings.recommendations,
  );

  const request = await getRequestMetadata();

  const now = new Date();

  return db.transaction(async (tx) => {
    /*
      |--------------------------------------------------------------------------
      | EVITAR SEGUIMIENTO PENDIENTE DUPLICADO
      |--------------------------------------------------------------------------
      */

    const [existing] = await tx
      .select({
        id: trackingActions.id,

        dueDate: trackingActions.dueDate,
      })
      .from(trackingActions)
      .where(
        and(
          eq(trackingActions.companyId, company.id),

          eq(trackingActions.inventoryItemId, iriItem.id),

          eq(trackingActions.status, "pending"),
        ),
      )
      .limit(1);

    if (existing) {
      throw new DomainError(
        "TRACKING_PENDING_EXISTS",

        "Este SKU ya tiene una acción de seguimiento pendiente.",
      );
    }

    /*
      |--------------------------------------------------------------------------
      | CREAR ACCIÓN
      |--------------------------------------------------------------------------
      */

    const [trackingAction] = await tx
      .insert(trackingActions)
      .values({
        companyId: company.id,

        inventoryItemId: iriItem.id,

        recommendationAction: recommendation.action,

        recommendationReason: recommendation.reason,

        iriValue: recommendation.iri,

        stockQuantity: recommendation.stockQuantity,

        unitCost: recommendation.unitCost,

        stockValue: recommendation.stockValue,

        coverageDays: recommendation.coverageDays,

        potentialRotationPercentage: recommendation.potentialRotationPercentage,

        analysisFrom: iriResult.filters.from,

        analysisTo: iriResult.filters.to,

        status: "pending",

        recommendationDate: now,

        dueDate: input.dueDate,

        notes: input.notes ?? null,

        createdBy: auth.userId,

        createdAt: now,

        updatedAt: now,
      })
      .returning();

    /*
      |--------------------------------------------------------------------------
      | ACTIVIDAD
      |--------------------------------------------------------------------------
      */

    await tx.insert(trackingActivities).values({
      companyId: company.id,

      trackingActionId: trackingAction.id,

      activityType: "created",

      description: `Se creó seguimiento para la recomendación "${recommendation.actionLabel}".`,

      metadata: {
        recommendationAction: recommendation.action,

        iri: recommendation.iri,

        dueDate: input.dueDate,

        stockValue: recommendation.stockValue,
      },

      userId: auth.userId,

      createdAt: now,
    });

    /*
      |--------------------------------------------------------------------------
      | AUDITORÍA
      |--------------------------------------------------------------------------
      */

    await tx.insert(auditLogs).values({
      companyId: company.id,

      userId: auth.userId,

      module: AUDIT_MODULES.TRACKING,

      action: AUDIT_ACTIONS.CREATE,

      entityType: "tracking_action",

      entityId: trackingAction.id,

      newValues: sanitizeAuditValue(trackingAction),

      metadata: {
        inventoryItemId: iriItem.id,

        sku: iriItem.sku,

        recommendationAction: recommendation.action,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return trackingAction;
  });
}

/*
|--------------------------------------------------------------------------
| MARCAR COMO EJECUTADA
|--------------------------------------------------------------------------
*/

export async function executeTrackingAction(
  auth: AuthContext,

  trackingActionId: string,
) {
  requirePermission(auth, PERMISSIONS.TRACKING_MANAGE);

  const request = await getRequestMetadata();

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(trackingActions)
      .where(eq(trackingActions.id, trackingActionId))
      .limit(1);

    if (!current) {
      throw new DomainError(
        "TRACKING_NOT_FOUND",

        "La acción de seguimiento no existe.",
      );
    }

    requireCompanyAccess(auth, current.companyId);

    /*
     * Operación idempotente.
     */
    if (current.status === "executed") {
      return current;
    }

    const now = new Date();

    const [updated] = await tx
      .update(trackingActions)
      .set({
        status: "executed",

        executedAt: now,

        executedBy: auth.userId,

        updatedAt: now,
      })
      .where(eq(trackingActions.id, trackingActionId))
      .returning();

    /*
    |--------------------------------------------------------------------------
    | CREAR CASO DE RECUPERACIÓN
    |--------------------------------------------------------------------------
    */

    const potentialRecoverableValue =
      Math.round(
        (updated.stockValue * (updated.potentialRotationPercentage / 100) +
          Number.EPSILON) *
          10000,
      ) / 10000;

    await tx
      .insert(recoveryCases)
      .values({
        companyId: updated.companyId,

        trackingActionId: updated.id,

        inventoryItemId: updated.inventoryItemId,

        recommendationAction: updated.recommendationAction,

        initialStockQuantity: updated.stockQuantity,

        initialUnitCost: updated.unitCost,

        initialStockValue: updated.stockValue,

        potentialRecoverableValue,

        status: "pending",

        startedAt: updated.executedAt ?? now,

        createdBy: updated.executedBy ?? auth.userId,

        createdAt: now,

        updatedAt: now,
      })
      .onConflictDoNothing({
        target: recoveryCases.trackingActionId,
      });

    /*
     * Actividad.
     */
    await tx.insert(trackingActivities).values({
      companyId: current.companyId,

      trackingActionId,

      activityType: "executed",

      description: "La acción fue marcada como ejecutada.",

      metadata: {
        previousStatus: current.status,

        newStatus: "executed",
      },

      userId: auth.userId,

      createdAt: now,
    });

    /*
     * Auditoría.
     */
    await tx.insert(auditLogs).values({
      companyId: current.companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.TRACKING,

      action: AUDIT_ACTIONS.EXECUTE,

      entityType: "tracking_action",

      entityId: trackingActionId,

      oldValues: sanitizeAuditValue(current),

      newValues: sanitizeAuditValue(updated),

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return updated;
  });
}

/*
|--------------------------------------------------------------------------
| CAMBIAR FECHA LÍMITE
|--------------------------------------------------------------------------
*/

export async function updateTrackingDueDate(
  auth: AuthContext,

  trackingActionId: string,

  dueDate: string,
) {
  requirePermission(auth, PERMISSIONS.TRACKING_MANAGE);

  const [current] = await db
    .select()
    .from(trackingActions)
    .where(eq(trackingActions.id, trackingActionId))
    .limit(1);

  if (!current) {
    throw new DomainError(
      "TRACKING_NOT_FOUND",

      "La acción de seguimiento no existe.",
    );
  }

  requireCompanyAccess(auth, current.companyId);

  if (current.status === "executed") {
    throw new DomainError(
      "TRACKING_ALREADY_EXECUTED",

      "No puedes modificar la fecha límite de una acción ejecutada.",
    );
  }

  /*
   * Zona horaria empresa.
   */
  const [company] = await db
    .select({
      timezone: companies.timezone,
    })
    .from(companies)
    .where(eq(companies.id, current.companyId))
    .limit(1);

  if (!company) {
    throw new DomainError(
      "TRACKING_COMPANY_INVALID",

      "La empresa no existe.",
    );
  }

  const today = getTodayInTimeZone(company.timezone);

  if (dueDate < today) {
    throw new DomainError(
      "TRACKING_DUE_DATE_INVALID",

      "La nueva fecha límite no puede ser anterior a hoy.",
    );
  }

  /*
   * Sin cambios.
   */
  if (current.dueDate === dueDate) {
    return current;
  }

  const request = await getRequestMetadata();

  const now = new Date();

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(trackingActions)
      .set({
        dueDate,

        updatedAt: now,
      })
      .where(eq(trackingActions.id, trackingActionId))
      .returning();

    await tx.insert(trackingActivities).values({
      companyId: current.companyId,

      trackingActionId,

      activityType: "due_date_changed",

      description: `La fecha límite cambió de ${current.dueDate} a ${dueDate}.`,

      metadata: {
        oldDueDate: current.dueDate,

        newDueDate: dueDate,
      },

      userId: auth.userId,

      createdAt: now,
    });

    await tx.insert(auditLogs).values({
      companyId: current.companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.TRACKING,

      action: AUDIT_ACTIONS.UPDATE,

      entityType: "tracking_action",

      entityId: trackingActionId,

      oldValues: {
        dueDate: current.dueDate,
      },

      newValues: {
        dueDate,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return updated;
  });
}

/*
|--------------------------------------------------------------------------
| AGREGAR OBSERVACIÓN
|--------------------------------------------------------------------------
*/

export async function addTrackingNote(
  auth: AuthContext,

  trackingActionId: string,

  note: string,
) {
  requirePermission(auth, PERMISSIONS.TRACKING_MANAGE);

  const [current] = await db
    .select({
      id: trackingActions.id,

      companyId: trackingActions.companyId,
    })
    .from(trackingActions)
    .where(eq(trackingActions.id, trackingActionId))
    .limit(1);

  if (!current) {
    throw new DomainError(
      "TRACKING_NOT_FOUND",

      "La acción de seguimiento no existe.",
    );
  }

  requireCompanyAccess(auth, current.companyId);

  const request = await getRequestMetadata();

  const now = new Date();

  return db.transaction(async (tx) => {
    const [activity] = await tx
      .insert(trackingActivities)
      .values({
        companyId: current.companyId,

        trackingActionId,

        activityType: "note_added",

        description: note,

        metadata: {
          note,
        },

        userId: auth.userId,

        createdAt: now,
      })
      .returning();

    /*
     * Marcamos acción como
     * recientemente actualizada.
     */
    await tx
      .update(trackingActions)
      .set({
        updatedAt: now,
      })
      .where(eq(trackingActions.id, trackingActionId));

    await tx.insert(auditLogs).values({
      companyId: current.companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.TRACKING,

      action: AUDIT_ACTIONS.UPDATE,

      entityType: "tracking_action",

      entityId: trackingActionId,

      metadata: {
        activityType: "note_added",

        note,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return activity;
  });
}
