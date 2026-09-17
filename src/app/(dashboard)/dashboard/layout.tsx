import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { UserShell } from "@/components/user/user-shell";

import { requireAuth } from "@/server/services/auth.service";

export default async function UserDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await requireAuth();

  /*
   * Un administrador utiliza
   * exclusivamente /admin.
   */
  if (auth.profile.role === "admin") {
    redirect("/admin");
  }

  /*
   * Un usuario normal siempre
   * debe tener empresa.
   */
  if (!auth.company) {
    redirect("/login");
  }

  return (
    <UserShell fullName={auth.profile.fullName} companyName={auth.company.name}>
      {children}
    </UserShell>
  );
}
