import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const globalForDatabase = globalThis as unknown as {
  agLegalPool?: Pool;
};

export const pool =
  globalForDatabase.agLegalPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: false,
  });

if (env.NODE_ENV !== "production") {
  globalForDatabase.agLegalPool = pool;
}

export const db = drizzle({ client: pool, schema });
