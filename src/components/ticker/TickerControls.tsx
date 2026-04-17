"use client";

import { motion } from "motion/react";
import type { DemoTickerApi } from "@/ticker/useDemoTicker";

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

const ACCENT_OPTIONS = [
  { hex: "#00D395", label: "Coinbase green" },
  { hex: "#1652F0", label: "Coinbase blue" },
  { hex: "#F7931A", label: "Bitcoin orange" },
  { hex: "#627EEA", label: "Ethereum purple" },
  { hex: "#BF5AF2", label: "Degen purple" },
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
  const surfaceBg = theme === "dark" ? "#17171a" : "#fafafa";
  const surfaceFg = theme === "dark" ? "#e5e5ea" : "#1a1a1c";
  const labelColor = theme === "dark" ? "#9a9aa0" : "#6b6b70";
  const border = theme === "dark" ? "#2a2a2e" : "#e5e5ea";

  return (
    <div
      className="flex flex-col gap-4 p-4 rounded-[12px]"
      style={{
        background: surfaceBg,
        color: surfaceFg,
        border: `1px solid ${border}`,
      }}
    >
      {/* Demo-only market action — hidden for real coins (Pump/Dump would lie) */}
      {demo && (
        <>
          <div>
            <div
              className="text-[10px] tracking-[0.14em] uppercase font-semibold mb-2"
              style={{ color: labelColor }}
            >
              Market action
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton label="Pump" onTap={() => demo.nudge(1)} bg={accent} fg="#000" />
              <ActionButton label="Dump" onTap={() => demo.nudge(-1)} bg="#FF453A" fg="#fff" />
            </div>
            <button
              onClick={() => demo.setControls({ paused: !demo.controls.paused })}
              className="w-full mt-2 text-[11px] font-medium py-2 rounded-[10px] transition-colors"
              style={{
                background: demo.controls.paused ? "#FFD60A" : "transparent",
                color: demo.controls.paused ? "#000" : surfaceFg,
                border: `1px solid ${border}`,
              }}
            >
              {demo.controls.paused ? "Resume" : "Pause"}
            </button>
          </div>
          <Divider color={border} />

          {/* Volatility — only meaningful on demo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[10px] tracking-[0.14em] uppercase font-semibold"
                style={{ color: labelColor }}
              >
                Volatility
              </span>
              <span
                className="font-mono text-[11px]"
                style={{ color: surfaceFg, fontFeatureSettings: '"tnum"' }}
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
              style={{ accentColor: accent }}
            />
            <div
              className="flex justify-between text-[9px] mt-1"
              style={{ color: labelColor }}
            >
              <span>calm</span>
              <span>chaos</span>
            </div>
          </div>
          <Divider color={border} />
        </>
      )}

      {/* Live-mode banner */}
      {isLive && (
        <div
          className="text-[10.5px] font-mono leading-snug rounded-[10px] px-3 py-2"
          style={{
            background: "rgba(48,209,88,0.10)",
            color: theme === "dark" ? "#30D158" : "#00853D",
            border: `1px solid rgba(48,209,88,0.3)`,
          }}
        >
          Streaming a public spot feed. Pump/Dump and volatility are disabled on real markets — switch to <strong>Demo</strong> to drive the line yourself.
        </div>
      )}

      {/* Toggles */}
      <div className="flex flex-col gap-2">
        <Toggle label="Degen mode" value={degen} onToggle={setDegen} accent={accent} fg={surfaceFg} labelColor={labelColor} />
        <Toggle label="Exaggerate" value={exaggerate} onToggle={setExaggerate} accent={accent} fg={surfaceFg} labelColor={labelColor} />
        <Toggle label="Grid" value={showGrid} onToggle={setShowGrid} accent={accent} fg={surfaceFg} labelColor={labelColor} />
        <Toggle label="Fill" value={showFill} onToggle={setShowFill} accent={accent} fg={surfaceFg} labelColor={labelColor} />
      </div>

      <Divider color={border} />

      {/* Theme */}
      <div>
        <div
          className="text-[10px] tracking-[0.14em] uppercase font-semibold mb-2"
          style={{ color: labelColor }}
        >
          Theme
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="text-[11px] font-medium py-2 rounded-[10px] capitalize transition-colors"
              style={{
                background: theme === t ? accent : "transparent",
                color: theme === t ? "#000" : surfaceFg,
                border: `1px solid ${theme === t ? accent : border}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div
          className="flex items-center justify-between mb-2"
        >
          <span
            className="text-[10px] tracking-[0.14em] uppercase font-semibold"
            style={{ color: labelColor }}
          >
            Accent
          </span>
          <button
            onClick={resetAccent}
            className="text-[9px] font-mono"
            style={{ color: labelColor, background: "transparent", border: "none", cursor: "pointer" }}
          >
            reset
          </button>
        </div>
        <div className="flex gap-2">
          {ACCENT_OPTIONS.map((o) => {
            const active = accent === o.hex;
            return (
              <button
                key={o.hex}
                onClick={() => setAccent(o.hex)}
                title={o.label}
                aria-label={o.label}
                className="rounded-full transition-transform"
                style={{
                  width: 24,
                  height: 24,
                  background: o.hex,
                  border: `2px solid ${active ? surfaceFg : "transparent"}`,
                  transform: active ? "scale(1.1)" : "scale(1)",
                  cursor: "pointer",
                }}
              />
            );
          })}
        </div>
      </div>

      {demo && (
        <>
          <Divider color={border} />
          <button
            onClick={demo.reset}
            className="text-[11px] font-medium py-2 rounded-[10px] transition-colors"
            style={{
              background: "transparent",
              color: labelColor,
              border: `1px solid ${border}`,
            }}
          >
            Reset demo ticker
          </button>
        </>
      )}
    </div>
  );
}

function Divider({ color }: { color: string }) {
  return <div style={{ height: 1, background: color, margin: "0 -4px" }} />;
}

function ActionButton({
  label,
  onTap,
  bg,
  fg,
}: {
  label: string;
  onTap: () => void;
  bg: string;
  fg: string;
}) {
  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className="text-[12px] font-semibold py-2.5 rounded-[10px]"
      style={{ background: bg, color: fg, border: "none", cursor: "pointer" }}
    >
      {label}
    </motion.button>
  );
}

function Toggle({
  label,
  value,
  onToggle,
  accent,
  fg,
  labelColor,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  accent: string;
  fg: string;
  labelColor: string;
}) {
  return (
    <button
      onClick={() => onToggle(!value)}
      className="flex items-center justify-between text-[11px] py-1 px-1 rounded-[6px]"
      style={{ background: "transparent", border: "none", cursor: "pointer" }}
    >
      <span style={{ color: value ? fg : labelColor, fontWeight: value ? 600 : 500 }}>{label}</span>
      <span
        className="relative inline-block transition-colors"
        style={{
          width: 30,
          height: 18,
          borderRadius: 9,
          background: value ? accent : "#3a3a3e",
        }}
      >
        <span
          className="absolute top-[2px] transition-all"
          style={{
            left: value ? 14 : 2,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: "#fff",
          }}
        />
      </span>
    </button>
  );
}
