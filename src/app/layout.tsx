import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lashab Auto-école · Sidi Bel Abbès — Apprenez le code de la route",
  description:
    "Auto-école Lashab à Sidi Bel Abbès depuis 1986. Code de la route en français et en arabe : 169 panneaux, 50 scénarios animés en 3D et examen blanc. Tél : 0557 29 71 79.",
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
