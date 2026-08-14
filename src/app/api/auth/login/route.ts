import { createAdminSession, verifyAdminCredentials } from "@/lib/auth";
import { consumeRateLimit, recordSecurityEvent } from "@/lib/rate-limit";
import {
  getRequestFingerprint,
  isSafeJsonMutation,
  noStoreJson,
} from "@/lib/request-security";
import { loginSchema } from "@/lib/validation";

const FAILURE_DELAY_MS = 650;

export async function POST(request: Request) {
  const startedAt = Date.now();
  const failure = async (status = 401) => {
    const remainingDelay = FAILURE_DELAY_MS - (Date.now() - startedAt);
    if (remainingDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    }
    return noStoreJson({ error: "Usuario o contraseña incorrectos." }, { status });
  };

  if (!isSafeJsonMutation(request)) return failure(403);

  const { ipHash, userAgentHash } = getRequestFingerprint(request);
  const ipLimit = await consumeRateLimit("login-ip-15m", ipHash, 8, 15 * 60);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure(400);
  }

  const parsed = loginSchema.safeParse(body);
  const username = parsed.success ? parsed.data.usuario : "invalid";
  const accountLimit = await consumeRateLimit(
    "login-cuenta-15m",
    `${ipHash}:${username.toLocaleLowerCase("es")}`,
    5,
    15 * 60,
  );

  if (!ipLimit.allowed || !accountLimit.allowed) {
    await recordSecurityEvent("login-rate-limit", ipHash, false);
    const response = await failure(429);
    response.headers.set(
      "Retry-After",
      String(Math.max(ipLimit.retryAfterSeconds, accountLimit.retryAfterSeconds)),
    );
    return response;
  }

  if (!parsed.success) {
    await recordSecurityEvent("login-fallido", ipHash, false);
    return failure();
  }

  const valid = await verifyAdminCredentials(parsed.data.usuario, parsed.data.contrasena);
  await recordSecurityEvent("login", ipHash, valid);
  if (!valid) return failure();

  await createAdminSession(ipHash, userAgentHash);
  return noStoreJson({ ok: true });
}
