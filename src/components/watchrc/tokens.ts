// Shared design tokens for the Remote Flight demo.  Kept local to the
// component so the rest of the portfolio isn't affected.

// iOS system colors (dark appearance). These are the actual values Apple
// uses in Human Interface Guidelines for dark mode.
export const IOS = {
  bg:          "#000000",
  text:        "#FFFFFF",
  text2:       "#EBEBF5",     // label color, 60% opacity feel
  text3:       "#EBEBF599",   // tertiary label
  text4:       "#8E8E93",     // secondary gray
  fill1:       "#2C2C2EB3",
  fill2:       "#1C1C1E",
  fill3:       "#3A3A3C",
  blue:        "#0A84FF",
  blueSoft:    "#0A84FF33",
  red:         "#FF453A",
  redSoft:     "#FF453A26",
  orange:      "#FF9F0A",
  yellow:      "#FFD60A",
  green:       "#30D158",
  purple:      "#BF5AF2",
  teal:        "#40C8E0",
  divider:     "#38383A",
};

// Watch display dimensions — tuned for a visible-but-proportional demo.
// Apple Watch Series 10 45mm screen is 396×484 @2x (198×242 @1x pt).
// We render at ~1.4x to feel present on desktop without dominating the modal.
export const WATCH = {
  displayW: 264,
  displayH: 324,
  displayRadius: 44,
  bezel: 8,                // space between display and outer body
  chassisExtraX: 8,
  chassisExtraY: 14,
  chassisRadius: 56,
};

export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", system-ui, "Helvetica Neue", Helvetica, sans-serif';

// Motion presets — calibrated to "reads as iOS"
export const SPRING = {
  page:    { type: "spring" as const, stiffness: 340, damping: 32, mass: 0.9 },
  sheet:   { type: "spring" as const, stiffness: 380, damping: 34, mass: 0.95 },
  tap:     { type: "spring" as const, stiffness: 600, damping: 30 },
  number:  { type: "spring" as const, stiffness: 220, damping: 24 },
  soft:    { type: "spring" as const, stiffness: 180, damping: 22 },
};

// iOS easeOut (matches UIView.animate curve, exponential out)
export const EASE_IOS_OUT = [0.16, 1, 0.3, 1] as const;
