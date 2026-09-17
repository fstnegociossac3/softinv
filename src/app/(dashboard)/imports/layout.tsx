import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { UserShell } from "@/components/user/user-shell";

import { requireAuth } from "@/server/services/auth.service";

export default async function ImportsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await requireAuth();

  if (auth.profile.role === "admin") {
    return (
      <AdminShell fullName={auth.profile.fullName} role={auth.profile.role}>
        {children}
      </AdminShell>
    );
  }

  if (!auth.company) {
    redirect("/login");
  }

  return (
    <UserShell fullName={auth.profile.fullName} companyName={auth.company.name}>
      {children}
    </UserShell>
  );
}
