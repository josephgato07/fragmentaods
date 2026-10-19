import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Panel",
    template: "%s · Panel FRAGMENTADOS",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function PanelRaiz({ children }: { children: React.ReactNode }) {
  return children;
}
