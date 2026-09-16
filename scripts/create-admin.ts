import { config } from "dotenv";

config({
  path: ".env.local",
});

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;

  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  const fullName = process.env.BOOTSTRAP_ADMIN_NAME;

  if (!email || !password || !fullName) {
    throw new Error("Faltan variables BOOTSTRAP_ADMIN_*");
  }

  /*
   * Importamos después de cargar dotenv.
   */
  const { createAdminClient } = await import("../src/lib/supabase/admin");

  const { db } = await import("../src/db");

  const { profiles, auditLogs } = await import("../src/db/schema");

  const supabase = createAdminClient();

  console.log("Creando usuario Auth...");

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,

    email_confirm: true,

    user_metadata: {
      full_name: fullName,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Supabase no devolvió usuario");
  }

  try {
    await db.insert(profiles).values({
      id: data.user.id,
      fullName,
      role: "admin",
      status: "active",
    });

    await db.insert(auditLogs).values({
      userId: data.user.id,

      module: "auth",
      action: "bootstrap_admin",

      entityType: "user",
      entityId: data.user.id,
    });

    console.log("");
    console.log("✅ Administrador creado correctamente.");

    console.log(`Email: ${email}`);
  } catch (error) {
    /*
     * Si falla PostgreSQL eliminamos
     * el usuario Auth para evitar
     * una cuenta inconsistente.
     */
    await supabase.auth.admin.deleteUser(data.user.id);

    throw error;
  }
}

main().catch((error) => {
  console.error("");
  console.error("❌ Error creando administrador:");

  console.error(error);

  process.exit(1);
});
