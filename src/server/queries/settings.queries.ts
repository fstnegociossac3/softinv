import "server-only";

import { PERMISSIONS } from "@/config/permissions";

import { getManagedCompanySettings } from "@/server/services/settings.service";

import { requireAuth } from "@/server/services/auth.service";

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN DE EMPRESA
|--------------------------------------------------------------------------
|
| Solo el administrador tiene
| SETTINGS_VIEW actualmente.
|
*/

export async function getSettingsDashboard(companyId: string) {
  const auth = await requireAuth();

  return getManagedCompanySettings(auth, companyId, PERMISSIONS.SETTINGS_VIEW);
}
