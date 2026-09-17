import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";

import { requireAdmin } from "@/server/services/auth.service";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await requireAdmin();

  return (
    <AdminShell fullName={auth.profile.fullName} role={auth.profile.role}>
      {children}
    </AdminShell>
  );
}
