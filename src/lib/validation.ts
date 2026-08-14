import { z } from "zod";

export const CIUDADES = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Bucaramanga",
  "Cúcuta",
  "Pereira",
  "Ibagué",
  "Manizales",
  "Villavicencio",
  "Santa Marta",
  "Otra ciudad",
] as const;

export const ANIOS_CREDITO = [2002, 2003, 2004, 2005] as const;

const nombreCompletoSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .refine((value) => value.includes(" "), "Incluye al menos nombre y apellido.");

const celularSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().regex(/^3\d{9}$/));

export const solicitudSchema = z.object({
  nombre: nombreCompletoSchema,
  celular: celularSchema,
  ciudad: z.enum(CIUDADES),
  anio: z.number().int().refine((value) =>
    ANIOS_CREDITO.some((allowedYear) => allowedYear === value),
  ),
  consentimiento: z.literal(true),
  website: z.string().max(0).optional().default(""),
  formularioIniciadoEn: z.number().int().positive(),
});

export const loginSchema = z.object({
  usuario: z.string().trim().min(3).max(64),
  contrasena: z.string().min(1).max(256),
});

export type SolicitudInput = z.infer<typeof solicitudSchema>;
