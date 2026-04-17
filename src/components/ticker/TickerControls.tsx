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

// Accent swatches — mapped to CDS-named tokens so the palette reads as
// "brand blues and greens" rather than a hand-picked rainbow.
const ACCENT_OPTIONS = [
  { hex: "#05B169", label: "Positive green" },      // CDS green60-ish
  { hex: "#0052FF", label: "Coinbase blue" },       // CDS blue70
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
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton
                theme={theme}
                tone="positive"
                onClick={() => demo.nudge(1)}
              >
                Buy
              </PrimaryButton>
              <PrimaryButton
                theme={theme}
                tone="negative"
                onClick={() => demo.nudge(-1)}
              >
                Sell
              </PrimaryButton>
            </div>
            <SecondaryButton
              theme={theme}
              active={demo.controls.paused}
              onClick={() => demo.setControls({ paused: !demo.controls.paused })}
              fullWidth
              style={{ marginTop: 8 }}
            >
              {demo.controls.paused ? "Resume stream" : "Pause stream"}
            </SecondaryButton>
          </Section>

          <Divider color={p.line} />

          <Section theme={theme} label="Volatility">
            <div className="flex items-baseline justify-between" style={{ marginBottom: 6 }}>
              <span style={{ ...TYPE.body, color: p.fgMuted }}>Intensity</span>
              <span
                style={{
                  ...TYPE.label1,
                  ...TNUM,
                  color: p.fgPrimary,
                }}
              >
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
              style={{ accentColor: p.blue70 }}
            />
            <div className="flex justify-between" style={{ ...TYPE.legal, color: p.fgSubtle, marginTop: 4 }}>
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
              background: p.positiveWash,
              color: p.green60,
              border: `1px solid ${p.green60}33`,
              borderRadius: RADIUS.sm,
              padding: "10px 12px",
              lineHeight: 1.5,
            }}
          >
            Streaming a public spot feed. Market actions and volatility are disabled on live markets — switch to{" "}
            <span style={{ fontWeight: 600 }}>Demo</span> to drive the line yourself.
          </div>
        </Section>
      )}

      <Section theme={theme} label="Display">
        <div className="flex flex-col gap-1.5">
          <ToggleRow theme={theme} label="Degen mode" value={degen} onToggle={setDegen} />
          <ToggleRow theme={theme} label="Exaggerate" value={exaggerate} onToggle={setExaggerate} />
          <ToggleRow theme={theme} label="Grid" value={showGrid} onToggle={setShowGrid} />
          <ToggleRow theme={theme} label="Area fill" value={showFill} onToggle={setShowFill} />
        </div>
      </Section>

      <Divider color={p.line} />

      <Section theme={theme} label="Appearance">
        <div className="grid grid-cols-2 gap-2" style={{ marginBottom: 10 }}>
          {(["dark", "light"] as const).map((t) => (
            <SecondaryButton
              key={t}
              theme={theme}
              active={theme === t}
              onClick={() => setTheme(t)}
            >
              {t === "dark" ? "Dark" : "Light"}
            </SecondaryButton>
          ))}
        </div>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 6 }}
        >
          <span style={{ ...TYPE.label2, color: p.fgMuted }}>Accent</span>
          <button
            onClick={resetAccent}
            style={{
              ...TYPE.legal,
              background: "transparent",
              border: "none",
              color: p.fgMuted,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Reset
          </button>
        </div>
        <div className="flex gap-2">
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
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: RADIUS.pill,
                  background: o.hex,
                  border: `2px solid ${active ? p.fgPrimary : "transparent"}`,
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      </Section>

      {demo && (
        <>
          <Divider color={p.line} />
          <Section theme={theme}>
            <SecondaryButton
              theme={theme}
              onClick={demo.reset}
              fullWidth
              muted
            >
              Reset demo ticker
            </SecondaryButton>
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
    <div style={{ padding: "14px 16px" }}>
      {label && (
        <div
          style={{
            ...TYPE.sectionLabel,
            textTransform: "uppercase",
            color: p.fgMuted,
            marginBottom: 10,
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

function PrimaryButton({
  theme,
  tone = "brand",
  children,
  onClick,
}: {
  theme: "light" | "dark";
  tone?: "brand" | "positive" | "negative";
  children: React.ReactNode;
  onClick: () => void;
}) {
  const p = palette(theme);
  const bg = tone === "positive" ? p.green60 : tone === "negative" ? p.red60 : p.blue70;
  const fg = "#FFFFFF";
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={MOTION.tap}
      style={{
        ...TYPE.label1,
        padding: "10px 14px",
        borderRadius: RADIUS.sm,
        background: bg,
        color: fg,
        border: "none",
        cursor: "pointer",
        width: "100%",
      }}
    >
      {children}
    </motion.button>
  );
}

function SecondaryButton({
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
      whileTap={{ scale: 0.97 }}
      transition={MOTION.tap}
      style={{
        ...TYPE.label1,
        padding: "9px 14px",
        borderRadius: RADIUS.sm,
        background: active ? p.blueWash : p.bgTertiary,
        color: active ? p.blue70 : muted ? p.fgMuted : p.fgPrimary,
        border: `1px solid ${active ? `${p.blue70}55` : p.line}`,
        cursor: "pointer",
        width: fullWidth ? "100%" : undefined,
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
      className="flex items-center justify-between py-1.5"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <span style={{ ...TYPE.body, color: value ? p.fgPrimary : p.fgMuted, fontWeight: value ? 500 : 400 }}>
        {label}
      </span>
      <motion.span
        aria-hidden
        animate={{ background: value ? p.blue70 : p.bgAlternate }}
        transition={{ duration: 0.2 }}
        style={{
          position: "relative",
          display: "inline-block",
          width: 34,
          height: 20,
          borderRadius: RADIUS.pill,
        }}
      >
        <motion.span
          animate={{ x: value ? 14 : 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: 16,
            height: 16,
            borderRadius: RADIUS.pill,
            background: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          }}
        />
      </motion.span>
    </button>
  );
}
