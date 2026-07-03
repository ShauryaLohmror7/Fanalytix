import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
});

/** Engraved-serif display face for the royal gold identity. */
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-royal",
});

export const metadata: Metadata = {
  title: "FanalytiX — Witness any event",
  description:
    "Event intelligence, beautifully. Summon an event — a World Cup match today, markets and world moments tomorrow — and watch the world feel it live.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${cinzel.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
