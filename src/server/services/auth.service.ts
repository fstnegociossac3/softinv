import { cache } from "react";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { companies, companyUsers, profiles } from "@/db/schema";

import { createClient } from "@/lib/supabase/server";

export type AuthContext = {
  userId: string;

  profile: {
    id: string;
    fullName: string;
    role: "admin" | "user";
    status: "active" | "inactive";
  };

  company: {
    id: string;
    name: string;
    status: "active" | "inactive";
  } | null;
};

async function loadCurrentAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  const userId = data.claims.sub;

  const [result] = await db
    .select({
      profileId: profiles.id,

      fullName: profiles.fullName,

      role: profiles.role,

      profileStatus: profiles.status,

      companyId: companies.id,

      companyName: companies.name,

      companyStatus: companies.status,
    })
    .from(profiles)
    .leftJoin(companyUsers, eq(companyUsers.userId, profiles.id))
    .leftJoin(companies, eq(companies.id, companyUsers.companyId))
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!result) {
    return null;
  }

  if (result.profileStatus !== "active") {
    return null;
  }

  /*
   * ADMIN
   *
   * Puede existir sin empresa
   * asignada.
   */
  if (result.role === "admin") {
    return {
      userId,

      profile: {
        id: result.profileId,
        fullName: result.fullName,
        role: result.role,
        status: result.profileStatus,
      },

      company: result.companyId
        ? {
            id: result.companyId,

            name: result.companyName!,

            status: result.companyStatus!,
          }
        : null,
    };
  }

  /*
   * USER
   *
   * Debe tener empresa
   * y esta debe estar activa.
   */
  if (!result.companyId || result.companyStatus !== "active") {
    return null;
  }

  return {
    userId,

    profile: {
      id: result.profileId,

      fullName: result.fullName,

      role: result.role,

      status: result.profileStatus,
    },

    company: {
      id: result.companyId,

      name: result.companyName!,

      status: result.companyStatus!,
    },
  };
}

/*
 * React cache evita repetir
 * la consulta de autenticación
 * dentro de la misma request.
 */
export const getCurrentAuthContext = cache(loadCurrentAuthContext);

export async function requireAuth(): Promise<AuthContext> {
  const context = await getCurrentAuthContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireAdmin(): Promise<AuthContext> {
  const context = await requireAuth();

  if (context.profile.role !== "admin") {
    redirect("/dashboard");
  }

  return context;
}
