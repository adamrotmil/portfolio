"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import TickerControls from "./TickerControls";
import SegmentedControl from "./SegmentedControl";
import OrderbookLadder from "./OrderbookLadder";
import { useSandbox } from "@/ticker/useSandbox";

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

// Outer shell is cheap to mount/unmount — sandbox hooks (WebSocket, polling)
// only run when the inner body is mounted.  This keeps the WS dormant until
// the user clicks the tile, and tears it down cleanly on close.
export default function TickerSandboxModal({ open, onClose }: Props) {
  if (!open) return null;
  return <ModalBody onClose={onClose} />;
}

function ModalBody({ onClose }: { onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const sandbox = useSandbox();

  // Visual controls — purely presentational, independent of data source.
  const [degen, setDegen] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  // Exaggerate tightly zooms the Y axis, which makes ordinary noise look
  // like jagged swings.  Default to OFF so the line reads as smooth price
  // action; users can flick the toggle to get the excitable view.
  const [exaggerate, setExaggerate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showFill, setShowFill] = useState(true);
  // When a live coin is selected, the accent defaults to its brand color;
  // we also let the user override via the accent picker in controls.
  const [accentOverride, setAccentOverride] = useState<string | null>(null);
  const accent = accentOverride ?? sandbox.coin.accent;

  useEffect(() => {
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
  }, [onClose]);

  const statusColor = useStatusColor(sandbox.status, sandbox.live, theme);

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
        className="relative flex flex-col overflow-hidden sm:rounded-[12px] shadow-[0_24px_72px_rgba(0,0,0,0.5)] w-full h-[100dvh] sm:w-[min(96vw,1240px)] sm:h-[min(94vh,880px)]"
        style={{ background: bg, color: fg }}
      >
        {/* Chrome */}
        <div
          className="relative flex items-center justify-center px-4 py-3 border-b"
          style={{ background: chromeBg, borderBottomColor: chromeBorder }}
        >
          <div className="text-[11px] font-mono tracking-wide" style={{ color: mutedFg }}>
            ticker sandbox — fintech chart playground
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

        {/* Segmented control + live status */}
        <div
          className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-b"
          style={{ background: chromeBg, borderBottomColor: chromeBorder }}
        >
          <SegmentedControl
            value={sandbox.coin.id}
            onChange={sandbox.setCoin}
            accent={accent}
            theme={theme}
          />
          <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: mutedFg }}>
            <StatusPill
              live={sandbox.live}
              status={sandbox.status}
              color={statusColor}
            />
            <span style={{ fontSize: 10 }}>{sandbox.coin.caption}</span>
          </div>
        </div>

        {/* Stage: chart + orderbook on left, controls on right */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 p-3 overflow-y-auto lg:overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col gap-3 lg:flex-row">
            <div
              className="flex-1 min-h-[340px] relative rounded-[12px] overflow-hidden"
              style={{
                background: theme === "dark" ? "#0a0a0c" : "#ffffff",
                border: `1px solid ${chromeBorder}`,
              }}
            >
              <TickerChart
                data={sandbox.data}
                value={sandbox.value}
                degen={degen}
                theme={theme}
                accent={accent}
                exaggerate={exaggerate}
                showGrid={showGrid}
                showFill={showFill}
                paused={sandbox.demo?.controls.paused ?? false}
                symbol={sandbox.coin.symbol}
              />
            </div>
            <div className="lg:w-[300px] lg:shrink-0 min-h-[320px]">
              <OrderbookLadder
                book={sandbox.orderbook}
                theme={theme}
                decimals={sandbox.coin.decimals}
                cvd={sandbox.cvd}
                symbol={sandbox.coin.symbol}
              />
            </div>
          </div>
          <div className="lg:w-[240px] lg:shrink-0">
            <TickerControls
              demo={sandbox.demo}
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
              setAccent={(v: string) => setAccentOverride(v)}
              isLive={sandbox.live}
              resetAccent={() => setAccentOverride(null)}
            />
          </div>
        </div>

        {/* Attribution footer */}
        <div
          className="px-4 py-2 border-t text-[10px] font-mono flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
          style={{
            background: chromeBg,
            borderTopColor: chromeBorder,
            color: mutedFg,
          }}
        >
          <span>Data:</span>
          <a
            href="https://docs.cdp.coinbase.com/exchange/websocket-feed/overview"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: linkColor, textDecoration: "none" }}
          >
            Coinbase Exchange public feed
          </a>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>Charting:</span>
          <a
            href="https://benji.org/liveline"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: linkColor, textDecoration: "none" }}
          >
            Liveline
          </a>
          <span>© Benji Taylor (MIT)</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>Styling:</span>
          <a
            href="https://cds.coinbase.com/components/charts/LineChart/"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: linkColor, textDecoration: "none" }}
          >
            Coinbase Design System
          </a>
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  live,
  status,
  color,
}: {
  live: boolean;
  status: string;
  color: string;
}) {
  const label = !live
    ? "DEMO"
    : status === "open"
      ? "LIVE"
      : status === "connecting"
        ? "CONNECTING…"
        : status === "error"
          ? "CONN ERROR"
          : status === "closed"
            ? "RECONNECTING…"
            : "IDLE";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-[0.08em]"
      style={{ color, background: "rgba(127,127,127,0.08)" }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: 7,
          height: 7,
          background: color,
          boxShadow: status === "open" ? `0 0 6px ${color}` : "none",
        }}
      />
      {label}
    </span>
  );
}

// Color-coded status indicator.
function useStatusColor(status: string, live: boolean, theme: "light" | "dark"): string {
  return useMemo(() => {
    if (!live) return "#FF9F0A"; // amber for demo
    if (status === "open") return "#30D158";
    if (status === "connecting") return "#FFD60A";
    if (status === "closed") return "#FFD60A";
    if (status === "error") return "#FF453A";
    return theme === "dark" ? "#8e8e93" : "#6b6b70";
  }, [status, live, theme]);
}
