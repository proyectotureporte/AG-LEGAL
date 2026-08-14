import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aglegal.restaurar.co"),
  title: "AG Legal · Revisión de créditos UVR",
  description:
    "Revisión documental y jurídica de créditos UVR para vivienda de interés social adquirida entre 2002 y 2005.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body>{children}</body>
    </html>
  );
}
