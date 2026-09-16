import type {
  ReactNode,
} from "react";

import {
  type AppRole,
  type Permission,
  ROLE_PERMISSIONS,
} from "@/config/permissions";

type CanProps = {
  role: AppRole;
  permission: Permission;
  children: ReactNode;
};

export function Can({
  role,
  permission,
  children,
}: CanProps) {
  const allowed =
    ROLE_PERMISSIONS[role].includes(
      permission
    );

  if (!allowed) {
    return null;
  }

  return children;
}