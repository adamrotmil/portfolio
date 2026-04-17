// CDS-inspired design tokens for the Ticker Sandbox.
//
// These aren't direct imports from @coinbase/cds-common (adding that whole
// package would be heavier than necessary for a demo and would fight with
// the rest of the portfolio's Tailwind styling). Instead, this is a light
// recreation of CDS's named-token vocabulary — bgPrimary/bgSecondary/
// fgPrimary/fgMuted/positive/negative/line/lineHeavy — tuned by hand to
// the hex values documented at cds.coinbase.com/getting-started/colors and
// in their open-source repo (github.com/coinbase/cds).
//
// Intentional light departures from CDS:
//   • Our "bgPrimary" is near-black so the chart canvas pops on a dark
//     modal, rather than CDS's default blue=fgPrimary semantic.  We keep
//     "blue70" as the accent color token.
//   • "positive/negative" stay close to the CDS green60/red60 choices.

export interface Palette {
  // Surfaces
  bgPrimary: string;        // modal background
  bgSecondary: string;      // sidebar surface, controls panel
  bgTertiary: string;       // raised element (inline pill, inset group)
  bgAlternate: string;      // subtle row surface
  // Text
  fgPrimary: string;        // body text, active state
  fgMuted: string;          // labels, captions
  fgSubtle: string;         // least-prominent labels
  fgInverse: string;        // text on a solid color surface
  // Lines + dividers
  line: string;             // hairline, 1px borders
  lineHeavy: string;        // emphatic dividers
  // Brand + status
  blue70: string;           // primary accent for action / focus
  green60: string;          // positive / bids
  red60: string;            // negative / asks / destructive
  orange70: string;         // warning
  positiveWash: string;     // background tint for positive levels
  negativeWash: string;     // background tint for negative levels
  warningWash: string;
  blueWash: string;         // focus/active pill backgrounds
}

export const PALETTE_DARK: Palette = {
  bgPrimary:    "#0A0B0D",        // near-black, sits under chart canvas
  bgSecondary:  "#151618",        // controls panel surface
  bgTertiary:   "#1F2023",        // inner tiles (action groups, sliders)
  bgAlternate:  "#26282C",
  fgPrimary:    "#F5F6F7",
  fgMuted:      "#9CA0A8",        // CDS gray60 neighborhood
  fgSubtle:     "#6A6E76",
  fgInverse:    "#0A0B0D",
  line:         "rgba(156,160,168,0.18)",
  lineHeavy:    "rgba(156,160,168,0.40)",
  blue70:       "#0052FF",        // Coinbase blue
  green60:      "#05B169",        // CDS positive on dark
  red60:        "#CF202F",
  orange70:     "#F5A623",
  positiveWash: "rgba(5,177,105,0.12)",
  negativeWash: "rgba(207,32,47,0.12)",
  warningWash:  "rgba(245,166,35,0.14)",
  blueWash:     "rgba(0,82,255,0.14)",
};

export const PALETTE_LIGHT: Palette = {
  bgPrimary:    "#FFFFFF",
  bgSecondary:  "#F5F6F7",
  bgTertiary:   "#EEF0F3",
  bgAlternate:  "#E3E6EB",
  fgPrimary:    "#0A0B0D",
  fgMuted:      "#5B616E",
  fgSubtle:     "#8A909D",
  fgInverse:    "#FFFFFF",
  line:         "rgba(10,11,13,0.10)",
  lineHeavy:    "rgba(10,11,13,0.25)",
  blue70:       "#0052FF",
  green60:      "#098551",
  red60:        "#CF202F",
  orange70:     "#B36A10",
  positiveWash: "rgba(9,133,81,0.10)",
  negativeWash: "rgba(207,32,47,0.10)",
  warningWash:  "rgba(179,106,16,0.12)",
  blueWash:     "rgba(0,82,255,0.10)",
};

export function palette(theme: "light" | "dark"): Palette {
  return theme === "dark" ? PALETTE_DARK : PALETTE_LIGHT;
}

// ---- Typography scale (CDS names) --------------------------------------
//
// CDS typography uses SF on Apple, Inter-like stack on web, and maps
// named variants to specific size+weight+tracking combos. Values below
// are close-enough to CDS's public documentation — matched visually
// from component screenshots in their docs.

export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Inter", "Helvetica Neue", Helvetica, system-ui, sans-serif';

export interface TypeStyle {
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform?: "uppercase";
}

export const TYPE: Record<
  "title3" | "headline" | "body" | "label1" | "label2" | "caption" | "legal" | "sectionLabel",
  TypeStyle
> = {
  title3:       { fontSize: 20, fontWeight: 600, lineHeight: 1.2, letterSpacing: -0.2 },
  headline:     { fontSize: 16, fontWeight: 600, lineHeight: 1.3, letterSpacing: -0.1 },
  body:         { fontSize: 14, fontWeight: 400, lineHeight: 1.4, letterSpacing: 0 },
  label1:       { fontSize: 13, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0 },
  label2:       { fontSize: 12, fontWeight: 500, lineHeight: 1.3, letterSpacing: 0 },
  caption:      { fontSize: 11, fontWeight: 400, lineHeight: 1.3, letterSpacing: 0 },
  legal:        { fontSize: 10, fontWeight: 400, lineHeight: 1.35, letterSpacing: 0 },
  // Custom: the ubiquitous uppercase-small-tracking section header
  sectionLabel: { fontSize: 10, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.6, textTransform: "uppercase" },
};

// Tabular numerals come up a lot (prices, sizes, CVD).  This is the
// CSS-variable equivalent of CDS's `data-variant="label1"` tnum behavior.
export const TNUM: React.CSSProperties = {
  fontFeatureSettings: '"tnum" 1, "cv11" 1',
  fontVariantNumeric: "tabular-nums",
};

// Shape / spacing
export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const MOTION = {
  // CDS-ish spring — stiffer than default Framer, slightly damped feel
  spring: { type: "spring" as const, stiffness: 420, damping: 32 },
  tap:    { type: "spring" as const, stiffness: 600, damping: 30 },
};
