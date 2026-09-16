import {
  type AppRole,
  type Permission,
  ROLE_PERMISSIONS,
} from "@/config/permissions";

import { AuthorizationError } from "@/server/errors/authorization.error";

import { type AuthContext } from "@/server/services/auth.service";

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getPermissionsForRole(role: AppRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function requirePermission(auth: AuthContext, permission: Permission) {
  if (!hasPermission(auth.profile.role, permission)) {
    throw new AuthorizationError();
  }
}

export function canAccessCompany(
  auth: AuthContext,
  companyId: string,
): boolean {
  if (auth.profile.role === "admin") {
    return true;
  }

  return auth.company?.id === companyId;
}

export function requireCompanyAccess(auth: AuthContext, companyId: string) {
  if (!canAccessCompany(auth, companyId)) {
    throw new AuthorizationError("No tienes acceso a esta empresa.");
  }
}

export function resolveCompanyId(
  auth: AuthContext,
  requestedCompanyId?: string | null,
): string {
  /*
   * Usuario normal:
   * siempre se usa su empresa.
   */
  if (auth.profile.role === "user") {
    if (!auth.company) {
      throw new AuthorizationError("El usuario no tiene empresa asignada.");
    }

    return auth.company.id;
  }

  /*
   * Administrador:
   * debe seleccionar una empresa
   * cuando la operación lo requiera.
   */
  if (!requestedCompanyId) {
    throw new AuthorizationError("Debes seleccionar una empresa.");
  }

  return requestedCompanyId;
}

export function hasEveryPermission(role: AppRole, permissions: Permission[]) {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function hasAnyPermission(role: AppRole, permissions: Permission[]) {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function requireEveryPermission(
  auth: AuthContext,
  permissions: Permission[],
) {
  if (!hasEveryPermission(auth.profile.role, permissions)) {
    throw new AuthorizationError();
  }
}
