import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow/800.css";
import "@fontsource/barlow/900.css";
import "@fontsource/barlow-condensed/700-italic.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";

/**
 * Layout raíz: solo documento, fuentes y estilos base.
 * El portal público usa app/(portal)/layout.tsx y el panel, app/panel/layout.tsx.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "FRAGMENTADOS",
    template: "%s · FRAGMENTADOS",
  },
  description: "Portal periodístico digital: noticias completas y fragmentos informativos breves.",
  // Mientras sea una demo, que los buscadores no la indexen.
  robots: { index: false, follow: false },
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
