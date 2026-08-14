import { destroyAdminSession, getAdminSession } from "@/lib/auth";
import { isSafeJsonMutation, noStoreJson } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSafeJsonMutation(request)) {
    return noStoreJson({ error: "Solicitud no autorizada." }, { status: 403 });
  }
  if (await getAdminSession()) await destroyAdminSession();
  return noStoreJson({ ok: true });
}
