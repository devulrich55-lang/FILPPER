import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flliter Mobile",
  description: "Sécurité et suivi d'appareils — Flliter Mobile",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
