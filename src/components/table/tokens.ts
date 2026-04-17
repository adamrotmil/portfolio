// Design tokens for the Table operations deck.
//
// Rule of thumb: near-black ground, quiet 1px lines, monospace numerics,
// sparing accent.  We don't costume the UI ("classified" banners etc.) —
// the density of data + precision of typography does the talking.
//
// Colors tuned against #0a0c0f so the accent greens/ambers feel like
// annunciator lights on matte instrumentation, not nightclub neon.

export const TABLE = {
  // Ground
  bg: "#0a0c0f",            // base
  bgPanel: "#0f1216",       // raised panel / strip
  bgPanelHi: "#131721",     // hover / selected row
  bgScrim: "rgba(10,12,15,0.72)",

  // Line work — purposefully low contrast, stacks without noise
  line: "rgba(255,255,255,0.06)",
  lineStrong: "rgba(255,255,255,0.12)",
  lineAccent: "rgba(200,230,255,0.22)",

  // Text
  fg: "#e6e8ea",            // primary
  fgMute: "#8a8f96",        // secondary / labels
  fgSubtle: "#565b63",      // caption / tertiary
  fgDisabled: "#383b41",

  // Annunciators — subdued, operational palette
  cyan: "#86d9ff",          // idle / neutral reading
  amber: "#f2b24a",         // elevated
  red: "#ef5a5a",           // critical
  green: "#4ad68a",         // ok / online
  violet: "#a48cff",        // rare / special

  // Ops accents — for live markers, selected target, etc.
  accent: "#86d9ff",
  accentDim: "rgba(134,217,255,0.4)",
  accentGhost: "rgba(134,217,255,0.08)",

  // Radii — tight.  No pill-shaped rounding except for status dots.
  rSm: 2,
  rMd: 3,
  rLg: 4,
} as const;

// Typographic primitives — used inline across the deck.
export const T = {
  // Numeric readouts.  SF Mono-style monospace; tnum; tight tracking.
  numeric: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontVariantNumeric: "tabular-nums",
    fontFeatureSettings: '"tnum"',
  },
  // Labels — uppercase, very tight tracking, xs size.
  label: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "9.5px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.09em",
    fontWeight: 600,
  },
  // Caption — smaller than label; used for meta dashes.
  caption: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "9px",
    letterSpacing: "0.04em",
  },
  // Body type — sans, for blurbs / dossier prose.
  body: {
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
    fontSize: "12px",
    lineHeight: 1.45,
  },
  // Display — serif, used sparingly for target codename headers.
  display: {
    fontFamily: "var(--font-instrument-serif), Georgia, serif",
    fontWeight: 400,
    letterSpacing: "-0.01em",
  },
} as const;
