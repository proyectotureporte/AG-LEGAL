import { eq } from "drizzle-orm";

import { db } from "@/db";
import { solicitudes } from "@/db/schema";
import { sendSolicitudNotification } from "@/lib/email";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  getRequestFingerprint,
  isSafeJsonMutation,
  noStoreJson,
} from "@/lib/request-security";
import { solicitudSchema } from "@/lib/validation";

const MINIMUM_COMPLETION_TIME_MS = 1_500;
const MAXIMUM_COMPLETION_TIME_MS = 2 * 60 * 60 * 1_000;

export async function POST(request: Request) {
  if (!isSafeJsonMutation(request)) {
    return noStoreJson({ error: "Solicitud no autorizada." }, { status: 403 });
  }

  const { ipHash } = getRequestFingerprint(request);
  const limit = await consumeRateLimit("solicitud-15m", ipHash, 8, 15 * 60);
  const dailyLimit = await consumeRateLimit("solicitud-dia", ipHash, 40, 24 * 60 * 60);
  if (!limit.allowed || !dailyLimit.allowed) {
    const retryAfter = Math.max(limit.retryAfterSeconds, dailyLimit.retryAfterSeconds);
    return noStoreJson(
      { error: "Has realizado demasiados intentos. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "Datos inválidos." }, { status: 400 });
  }

  const parsed = solicitudSchema.safeParse(body);
  if (!parsed.success) {
    return noStoreJson({ error: "Revisa los campos del formulario." }, { status: 400 });
  }

  const elapsed = Date.now() - parsed.data.formularioIniciadoEn;
  const suspiciousTiming =
    elapsed < MINIMUM_COMPLETION_TIME_MS || elapsed > MAXIMUM_COMPLETION_TIME_MS;

  // Los bots reciben la misma respuesta que una solicitud válida para no revelar la trampa.
  if (parsed.data.website || suspiciousTiming) {
    return noStoreJson({ ok: true }, { status: 201 });
  }

  try {
    const now = new Date();
    const [created] = await db
      .insert(solicitudes)
      .values({
        nombre: parsed.data.nombre,
        celular: parsed.data.celular,
        ciudad: parsed.data.ciudad,
        anioCredito: parsed.data.anio,
        consentimiento: true,
        consentimientoFecha: now,
      })
      .returning({
        id: solicitudes.id,
        nombre: solicitudes.nombre,
        celular: solicitudes.celular,
        ciudad: solicitudes.ciudad,
        anio: solicitudes.anioCredito,
        creadoEn: solicitudes.creadoEn,
      });

    if (!created) throw new Error("No se creó la solicitud");

    try {
      const emailStatus = await sendSolicitudNotification(created);
      await db
        .update(solicitudes)
        .set({ estadoCorreo: emailStatus })
        .where(eq(solicitudes.id, created.id));
    } catch {
      await db
        .update(solicitudes)
        .set({ estadoCorreo: "error" })
        .where(eq(solicitudes.id, created.id));
    }

    return noStoreJson({ ok: true }, { status: 201 });
  } catch {
    return noStoreJson(
      { error: "No fue posible registrar tu solicitud. Inténtalo nuevamente." },
      { status: 503 },
    );
  }
}
