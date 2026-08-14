CREATE TABLE "eventos_seguridad" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "eventos_seguridad_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tipo" varchar(48) NOT NULL,
	"sujeto_hash" char(64) NOT NULL,
	"exitoso" boolean NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "limites_peticion" (
	"clave" varchar(160) PRIMARY KEY NOT NULL,
	"cantidad" integer NOT NULL,
	"ventana_inicia_en" timestamp with time zone NOT NULL,
	"expira_en" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sesiones_administrador" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" char(64) NOT NULL,
	"ip_hash" char(64) NOT NULL,
	"user_agent_hash" char(64) NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"ultima_actividad_en" timestamp with time zone DEFAULT now() NOT NULL,
	"expira_en" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solicitudes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"celular" varchar(15) NOT NULL,
	"ciudad" varchar(80) NOT NULL,
	"anio_credito" smallint NOT NULL,
	"consentimiento" boolean NOT NULL,
	"consentimiento_fecha" timestamp with time zone NOT NULL,
	"estado_correo" varchar(24) DEFAULT 'pendiente' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "eventos_seguridad_creado_en_idx" ON "eventos_seguridad" USING btree ("creado_en");--> statement-breakpoint
CREATE INDEX "limites_peticion_expira_en_idx" ON "limites_peticion" USING btree ("expira_en");--> statement-breakpoint
CREATE UNIQUE INDEX "sesiones_administrador_token_hash_uidx" ON "sesiones_administrador" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sesiones_administrador_expira_en_idx" ON "sesiones_administrador" USING btree ("expira_en");--> statement-breakpoint
CREATE INDEX "solicitudes_creado_en_idx" ON "solicitudes" USING btree ("creado_en");--> statement-breakpoint
CREATE INDEX "solicitudes_celular_idx" ON "solicitudes" USING btree ("celular");