import "server-only";

import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().startsWith("postgresql://"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4009),
  APP_URL: z.url(),
  ADMIN_USERNAME: z.string().min(3).max(64),
  ADMIN_PASSWORD_HASH: z.string().startsWith("$argon2id$").min(50),
  AUTH_SECRET: z.string().min(64),
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  EMAIL_FROM: z.string().min(5).max(180),
  FORM_NOTIFICATION_EMAIL: z.email(),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const fields = parsedEnvironment.error.issues
    .map((issue) => issue.path.join("."))
    .filter(Boolean)
    .join(", ");
  throw new Error(`Configuración de servidor inválida. Revisa: ${fields}`);
}

export const env = parsedEnvironment.data;
