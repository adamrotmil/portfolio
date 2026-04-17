"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import TickerControls from "./TickerControls";
import { useTicker } from "@/ticker/useTicker";

// Liveline renders a canvas — not SSR-safe. Dynamic import defers it to the
// client so Next.js's static export doesn't try to pre-render it.
const TickerChart = dynamic(() => import("./TickerChart"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-[11px] text-[#6b6b70] font-mono">
      warming up the ticker…
    </div>
  ),
});

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TickerSandboxModal({ open, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const api = useTicker();

  // Visual controls live in React state (not in the ticker engine — those
  // are independent concerns).
  const [degen, setDegen] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [exaggerate, setExaggerate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showFill, setShowFill] = useState(true);
  const [accent, setAccent] = useState("#00D395");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const bg = theme === "dark" ? "#0b0b0d" : "#f7f7f7";
  const fg = theme === "dark" ? "#e5e5ea" : "#1a1a1c";
  const chromeBg = theme === "dark" ? "#161618" : "#ededed";
  const chromeBorder = theme === "dark" ? "#222" : "#d4d4d4";
  const mutedFg = theme === "dark" ? "#8e8e93" : "#6b6b70";
  const linkColor = theme === "dark" ? "#9EC4FF" : "#1652F0";

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
      }}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Ticker Sandbox"
    >
      <div
        className="relative flex flex-col overflow-hidden sm:rounded-[12px] shadow-[0_24px_72px_rgba(0,0,0,0.5)] w-full h-[100dvh] sm:w-[min(96vw,1200px)] sm:h-[min(94vh,840px)]"
        style={{ background: bg, color: fg }}
      >
        {/* Chrome */}
        <div
          className="relative flex items-center justify-center px-4 py-3 border-b"
          style={{ background: chromeBg, borderBottomColor: chromeBorder }}
        >
          <div className="text-[11px] font-mono tracking-wide" style={{ color: mutedFg }}>
            ticker sandbox — live-interpolated real-time chart
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 active:bg-white/10 transition-colors"
            style={{ color: mutedFg }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Stage: chart (left) + controls (right) */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 p-4 overflow-y-auto lg:overflow-hidden">
          <div
            className="flex-1 min-h-[360px] relative rounded-[12px] overflow-hidden"
            style={{
              background: theme === "dark" ? "#0a0a0c" : "#ffffff",
              border: `1px solid ${chromeBorder}`,
            }}
          >
            <TickerChart
              data={api.data}
              value={api.value}
              degen={degen}
              theme={theme}
              accent={accent}
              exaggerate={exaggerate}
              showGrid={showGrid}
              showFill={showFill}
              paused={api.controls.paused}
              symbol={api.symbol}
            />
          </div>
          <div className="lg:w-[240px] lg:shrink-0">
            <TickerControls
              api={api}
              degen={degen}
              setDegen={setDegen}
              theme={theme}
              setTheme={setTheme}
              exaggerate={exaggerate}
              setExaggerate={setExaggerate}
              showGrid={showGrid}
              setShowGrid={setShowGrid}
              showFill={showFill}
              setShowFill={setShowFill}
              accent={accent}
              setAccent={setAccent}
            />
          </div>
        </div>

        {/* Attribution footer */}
        <div
          className="px-4 py-2 border-t text-[10.5px] font-mono flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
          style={{
            background: chromeBg,
            borderTopColor: chromeBorder,
            color: mutedFg,
          }}
        >
          <span>Charting:</span>
          <a
            href="https://benji.org/liveline"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: linkColor, textDecoration: "none" }}
          >
            Liveline
          </a>
          <span>·</span>
          <span>© Benji Taylor (MIT)</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>Styling cues:</span>
          <a
            href="https://cds.coinbase.com/components/charts/LineChart/"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: linkColor, textDecoration: "none" }}
          >
            Coinbase Design System
          </a>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>Data is synthetic — no market is modeled here.</span>
        </div>
      </div>
    </div>
  );
}
