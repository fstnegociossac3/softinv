import type { ReactNode } from "react";

import { requireAuth } from "@/server/services/auth.service";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();

  return <>{children}</>;
}
