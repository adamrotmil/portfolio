import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Licensed Schick Toikka faces, self-hosted under /public/fonts.
// Wiring: next/font/local gives us font-display: swap + preload hints
// + a CSS variable we can route through Tailwind's theme.

const saolDisplay = localFont({
  variable: "--font-saol-display",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/saol-display-regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/saol-display-semibold.otf",
      weight: "600",
      style: "normal",
    },
  ],
});

const saolText = localFont({
  variable: "--font-saol-text",
  display: "swap",
  src: "../../public/fonts/saol-text-regular.otf",
  weight: "400",
  style: "normal",
});

const noeText = localFont({
  variable: "--font-noe-text",
  display: "swap",
  src: "../../public/fonts/noe-text-regular.otf",
  weight: "400",
  style: "normal",
});

// Krana Fat A (condensed) and Krana Fat B (extended) are sibling display
// faces designed to be mixed per-letter — that's the whole point of the
// pair. Loading them as two separate families so a word can combine
// both: <span class="font-krana-a">A</span><span class="font-krana-b">d</span>...
const kranaA = localFont({
  variable: "--font-krana-a",
  display: "swap",
  src: "../../public/fonts/krana-fat-a.otf",
  weight: "400",
  style: "normal",
});

const kranaB = localFont({
  variable: "--font-krana-b",
  display: "swap",
  src: "../../public/fonts/krana-fat-b.otf",
  weight: "400",
  style: "normal",
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
      <body
        className={`${saolDisplay.variable} ${saolText.variable} ${noeText.variable} ${kranaA.variable} ${kranaB.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
