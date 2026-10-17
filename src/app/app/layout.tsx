import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace élève · Lashab Auto-école",
  description: "Entraînez-vous au code de la route avec 169 panneaux et 50 scénarios animés, en français et en arabe.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
