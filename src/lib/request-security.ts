import "server-only";

import { createHmac } from "node:crypto";

import { env } from "@/lib/env";

const MAX_JSON_BYTES = 8 * 1024;

export function hashIdentifier(value: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(value).digest("hex");
}

export function getClientIp(request: Request): string {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function getRequestFingerprint(request: Request) {
  const ipHash = hashIdentifier(`ip:${getClientIp(request)}`);
  const userAgentHash = hashIdentifier(
    `ua:${request.headers.get("user-agent")?.slice(0, 512) || "unknown"}`,
  );
  return { ipHash, userAgentHash };
}

export function isSafeJsonMutation(request: Request): boolean {
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/json")) return false;

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BYTES) return false;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  try {
    const receivedOrigin = new URL(origin);
    const expectedOrigin = new URL(env.APP_URL);

    if (receivedOrigin.origin === expectedOrigin.origin) return true;

    return (
      env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1"].includes(receivedOrigin.hostname)
    );
  } catch {
    return false;
  }
}

export function noStoreJson(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return Response.json(body, { ...init, headers });
}
