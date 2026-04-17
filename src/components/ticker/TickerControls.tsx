"use client";

import { motion } from "motion/react";
import type { DemoTickerApi } from "@/ticker/useDemoTicker";
import { palette, TYPE, TNUM, RADIUS, MOTION, FONT_STACK } from "./cdsTokens";

interface Props {
  demo?: DemoTickerApi;
  isLive: boolean;
  degen: boolean;
  setDegen: (v: boolean) => void;
  theme: "light" | "dark";
  setTheme: (v: "light" | "dark") => void;
  exaggerate: boolean;
  setExaggerate: (v: boolean) => void;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  showFill: boolean;
  setShowFill: (v: boolean) => void;
  accent: string;
  setAccent: (v: string) => void;
  resetAccent: () => void;
}

// Accent palette — neutral-adjacent brand colors, presented as thin rings
// so they read as a choice indicator rather than a candy shop.
const ACCENT_OPTIONS = [
  { hex: "#0052FF", label: "Coinbase blue" },
  { hex: "#05B169", label: "Positive green" },
  { hex: "#F7931A", label: "Bitcoin orange" },
  { hex: "#627EEA", label: "Ethereum violet" },
  { hex: "#14F195", label: "Solana mint" },
];

export default function TickerControls({
  demo,
  isLive,
  degen,
  setDegen,
  theme,
  setTheme,
  exaggerate,
  setExaggerate,
  showGrid,
  setShowGrid,
  showFill,
  setShowFill,
  accent,
  setAccent,
  resetAccent,
}: Props) {
  const p = palette(theme);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: p.bgSecondary,
        color: p.fgPrimary,
        border: `1px solid ${p.line}`,
        borderRadius: RADIUS.md,
        fontFamily: FONT_STACK,
      }}
    >
      {demo && (
        <>
          <Section theme={theme} label="Market">
            <div className="grid grid-cols-2" style={{ gap: 6 }}>
              <GhostButton theme={theme} onClick={() => demo.nudge(1)}>Buy</GhostButton>
              <GhostButton theme={theme} onClick={() => demo.nudge(-1)}>Sell</GhostButton>
            </div>
            <GhostButton
              theme={theme}
              fullWidth
              muted
              active={demo.controls.paused}
              onClick={() => demo.setControls({ paused: !demo.controls.paused })}
              style={{ marginTop: 6 }}
            >
              {demo.controls.paused ? "Resume stream" : "Pause stream"}
            </GhostButton>
          </Section>

          <Divider color={p.line} />

          <Section theme={theme} label="Volatility">
            <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
              <span style={{ ...TYPE.body, color: p.fgMuted }}>Intensity</span>
              <span style={{ ...TYPE.label1, ...TNUM, color: p.fgPrimary }}>
                {demo.controls.volatility.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={demo.controls.volatility}
              onChange={(e) => demo.setControls({ volatility: parseFloat(e.target.value) })}
              className="w-full"
              style={{ accentColor: p.fgPrimary }}
            />
            <div
              className="flex justify-between"
              style={{ ...TYPE.legal, color: p.fgSubtle, marginTop: 6 }}
            >
              <span>Calm</span>
              <span>Chaos</span>
            </div>
          </Section>

          <Divider color={p.line} />
        </>
      )}

      {isLive && (
        <Section theme={theme}>
          <div
            style={{
              ...TYPE.caption,
              color: p.fgMuted,
              lineHeight: 1.45,
            }}
          >
            Streaming a public spot feed.  Market actions and volatility are
            disabled on live markets — switch to{" "}
            <span style={{ color: p.fgPrimary, fontWeight: 500 }}>Demo</span>{" "}
            to drive the line yourself.
          </div>
        </Section>
      )}

      <Section theme={theme} label="Display">
        <div className="flex flex-col" style={{ gap: 6 }}>
          <ToggleRow theme={theme} label="Degen mode" value={degen} onToggle={setDegen} />
          <ToggleRow theme={theme} label="Exaggerate" value={exaggerate} onToggle={setExaggerate} />
          <ToggleRow theme={theme} label="Grid" value={showGrid} onToggle={setShowGrid} />
          <ToggleRow theme={theme} label="Area fill" value={showFill} onToggle={setShowFill} />
        </div>
      </Section>

      <Divider color={p.line} />

      <Section theme={theme} label="Theme">
        <div className="grid grid-cols-2" style={{ gap: 6 }}>
          {(["dark", "light"] as const).map((t) => (
            <GhostButton
              key={t}
              theme={theme}
              active={theme === t}
              onClick={() => setTheme(t)}
            >
              {t === "dark" ? "Dark" : "Light"}
            </GhostButton>
          ))}
        </div>
      </Section>

      <Section theme={theme} label="Accent">
        <div className="flex items-center" style={{ gap: 10 }}>
          {ACCENT_OPTIONS.map((o) => {
            const active = accent === o.hex;
            return (
              <motion.button
                key={o.hex}
                onClick={() => setAccent(o.hex)}
                whileTap={{ scale: 0.9 }}
                transition={MOTION.tap}
                title={o.label}
                aria-label={o.label}
                aria-pressed={active}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: RADIUS.pill,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  // Ring gets colored + heavier when selected
                  border: `${active ? 1.5 : 1}px solid ${active ? o.hex : p.lineHeavy}`,
                  padding: 0,
                  cursor: "pointer",
                  transition: "border-color 160ms ease, border-width 160ms ease",
                }}
              >
                {/* Subtle inner dot, always visible but grows on select */}
                <span
                  aria-hidden
                  style={{
                    display: "block",
                    borderRadius: RADIUS.pill,
                    background: o.hex,
                    width: active ? 8 : 5,
                    height: active ? 8 : 5,
                    opacity: active ? 1 : 0.7,
                    transition: "width 160ms ease, height 160ms ease, opacity 160ms ease",
                  }}
                />
              </motion.button>
            );
          })}
          <span style={{ flex: 1 }} />
          <button
            onClick={resetAccent}
            style={{
              ...TYPE.legal,
              background: "transparent",
              border: "none",
              color: p.fgSubtle,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Reset
          </button>
        </div>
      </Section>

      {demo && (
        <>
          <Divider color={p.line} />
          <Section theme={theme}>
            <GhostButton theme={theme} fullWidth muted onClick={demo.reset}>
              Reset demo
            </GhostButton>
          </Section>
        </>
      )}
    </div>
  );
}

// ---- Subcomponents -----------------------------------------------------

function Section({
  theme,
  label,
  children,
}: {
  theme: "light" | "dark";
  label?: string;
  children: React.ReactNode;
}) {
  const p = palette(theme);
  return (
    <div style={{ padding: "16px 16px 18px" }}>
      {label && (
        <div
          style={{
            ...TYPE.sectionLabel,
            textTransform: "uppercase",
            color: p.fgSubtle,
            marginBottom: 12,
          }}
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function Divider({ color }: { color: string }) {
  return <div aria-hidden style={{ height: 1, background: color }} />;
}

/**
 * Neutral button — the workhorse for this panel.  Two states:
 *   default → hairline border, transparent fill, fg text
 *   active  → slightly raised on bgTertiary, bordered with fgPrimary
 * No color accents, no bold blocks of fill.  The one piece of colored
 * expression in the sandbox is the chart line itself.
 */
function GhostButton({
  theme,
  active = false,
  muted = false,
  onClick,
  fullWidth = false,
  style,
  children,
}: {
  theme: "light" | "dark";
  active?: boolean;
  muted?: boolean;
  onClick: () => void;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const p = palette(theme);
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      transition={MOTION.tap}
      style={{
        ...TYPE.label2,
        padding: "7px 12px",
        borderRadius: RADIUS.sm,
        background: active ? p.bgTertiary : "transparent",
        color: active ? p.fgPrimary : muted ? p.fgMuted : p.fgPrimary,
        border: `1px solid ${active ? p.fgMuted : p.line}`,
        cursor: "pointer",
        width: fullWidth ? "100%" : undefined,
        transition: "background 140ms ease, border-color 140ms ease, color 140ms ease",
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

function ToggleRow({
  theme,
  label,
  value,
  onToggle,
}: {
  theme: "light" | "dark";
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  const p = palette(theme);
  return (
    <button
      onClick={() => onToggle(!value)}
      className="flex items-center justify-between"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "4px 0",
        width: "100%",
      }}
    >
      <span
        style={{
          ...TYPE.body,
          color: value ? p.fgPrimary : p.fgMuted,
        }}
      >
        {label}
      </span>
      <motion.span
        aria-hidden
        animate={{ background: value ? p.fgPrimary : p.bgAlternate }}
        transition={{ duration: 0.2 }}
        style={{
          position: "relative",
          display: "inline-block",
          width: 28,
          height: 16,
          borderRadius: RADIUS.pill,
        }}
      >
        <motion.span
          animate={{ x: value ? 12 : 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: 12,
            height: 12,
            borderRadius: RADIUS.pill,
            background: value ? p.bgSecondary : p.fgMuted,
          }}
        />
      </motion.span>
    </button>
  );
}
