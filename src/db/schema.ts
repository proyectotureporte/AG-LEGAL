import {
  bigint,
  boolean,
  char,
  index,
  integer,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const solicitudes = pgTable(
  "solicitudes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nombre: varchar("nombre", { length: 120 }).notNull(),
    celular: varchar("celular", { length: 15 }).notNull(),
    ciudad: varchar("ciudad", { length: 80 }).notNull(),
    anioCredito: smallint("anio_credito").notNull(),
    consentimiento: boolean("consentimiento").notNull(),
    consentimientoFecha: timestamp("consentimiento_fecha", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    estadoCorreo: varchar("estado_correo", { length: 24 })
      .notNull()
      .default("pendiente"),
    creadoEn: timestamp("creado_en", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("solicitudes_creado_en_idx").on(table.creadoEn),
    index("solicitudes_celular_idx").on(table.celular),
  ],
);

export const sesionesAdministrador = pgTable(
  "sesiones_administrador",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: char("token_hash", { length: 64 }).notNull(),
    ipHash: char("ip_hash", { length: 64 }).notNull(),
    userAgentHash: char("user_agent_hash", { length: 64 }).notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    ultimaActividadEn: timestamp("ultima_actividad_en", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    expiraEn: timestamp("expira_en", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("sesiones_administrador_token_hash_uidx").on(table.tokenHash),
    index("sesiones_administrador_expira_en_idx").on(table.expiraEn),
  ],
);

export const limitesPeticion = pgTable(
  "limites_peticion",
  {
    clave: varchar("clave", { length: 160 }).primaryKey(),
    cantidad: integer("cantidad").notNull(),
    ventanaIniciaEn: timestamp("ventana_inicia_en", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    expiraEn: timestamp("expira_en", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [index("limites_peticion_expira_en_idx").on(table.expiraEn)],
);

export const eventosSeguridad = pgTable(
  "eventos_seguridad",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    tipo: varchar("tipo", { length: 48 }).notNull(),
    sujetoHash: char("sujeto_hash", { length: 64 }).notNull(),
    exitoso: boolean("exitoso").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("eventos_seguridad_creado_en_idx").on(table.creadoEn)],
);

export type Solicitud = typeof solicitudes.$inferSelect;
