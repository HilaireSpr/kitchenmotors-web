import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KitchenMotors",
  description: "Production planning for large kitchens",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="app-body">{children}</body>
    </html>
  );
}