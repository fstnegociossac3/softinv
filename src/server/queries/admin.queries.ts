import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";

import { companies, companyUsers, profiles } from "@/db/schema";

export async function getAdminDashboardOverview() {
  const companyRows = await db
    .select({
      id: companies.id,

      name: companies.name,

      ruc: companies.ruc,

      status: companies.status,

      createdAt: companies.createdAt,

      totalCount: sql<number>`
          (count(*) over ())::int
        `,

      activeCount: sql<number>`
          (
            count(*) filter (
              where ${companies.status} = 'active'
            ) over ()
          )::int
        `,
    })
    .from(companies)
    .orderBy(desc(companies.createdAt))
    .limit(5);

  const userRows = await db
    .select({
      id: profiles.id,

      fullName: profiles.fullName,

      status: profiles.status,

      createdAt: profiles.createdAt,

      companyName: companies.name,

      totalCount: sql<number>`
          (count(*) over ())::int
        `,

      activeCount: sql<number>`
          (
            count(*) filter (
              where ${profiles.status} = 'active'
            ) over ()
          )::int
        `,
    })
    .from(profiles)
    .leftJoin(companyUsers, eq(companyUsers.userId, profiles.id))
    .leftJoin(companies, eq(companies.id, companyUsers.companyId))
    .where(eq(profiles.role, "user"))
    .orderBy(desc(profiles.createdAt))
    .limit(5);

  const companyStats = companyRows[0];

  const userStats = userRows[0];

  const recentCompanies = companyRows.map((company) => ({
    id: company.id,

    name: company.name,

    ruc: company.ruc,

    status: company.status,

    createdAt: company.createdAt,
  }));

  const recentUsers = userRows.map((user) => ({
    id: user.id,

    fullName: user.fullName,

    status: user.status,

    createdAt: user.createdAt,

    companyName: user.companyName,
  }));

  return {
    stats: {
      companies: companyStats?.totalCount ?? 0,

      activeCompanies: companyStats?.activeCount ?? 0,

      users: userStats?.totalCount ?? 0,

      activeUsers: userStats?.activeCount ?? 0,
    },

    recentCompanies,

    recentUsers,
  };
}
