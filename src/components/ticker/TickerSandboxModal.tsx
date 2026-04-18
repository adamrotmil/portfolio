"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import TickerControls from "./TickerControls";
import SegmentedControl from "./SegmentedControl";
import OrderbookLadder from "./OrderbookLadder";
import { useSandbox } from "@/ticker/useSandbox";
import { palette, TYPE, FONT_STACK, RADIUS } from "./cdsTokens";

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
  // Default to light mode with the CDS green accent — reads as the
  // sandbox's resting state before any user customization.
  const [theme, setTheme] = useState<"light" | "dark">("light");
  // Exaggerate tightly zooms the Y axis, which makes ordinary noise look
  // like jagged swings.  Default to OFF so the line reads as smooth price
  // action; users can flick the toggle to get the excitable view.
  const [exaggerate, setExaggerate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showFill, setShowFill] = useState(true);
  // Accent starts at CDS green — the "tasteful default" that reads as the
  // sandbox's own brand, independent of whichever coin is active.  User
  // can override via the accent picker; Reset snaps back to this.
  const DEFAULT_ACCENT = "#05B169";
  const [accentOverride, setAccentOverride] = useState<string | null>(null);
  const accent = accentOverride ?? DEFAULT_ACCENT;

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
  const p = palette(theme);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        fontFamily: FONT_STACK,
      }}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Ticker Sandbox"
    >
      <div
        className="relative flex flex-col overflow-hidden shadow-[0_24px_72px_rgba(0,0,0,0.5)] w-full h-[100dvh] sm:w-[min(96vw,1240px)] sm:h-[min(94vh,880px)]"
        style={{
          background: p.bgPrimary,
          color: p.fgPrimary,
          borderRadius: 0,
        }}
      >
        {/* Chrome */}
        <div
          className="relative flex items-center justify-center px-4"
          style={{
            background: p.bgSecondary,
            borderBottom: `1px solid ${p.line}`,
            padding: "12px 16px",
          }}
        >
          <div style={{ ...TYPE.label2, color: p.fgMuted, letterSpacing: 0.2 }}>
            Ticker Sandbox · <span style={{ color: p.fgSubtle }}>fintech chart playground</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            style={{ color: p.fgMuted, background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = p.bgTertiary)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Segmented control + live status */}
        <div
          className="flex items-center justify-between gap-3 flex-wrap"
          style={{
            background: p.bgSecondary,
            borderBottom: `1px solid ${p.line}`,
            padding: "12px 16px",
          }}
        >
          <SegmentedControl
            value={sandbox.coin.id}
            onChange={sandbox.setCoin}
            accent={accent}
            theme={theme}
          />
          <div className="flex items-center gap-3">
            <StatusPill
              live={sandbox.live}
              status={sandbox.status}
              color={statusColor}
              theme={theme}
            />
            <span style={{ ...TYPE.caption, color: p.fgMuted }}>{sandbox.coin.caption}</span>
          </div>
        </div>

        {/* Stage: on desktop, chart + orderbook on left, controls on right.
            On mobile, everything stacks and the stage scrolls — we remove
            `flex-1` from the inner wrappers so children take their intrinsic
            heights instead of fighting over a too-small flex basis (the old
            layout over-constrained the chart/orderbook pair into the same
            vertical band as the controls, causing the infamous overlap). */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 p-3 overflow-y-auto lg:overflow-hidden">
          <div className="flex flex-col gap-3 lg:flex-1 lg:min-h-0 lg:flex-row">
            <div
              className="h-[360px] lg:h-auto lg:flex-1 lg:min-h-[340px] relative overflow-hidden shrink-0"
              style={{
                background: p.bgPrimary,
                border: `1px solid ${p.line}`,
                borderRadius: RADIUS.md,
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
            <div className="h-[360px] lg:h-auto lg:w-[300px] lg:shrink-0 lg:min-h-[320px] shrink-0">
              <OrderbookLadder
                book={sandbox.orderbook}
                theme={theme}
                decimals={sandbox.coin.decimals}
                cvd={sandbox.cvd}
                symbol={sandbox.coin.symbol}
              />
            </div>
          </div>
          <div className="lg:w-[240px] lg:shrink-0 shrink-0">
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
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
          style={{
            ...TYPE.legal,
            background: p.bgSecondary,
            borderTop: `1px solid ${p.line}`,
            color: p.fgMuted,
            padding: "10px 16px",
          }}
        >
          <span>Data:</span>
          <a
            href="https://docs.cdp.coinbase.com/exchange/websocket-feed/overview"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: p.blue70, textDecoration: "none", fontWeight: 500 }}
          >
            Coinbase Exchange public feed
          </a>
          <span style={{ color: p.fgSubtle }}>·</span>
          <span>Charting:</span>
          <a
            href="https://benji.org/liveline"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: p.blue70, textDecoration: "none", fontWeight: 500 }}
          >
            Liveline
          </a>
          <span style={{ color: p.fgSubtle }}>© Benji Taylor (MIT)</span>
          <span style={{ color: p.fgSubtle }}>·</span>
          <span>Styling:</span>
          <a
            href="https://cds.coinbase.com/components/charts/LineChart/"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: p.blue70, textDecoration: "none", fontWeight: 500 }}
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
  theme,
}: {
  live: boolean;
  status: string;
  color: string;
  theme: "light" | "dark";
}) {
  const label = !live
    ? "Demo"
    : status === "open"
      ? "Live"
      : status === "connecting"
        ? "Connecting"
        : status === "error"
          ? "Error"
          : status === "closed"
            ? "Reconnecting"
            : "Idle";
  const p = palette(theme);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        ...TYPE.label2,
        color,
        background: p.bgTertiary,
        padding: "3px 10px 3px 8px",
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: 6,
          height: 6,
          background: color,
          boxShadow: status === "open" ? `0 0 6px ${color}` : "none",
        }}
      />
      {label}
    </span>
  );
}

// Color-coded status indicator.  Uses CDS status tokens.
function useStatusColor(status: string, live: boolean, theme: "light" | "dark"): string {
  const p = palette(theme);
  return useMemo(() => {
    if (!live) return p.orange70;
    if (status === "open") return p.green60;
    if (status === "connecting") return p.orange70;
    if (status === "closed") return p.orange70;
    if (status === "error") return p.red60;
    return p.fgMuted;
  }, [status, live, theme, p]);
}
