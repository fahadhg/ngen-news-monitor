import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NGen Manufacturing News",
  description: "Daily manufacturing news across 5 verticals, curated for NGen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
