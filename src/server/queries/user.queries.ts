import "server-only";

import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";

import { companies, companyUsers, profiles } from "@/db/schema";

import { PERMISSIONS } from "@/config/permissions";

import { createAdminClient } from "@/lib/supabase/admin";

import { requireAuth } from "@/server/services/auth.service";

import { requirePermission } from "@/server/services/authorization.service";

// LISTADO DE USUARIOS
type UserFilters = {
  search?: string;

  status?: "active" | "inactive";

  companyId?: string;

  page?: number;
  pageSize?: number;
};

export async function getUsers(filters: UserFilters = {}) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.USER_VIEW_ANY);

  const page = Math.max(filters.page ?? 1, 1);

  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);

  const conditions = [eq(profiles.role, "user")];

  if (filters.search) {
    conditions.push(
      or(
        ilike(profiles.fullName, `%${filters.search}%`),
        ilike(companies.name, `%${filters.search}%`),
      )!,
    );
  }

  if (filters.status) {
    conditions.push(eq(profiles.status, filters.status));
  }

  if (filters.companyId) {
    conditions.push(eq(companyUsers.companyId, filters.companyId));
  }

  const where = and(...conditions);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: profiles.id,

        fullName: profiles.fullName,

        status: profiles.status,

        role: profiles.role,

        createdAt: profiles.createdAt,

        companyId: companies.id,

        companyName: companies.name,

        companyStatus: companies.status,
      })
      .from(profiles)

      .leftJoin(companyUsers, eq(companyUsers.userId, profiles.id))

      .leftJoin(companies, eq(companies.id, companyUsers.companyId))

      .where(where)

      .orderBy(desc(profiles.createdAt))

      .limit(pageSize)

      .offset((page - 1) * pageSize),

    db
      .select({
        total: count(),
      })
      .from(profiles)
      .leftJoin(companyUsers, eq(companyUsers.userId, profiles.id))
      .leftJoin(companies, eq(companies.id, companyUsers.companyId))
      .where(where),
  ]);

  /*
   * El email vive en Supabase Auth.
   */
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    console.error("No se pudieron obtener emails:", error);
  }

  const emailById = new Map(
    (data?.users ?? []).map((user) => [user.id, user.email ?? null]),
  );

  return {
    data: rows.map((row) => ({
      ...row,

      email: emailById.get(row.id) ?? null,
    })),

    total: totalRows[0]?.total ?? 0,

    page,
    pageSize,
  };
}

// OBTENER USUARIO DE MANERA INDIVIDUAL
export async function getUserById(userId: string) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.USER_VIEW_ANY);

  const [user] = await db
    .select({
      id: profiles.id,

      fullName: profiles.fullName,

      role: profiles.role,

      status: profiles.status,

      createdAt: profiles.createdAt,

      updatedAt: profiles.updatedAt,

      companyId: companies.id,

      companyName: companies.name,

      companyStatus: companies.status,
    })
    .from(profiles)

    .leftJoin(companyUsers, eq(companyUsers.userId, profiles.id))

    .leftJoin(companies, eq(companies.id, companyUsers.companyId))

    .where(eq(profiles.id, userId))

    .limit(1);

  if (!user || user.role !== "user") {
    return null;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.error(error);
  }

  return {
    ...user,

    email: data?.user?.email ?? null,
  };
}
