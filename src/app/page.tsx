import { redirect } from "next/navigation";

import { getCurrentAuthContext } from "@/server/services/auth.service";

export default async function HomePage() {
  const context = await getCurrentAuthContext();

  if (context) {
    redirect("/dashboard");
  }

  redirect("/login");
}
