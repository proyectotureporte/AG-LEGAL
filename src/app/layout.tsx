import type { Metadata, Viewport } from "next";

import { headers } from "next/headers";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aglegal.com.co"),
  title: "AG Legal · Revisión de créditos UVR",
  description:
    "Revisión documental y jurídica de créditos UVR para vivienda de interés social adquirida entre 2002 y 2005.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="es-CO">
      <body>
        {children}
        <script
          defer
          src="https://restaurar.co/m.js"
          data-site="aglegal"
          data-exclude="/panel,/api"
          nonce={nonce}
        />
      </body>
    </html>
  );
}
