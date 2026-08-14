import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL no está configurada");
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const database = drizzle({ client: pool });

  try {
    await migrate(database, { migrationsFolder: "drizzle" });
    console.log("Migraciones aplicadas correctamente.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falló la migración");
  process.exitCode = 1;
});
