"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/config/permissions";

import {
  updateIriSettingsSchema,
  updateNotificationSettingsSchema,
  updateRecommendationSettingsSchema,
  updateTrafficLightSettingsSchema,
} from "@/lib/validations/settings";

import { requireAuth } from "@/server/services/auth.service";

import {
  updateCompanyIriSettings,
  updateCompanyNotificationSettings,
  updateCompanyRecommendationSettings,
  updateCompanyTrafficLightSettings,
} from "@/server/services/settings.service";

import type { ActionResult } from "@/server/types/action-result";

import { getActionErrorMessage } from "@/server/utils/action-error";

/*
|--------------------------------------------------------------------------
| REVALIDATE
|--------------------------------------------------------------------------
*/

function revalidateSettingsDependencies() {
  revalidatePath("/settings");

  revalidatePath("/iri");

  revalidatePath("/recommendations");

  revalidatePath("/tracking");

  revalidatePath("/recovery");

  revalidatePath("/reports");
}

/*
|--------------------------------------------------------------------------
| IRI
|--------------------------------------------------------------------------
*/

export async function updateIriSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = updateIriSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "Revisa la configuración del IRI.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    await updateCompanyIriSettings(
      auth,
      parsed.data.companyId,
      parsed.data.config,
      PERMISSIONS.IRI_CONFIGURE,
    );

    revalidateSettingsDependencies();

    return {
      success: true,

      message: "Configuración IRI actualizada.",
    };
  } catch (error) {
    return {
      success: false,

      message: getActionErrorMessage(error),
    };
  }
}

/*
|--------------------------------------------------------------------------
| RECOMENDACIONES
|--------------------------------------------------------------------------
*/

export async function updateRecommendationSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = updateRecommendationSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "Revisa la configuración de recomendaciones.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    await updateCompanyRecommendationSettings(
      auth,
      parsed.data.companyId,
      parsed.data.config,
      PERMISSIONS.RECOMMENDATION_CONFIGURE,
    );

    revalidateSettingsDependencies();

    return {
      success: true,

      message: "Reglas de recomendaciones actualizadas.",
    };
  } catch (error) {
    return {
      success: false,

      message: getActionErrorMessage(error),
    };
  }
}

/*
|--------------------------------------------------------------------------
| SEMÁFOROS
|--------------------------------------------------------------------------
*/

export async function updateTrafficLightSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = updateTrafficLightSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "Revisa la configuración de semáforos.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    await updateCompanyTrafficLightSettings(
      auth,
      parsed.data.companyId,
      parsed.data.config,
      PERMISSIONS.TRAFFIC_LIGHT_CONFIGURE,
    );

    revalidateSettingsDependencies();

    return {
      success: true,

      message: "Semáforos actualizados.",
    };
  } catch (error) {
    return {
      success: false,

      message: getActionErrorMessage(error),
    };
  }
}

/*
|--------------------------------------------------------------------------
| NOTIFICACIONES
|--------------------------------------------------------------------------
*/

export async function updateNotificationSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = updateNotificationSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,

      message: "Revisa la configuración de notificaciones.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await requireAuth();

    await updateCompanyNotificationSettings(
      auth,
      parsed.data.companyId,
      parsed.data.config,
      PERMISSIONS.NOTIFICATION_CONFIGURE,
    );

    revalidateSettingsDependencies();

    return {
      success: true,

      message: "Notificaciones actualizadas.",
    };
  } catch (error) {
    return {
      success: false,

      message: getActionErrorMessage(error),
    };
  }
}
