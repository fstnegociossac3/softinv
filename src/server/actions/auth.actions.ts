"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/config/audit";

import { db } from "@/db";
import { companies, companyUsers, profiles } from "@/db/schema";

import { loginSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";

import { createAuditLog } from "@/server/services/audit.service";
import { getCurrentAuthContext } from "@/server/services/auth.service";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_form");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    redirect("/login?error=invalid_credentials");
  }

  const userId = data.user.id;

  const [account] = await db
    .select({
      profileId: profiles.id,
      fullName: profiles.fullName,
      role: profiles.role,
      profileStatus: profiles.status,

      companyId: companies.id,
      companyStatus: companies.status,
    })
    .from(profiles)
    .leftJoin(companyUsers, eq(companyUsers.userId, profiles.id))
    .leftJoin(companies, eq(companies.id, companyUsers.companyId))
    .where(eq(profiles.id, userId))
    .limit(1);

  /*
   * Cuenta Auth sin profile.
   */
  if (!account) {
    await supabase.auth.signOut();

    redirect("/login?error=account_not_configured");
  }

  /*
   * Usuario desactivado.
   */
  if (account.profileStatus !== "active") {
    await supabase.auth.signOut();

    redirect("/login?error=account_inactive");
  }

  /*
   * Usuario normal sin empresa
   * o empresa inactiva.
   */
  if (
    account.role === "user" &&
    (!account.companyId || account.companyStatus !== "active")
  ) {
    await supabase.auth.signOut();

    redirect("/login?error=company_inactive");
  }

  await createAuditLog({
    companyId: account.companyId ?? null,

    userId,

    module: AUDIT_MODULES.AUTH,
    action: AUDIT_ACTIONS.LOGIN,

    entityType: "user",
    entityId: userId,
  });

  if (account.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const context = await getCurrentAuthContext();

  if (context) {
    try {
      await createAuditLog({
        companyId: context.company?.id ?? null,

        userId: context.userId,

        module: AUDIT_MODULES.AUTH,
        action: AUDIT_ACTIONS.LOGOUT,

        entityType: "user",
        entityId: context.userId,
      });
    } catch (error) {
      console.error("Error registrando auditoría de logout:", error);

      if (error && typeof error === "object" && "cause" in error) {
        console.error("Causa PostgreSQL:", error.cause);
      }
    }
  }

  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}
