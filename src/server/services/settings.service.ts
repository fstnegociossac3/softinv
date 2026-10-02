import "server-only";

import { eq } from "drizzle-orm";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/config/audit";

import { type Permission } from "@/config/permissions";

import { db } from "@/db";

import { auditLogs, companies, companySettings } from "@/db/schema";

import { createDefaultCompanySettings } from "@/lib/settings/defaults";

import type {
  IriSettingsConfig,
  NotificationSettingsConfig,
  RecommendationSettingsConfig,
  ResolvedCompanySettings,
  TrafficLightSettingsConfig,
} from "@/lib/settings/types";

import { DomainError } from "@/server/errors/domain.error";

import type { AuthContext } from "@/server/services/auth.service";

import {
  requireCompanyAccess,
  requirePermission,
} from "@/server/services/authorization.service";

import { sanitizeAuditValue } from "@/server/utils/audit-sanitizer";

import { getRequestMetadata } from "@/server/utils/request-metadata";

/*
|--------------------------------------------------------------------------
| LOAD RAW
|--------------------------------------------------------------------------
*/

async function loadStoredSettings(companyId: string) {
  const [stored] = await db
    .select()
    .from(companySettings)
    .where(eq(companySettings.companyId, companyId))
    .limit(1);

  return stored ?? null;
}

/*
|--------------------------------------------------------------------------
| RESOLVER DEFAULTS
|--------------------------------------------------------------------------
*/

function resolveSettings(
  stored: typeof companySettings.$inferSelect | null,
): ResolvedCompanySettings {
  const defaults = createDefaultCompanySettings();

  if (!stored) {
    return defaults;
  }

  return {
    iri: {
      ...defaults.iri,
      ...stored.iriConfig,

      weights: {
        ...defaults.iri.weights,
        ...stored.iriConfig.weights,
      },

      thresholds: {
        ...defaults.iri.thresholds,

        ...stored.iriConfig.thresholds,
      },
    },

    recommendations: {
      ...defaults.recommendations,
      ...stored.recommendationConfig,
    },

    trafficLights: {
      coverage: {
        ...defaults.trafficLights.coverage,

        ...stored.trafficLightConfig.coverage,
      },

      tracking: {
        ...defaults.trafficLights.tracking,

        ...stored.trafficLightConfig.tracking,
      },

      recovery: {
        ...defaults.trafficLights.recovery,

        ...stored.trafficLightConfig.recovery,
      },
    },

    notifications: {
      ...defaults.notifications,
      ...stored.notificationConfig,
    },
  };
}

/*
|--------------------------------------------------------------------------
| USO INTERNO
|--------------------------------------------------------------------------
|
| Esta función NO hace autorización.
|
| Debe utilizarse después de que
| el caller ya haya resuelto la empresa.
|
| IRI
| Recomendaciones
| Seguimiento
| Reportes
|
*/

export async function getCompanySettingsByCompanyId(
  companyId: string,
): Promise<ResolvedCompanySettings> {
  const stored = await loadStoredSettings(companyId);

  return resolveSettings(stored);
}

/*
|--------------------------------------------------------------------------
| EMPRESA VÁLIDA
|--------------------------------------------------------------------------
*/

async function requireActiveCompany(companyId: string) {
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
      "SETTINGS_COMPANY_INVALID",

      "La empresa seleccionada no existe o está inactiva.",
    );
  }

  return company;
}

/*
|--------------------------------------------------------------------------
| LECTURA PARA CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

export async function getManagedCompanySettings(
  auth: AuthContext,

  companyId: string,

  permission: Permission,
) {
  requirePermission(auth, permission);

  requireCompanyAccess(auth, companyId);

  const company = await requireActiveCompany(companyId);

  const stored = await loadStoredSettings(companyId);

  return {
    company,

    customized: Boolean(stored),

    settings: resolveSettings(stored),

    updatedAt: stored?.updatedAt ?? null,

    updatedBy: stored?.updatedBy ?? null,
  };
}

/*
|--------------------------------------------------------------------------
| SAVE
|--------------------------------------------------------------------------
*/

type SettingsSectionMap = {
  iri: IriSettingsConfig;

  recommendations: RecommendationSettingsConfig;

  trafficLights: TrafficLightSettingsConfig;

  notifications: NotificationSettingsConfig;
};

async function updateSettingsSection<TSection extends keyof SettingsSectionMap>(
  auth: AuthContext,

  companyId: string,

  section: TSection,

  config: SettingsSectionMap[TSection],

  permission: Permission,
) {
  requirePermission(auth, permission);

  requireCompanyAccess(auth, companyId);

  await requireActiveCompany(companyId);

  const current = await getCompanySettingsByCompanyId(companyId);

  const next: ResolvedCompanySettings = {
    ...current,

    [section]: config,
  } as ResolvedCompanySettings;

  const request = await getRequestMetadata();

  const now = new Date();

  return db.transaction(async (tx) => {
    const [saved] = await tx
      .insert(companySettings)
      .values({
        companyId,

        iriConfig: next.iri,

        recommendationConfig: next.recommendations,

        trafficLightConfig: next.trafficLights,

        notificationConfig: next.notifications,

        updatedBy: auth.userId,

        createdAt: now,

        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: companySettings.companyId,

        set: {
          iriConfig: next.iri,

          recommendationConfig: next.recommendations,

          trafficLightConfig: next.trafficLights,

          notificationConfig: next.notifications,

          updatedBy: auth.userId,

          updatedAt: now,
        },
      })
      .returning();

    await tx.insert(auditLogs).values({
      companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.SETTINGS,

      action: AUDIT_ACTIONS.CONFIGURE,

      entityType: "company_settings",

      entityId: saved.id,

      oldValues: sanitizeAuditValue({
        section,

        value: current[section],
      }),

      newValues: sanitizeAuditValue({
        section,

        value: next[section],
      }),

      metadata: {
        section,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return {
      record: saved,

      settings: next,
    };
  });
}

/*
|--------------------------------------------------------------------------
| UPDATE IRI
|--------------------------------------------------------------------------
*/

export function updateCompanyIriSettings(
  auth: AuthContext,

  companyId: string,

  config: IriSettingsConfig,

  permission: Permission,
) {
  return updateSettingsSection(auth, companyId, "iri", config, permission);
}

/*
|--------------------------------------------------------------------------
| UPDATE RECOMENDACIONES
|--------------------------------------------------------------------------
*/

export function updateCompanyRecommendationSettings(
  auth: AuthContext,

  companyId: string,

  config: RecommendationSettingsConfig,

  permission: Permission,
) {
  return updateSettingsSection(
    auth,
    companyId,
    "recommendations",
    config,
    permission,
  );
}

/*
|--------------------------------------------------------------------------
| UPDATE SEMÁFOROS
|--------------------------------------------------------------------------
*/

export function updateCompanyTrafficLightSettings(
  auth: AuthContext,

  companyId: string,

  config: TrafficLightSettingsConfig,

  permission: Permission,
) {
  return updateSettingsSection(
    auth,
    companyId,
    "trafficLights",
    config,
    permission,
  );
}

/*
|--------------------------------------------------------------------------
| UPDATE NOTIFICACIONES
|--------------------------------------------------------------------------
*/

export function updateCompanyNotificationSettings(
  auth: AuthContext,

  companyId: string,

  config: NotificationSettingsConfig,

  permission: Permission,
) {
  return updateSettingsSection(
    auth,
    companyId,
    "notifications",
    config,
    permission,
  );
}
