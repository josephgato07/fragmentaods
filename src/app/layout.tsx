import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow/800.css";
import "@fontsource/barlow/900.css";
import "@fontsource/barlow-condensed/700-italic.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import { SITE_URL, publicRobots } from "@/lib/seo";

/**
 * Layout raíz: solo documento, fuentes y estilos base.
 * El portal público usa app/(portal)/layout.tsx y el panel, app/panel/layout.tsx.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FRAGMENTADOS",
    template: "%s · FRAGMENTADOS",
  },
  description: "Portal periodístico digital: noticias completas y fragmentos informativos breves.",
  robots: publicRobots(),
  openGraph: { type: "website", siteName: "FRAGMENTADOS", locale: "es_UY" },
};

export const viewport: Viewport = {
  themeColor: "#F4F1E8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-UY">
      <body>{children}</body>
    </html>
  );
}
