import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

// Nunito is used as a fallback — visually close to Circe (rounded humanist sans).
// On Foxford infrastructure, replace this with the Foxford Circe CDN <link> tag.
const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Фоксфорд Методист",
  description: "ИИ-помощник для учителей",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={nunito.variable}>
      <body className={nunito.className}>{children}</body>
    </html>
  );
}
