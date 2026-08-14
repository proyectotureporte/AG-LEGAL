import "server-only";

import { Resend } from "resend";

import { env } from "@/lib/env";

interface SolicitudEmail {
  id: string;
  nombre: string;
  celular: string;
  ciudad: string;
  anio: number;
  creadoEn: Date;
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ] || character,
  );

export async function sendSolicitudNotification(
  solicitud: SolicitudEmail,
): Promise<"enviado" | "omitido"> {
  if (!env.RESEND_API_KEY) return "omitido";

  const resend = new Resend(env.RESEND_API_KEY);
  const fecha = solicitud.creadoEn.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "long",
    timeStyle: "short",
  });

  const { error } = await resend.emails.send(
    {
      from: env.EMAIL_FROM,
      to: [env.FORM_NOTIFICATION_EMAIL],
      subject: `Nueva solicitud AG Legal · ${solicitud.nombre}`,
      text: [
        "Nueva solicitud de revisión de crédito UVR",
        `Nombre: ${solicitud.nombre}`,
        `Celular/WhatsApp: ${solicitud.celular}`,
        `Ciudad: ${solicitud.ciudad}`,
        `Año del crédito: ${solicitud.anio}`,
        `Fecha: ${fecha}`,
        `Identificador: ${solicitud.id}`,
      ].join("\n"),
      html: `
        <h1>Nueva solicitud de revisión</h1>
        <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse">
          <tr><th align="left">Nombre</th><td>${escapeHtml(solicitud.nombre)}</td></tr>
          <tr><th align="left">Celular/WhatsApp</th><td>${escapeHtml(solicitud.celular)}</td></tr>
          <tr><th align="left">Ciudad</th><td>${escapeHtml(solicitud.ciudad)}</td></tr>
          <tr><th align="left">Año del crédito</th><td>${solicitud.anio}</td></tr>
          <tr><th align="left">Fecha</th><td>${escapeHtml(fecha)}</td></tr>
        </table>
      `,
      tags: [{ name: "source", value: "aglegal_form" }],
    },
    { idempotencyKey: `aglegal-solicitud-${solicitud.id}` },
  );

  if (error) throw new Error("El proveedor de correo rechazó la notificación");
  return "enviado";
}
