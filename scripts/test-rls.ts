import { randomUUID } from "node:crypto";

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { inArray } from "drizzle-orm";

config({
  path: ".env.local",
});

async function main() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const publishableKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Faltan variables de Supabase."
    );
  }

  const {
    createAdminClient,
  } = await import(
    "../src/lib/supabase/admin"
  );

  const {
    db,
  } = await import("../src/db");

  const {
    companies,
    profiles,
    companyUsers,
  } = await import(
    "../src/db/schema"
  );

  const adminClient =
    createAdminClient();

  const suffix = Date.now();

  const password =
    `Rls-${randomUUID()}-Aa1!`;

  const userAEmail =
    `rls-a-${suffix}@example.com`;

  const userBEmail =
    `rls-b-${suffix}@example.com`;

  const adminEmail =
    `rls-admin-${suffix}@example.com`;

  const authUserIds: string[] = [];
  const companyIds: string[] = [];

  try {
    /*
     * Crear usuarios Auth.
     */
    const userA =
      await adminClient.auth.admin.createUser({
        email: userAEmail,
        password,
        email_confirm: true,
      });

    const userB =
      await adminClient.auth.admin.createUser({
        email: userBEmail,
        password,
        email_confirm: true,
      });

    const testAdmin =
      await adminClient.auth.admin.createUser({
        email: adminEmail,
        password,
        email_confirm: true,
      });

    if (
      userA.error ||
      userB.error ||
      testAdmin.error
    ) {
      throw new Error(
        "No se pudieron crear usuarios de prueba."
      );
    }

    const userAId =
      userA.data.user!.id;

    const userBId =
      userB.data.user!.id;

    const adminId =
      testAdmin.data.user!.id;

    authUserIds.push(
      userAId,
      userBId,
      adminId
    );

    /*
     * Crear empresas.
     */
    const [companyA, companyB] =
      await db
        .insert(companies)
        .values([
          {
            name: "RLS Empresa A",
            status: "active",
          },
          {
            name: "RLS Empresa B",
            status: "active",
          },
        ])
        .returning();

    companyIds.push(
      companyA.id,
      companyB.id
    );

    /*
     * Profiles.
     */
    await db.insert(profiles).values([
      {
        id: userAId,
        fullName: "RLS Usuario A",
        role: "user",
        status: "active",
      },
      {
        id: userBId,
        fullName: "RLS Usuario B",
        role: "user",
        status: "active",
      },
      {
        id: adminId,
        fullName: "RLS Admin",
        role: "admin",
        status: "active",
      },
    ]);

    /*
     * Asociación empresarial.
     */
    await db
      .insert(companyUsers)
      .values([
        {
          userId: userAId,
          companyId: companyA.id,
        },
        {
          userId: userBId,
          companyId: companyB.id,
        },
      ]);

    function publicClient() {
      return createClient(
        url!,
        publishableKey!,
        {
          auth: {
            persistSession: false,
          },
        }
      );
    }

    /*
     * USER A
     */
    const clientA = publicClient();

    await clientA.auth.signInWithPassword({
      email: userAEmail,
      password,
    });

    const resultA =
      await clientA
        .from("companies")
        .select("id,name");

    if (resultA.error) {
      throw resultA.error;
    }

    console.log(
      "Usuario A ve:",
      resultA.data
    );

    if (
      resultA.data.length !== 1 ||
      resultA.data[0].id !== companyA.id
    ) {
      throw new Error(
        "❌ Usuario A rompió aislamiento."
      );
    }

    /*
     * USER B
     */
    const clientB = publicClient();

    await clientB.auth.signInWithPassword({
      email: userBEmail,
      password,
    });

    const resultB =
      await clientB
        .from("companies")
        .select("id,name");

    if (resultB.error) {
      throw resultB.error;
    }

    console.log(
      "Usuario B ve:",
      resultB.data
    );

    if (
      resultB.data.length !== 1 ||
      resultB.data[0].id !== companyB.id
    ) {
      throw new Error(
        "❌ Usuario B rompió aislamiento."
      );
    }

    /*
     * ADMIN
     */
    const clientAdmin =
      publicClient();

    await clientAdmin.auth
      .signInWithPassword({
        email: adminEmail,
        password,
      });

    const adminCompanies =
      await clientAdmin
        .from("companies")
        .select("id,name")
        .in("id", [
          companyA.id,
          companyB.id,
        ]);

    if (adminCompanies.error) {
      throw adminCompanies.error;
    }

    if (
      adminCompanies.data.length !== 2
    ) {
      throw new Error(
        "❌ Admin no puede visualizar todas las empresas."
      );
    }

    /*
     * Usuario normal no puede leer auditoría.
     */
    const auditTest =
      await clientA
        .from("audit_logs")
        .select("id");

    if (
      !auditTest.error &&
      auditTest.data.length > 0
    ) {
      throw new Error(
        "❌ Usuario normal accedió a auditoría."
      );
    }

    /*
     * No puede crear empresa directamente.
     */
    const insertTest =
      await clientA
        .from("companies")
        .insert({
          name: "Empresa prohibida",
        });

    if (!insertTest.error) {
      throw new Error(
        "❌ Usuario pudo insertar empresa directamente."
      );
    }

    console.log("");
    console.log(
      "✅ RLS multiempresa funcionando correctamente."
    );
  } finally {
    /*
     * Limpieza PostgreSQL.
     */
    if (authUserIds.length) {
      await db
        .delete(profiles)
        .where(
          inArray(
            profiles.id,
            authUserIds
          )
        );
    }

    if (companyIds.length) {
      await db
        .delete(companies)
        .where(
          inArray(
            companies.id,
            companyIds
          )
        );
    }

    /*
     * Limpieza Supabase Auth.
     */
    for (
      const id of authUserIds
    ) {
      await adminClient.auth.admin
        .deleteUser(id);
    }
  }
}

main().catch((error) => {
  console.error("");
  console.error(
    "❌ Error en test RLS:"
  );

  console.error(error);

  process.exit(1);
});