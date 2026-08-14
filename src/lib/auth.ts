import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cache } from "react";

import argon2 from "argon2";
import { and, eq, gt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { sesionesAdministrador } from "@/db/schema";
import { env } from "@/lib/env";
import { hashIdentifier } from "@/lib/request-security";

const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export const SESSION_COOKIE_NAME =
  env.NODE_ENV === "production" ? "__Host-aglegal_session" : "aglegal_session";

function sessionTokenHash(token: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(`session:${token}`).digest("hex");
}

function constantTimeUsernameMatch(received: string): boolean {
  const expectedHash = createHmac("sha256", env.AUTH_SECRET)
    .update(env.ADMIN_USERNAME)
    .digest();
  const receivedHash = createHmac("sha256", env.AUTH_SECRET).update(received).digest();
  return timingSafeEqual(expectedHash, receivedHash);
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const [usernameMatches, passwordMatches] = await Promise.all([
    Promise.resolve(constantTimeUsernameMatch(username)),
    argon2.verify(env.ADMIN_PASSWORD_HASH, password),
  ]);

  return usernameMatches && passwordMatches;
}

export async function createAdminSession(ipHash: string, userAgentHash: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await db.transaction(async (transaction) => {
    await transaction.delete(sesionesAdministrador);
    await transaction.insert(sesionesAdministrador).values({
      tokenHash: sessionTokenHash(token),
      ipHash,
      userAgentHash,
      expiraEn: expiresAt,
    });
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
    priority: "high",
  });
}

export const getAdminSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token || token.length < 40 || token.length > 100) return null;

  const requestHeaders = await headers();
  const currentUserAgentHash = hashIdentifier(
    `ua:${requestHeaders.get("user-agent")?.slice(0, 512) || "unknown"}`,
  );

  const session = await db.query.sesionesAdministrador.findFirst({
    where: and(
      eq(sesionesAdministrador.tokenHash, sessionTokenHash(token)),
      eq(sesionesAdministrador.userAgentHash, currentUserAgentHash),
      gt(sesionesAdministrador.expiraEn, new Date()),
    ),
    columns: {
      id: true,
      expiraEn: true,
    },
  });

  if (!session) return null;

  await db
    .update(sesionesAdministrador)
    .set({ ultimaActividadEn: new Date() })
    .where(eq(sesionesAdministrador.id, session.id));

  return { id: session.id, username: env.ADMIN_USERNAME, expiresAt: session.expiraEn };
});

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) redirect("/panel/login");
  return session;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db
      .delete(sesionesAdministrador)
      .where(eq(sesionesAdministrador.tokenHash, sessionTokenHash(token)));
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
