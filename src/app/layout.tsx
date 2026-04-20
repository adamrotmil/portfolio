import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Swapping Instrument Serif + DM Sans for Geist Sans + Geist Mono —
// a purpose-designed pair (Vercel) tuned for technical-product UIs.
// Small sizes, pixel-aligned, tabular-friendly, matched proportions.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Adam Rotmil — Product Designer",
  description:
    "20 years of design leadership across AI, health tech, and finance. Currently building agentic systems and shipping code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
