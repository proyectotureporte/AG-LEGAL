import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel administrativo · AG Legal",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
