import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";

config({
  path: ".env.local",
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL no está definida en .env.local"
  );
}

const client = postgres(connectionString, {
  prepare: false,
  max: 1,
});

const db = drizzle(client);

async function testConnection() {
  try {
    const result = await db.execute(sql`
      SELECT
        1 AS ok,
        current_database() AS database_name,
        now() AS server_time
    `);

    console.log("");
    console.log("✅ Conexión a Supabase PostgreSQL correcta.");
    console.log("");

    console.table(result);
  } catch (error) {
    console.error("");
    console.error("❌ Error conectando con PostgreSQL:");
    console.error(error);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

testConnection();