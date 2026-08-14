import { sql } from "drizzle-orm";

import { db } from "@/db";
import { noStoreJson } from "@/lib/request-security";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return noStoreJson({ status: "ok" });
  } catch {
    return noStoreJson({ status: "unavailable" }, { status: 503 });
  }
}
