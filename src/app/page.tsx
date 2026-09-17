import { redirect } from "next/navigation";

import { getCurrentAuthContext } from "@/server/services/auth.service";

export default async function HomePage() {
  const context = await getCurrentAuthContext();

  if (!context) {
    redirect("/login");
  }

  if (context.profile.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
