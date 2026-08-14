import "server-only";

import { sql } from "drizzle-orm";

import { db, pool } from "@/db";
import { eventosSeguridad } from "@/db/schema";
import { hashIdentifier } from "@/lib/request-security";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface RateLimitRow {
  cantidad: number;
  expira_en: Date;
}

export async function consumeRateLimit(
  namespace: string,
  subject: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const key = `${namespace}:${hashIdentifier(subject)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  const result = await pool.query<RateLimitRow>(
    `
      INSERT INTO limites_peticion (clave, cantidad, ventana_inicia_en, expira_en)
      VALUES ($1, 1, $2, $3)
      ON CONFLICT (clave) DO UPDATE SET
        cantidad = CASE
          WHEN limites_peticion.expira_en <= $2 THEN 1
          ELSE limites_peticion.cantidad + 1
        END,
        ventana_inicia_en = CASE
          WHEN limites_peticion.expira_en <= $2 THEN $2
          ELSE limites_peticion.ventana_inicia_en
        END,
        expira_en = CASE
          WHEN limites_peticion.expira_en <= $2 THEN $3
          ELSE limites_peticion.expira_en
        END
      RETURNING cantidad, expira_en
    `,
    [key, now, expiresAt],
  );

  const row = result.rows[0];
  if (!row) throw new Error("No se pudo evaluar el límite de peticiones");

  if (Math.random() < 0.01) {
    void pool
      .query("DELETE FROM limites_peticion WHERE expira_en < NOW() - INTERVAL '1 day'")
      .catch(() => undefined);
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((new Date(row.expira_en).getTime() - Date.now()) / 1000),
  );

  return {
    allowed: row.cantidad <= limit,
    remaining: Math.max(0, limit - row.cantidad),
    retryAfterSeconds,
  };
}

export async function recordSecurityEvent(
  type: string,
  subject: string,
  successful: boolean,
): Promise<void> {
  await db.insert(eventosSeguridad).values({
    tipo: type.slice(0, 48),
    sujetoHash: hashIdentifier(subject),
    exitoso: successful,
  });
}

export async function purgeExpiredSecurityData(): Promise<void> {
  await db.execute(sql`DELETE FROM sesiones_administrador WHERE expira_en <= NOW()`);
  await db.execute(sql`DELETE FROM limites_peticion WHERE expira_en < NOW() - INTERVAL '1 day'`);
  await db.execute(sql`DELETE FROM eventos_seguridad WHERE creado_en < NOW() - INTERVAL '180 days'`);
}
