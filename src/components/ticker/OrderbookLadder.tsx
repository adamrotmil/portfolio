"use client";

import { motion } from "motion/react";
import type { OrderbookLevel, OrderbookState } from "@/ticker/useOrderbook";
import { formatPrice } from "@/ticker/coins";

interface Props {
  book: OrderbookState;
  theme: "light" | "dark";
  decimals: number;
  cvd: number;
  symbol: string;
}

// A classic trading ladder: asks stacked above the mid, bids below.  Each
// row has a cumulative-size depth bar fading away from the spread — the
// visual trick is that the bars make volume distribution readable at a
// glance without a separate depth chart.
export default function OrderbookLadder({ book, theme, decimals, cvd, symbol }: Props) {
  const fg = theme === "dark" ? "#e5e5ea" : "#1a1a1c";
  const muted = theme === "dark" ? "#8e8e93" : "#6b6b70";
  const rowBg = theme === "dark" ? "#0e0e10" : "#ffffff";
  const dim = theme === "dark" ? "#2a2a2e" : "#e5e5ea";

  const greenFill = "rgba(48,209,88,0.14)";   // for bids
  const redFill = "rgba(255,69,58,0.14)";     // for asks
  const greenFg = theme === "dark" ? "#30D158" : "#00853D";
  const redFg = theme === "dark" ? "#FF453A" : "#D70015";

  // CVD is a signed running total.  Positive = aggressive buyers;
  // negative = aggressive sellers.  We color accordingly.
  const cvdColor = cvd > 0 ? greenFg : cvd < 0 ? redFg : muted;
  const cvdBg =
    cvd > 0 ? greenFill : cvd < 0 ? redFill : "rgba(127,127,127,0.10)";

  const maxCum = Math.max(
    book.bids[book.bids.length - 1]?.cumulative ?? 1,
    book.asks[book.asks.length - 1]?.cumulative ?? 1,
  );

  // Render asks top-to-bottom in reverse (farthest first, closest to spread last)
  const asksToRender = [...book.asks].reverse();

  const empty = book.bids.length === 0 && book.asks.length === 0;

  return (
    <div
      className="flex flex-col h-full rounded-[12px] overflow-hidden"
      style={{ background: rowBg, border: `1px solid ${dim}` }}
    >
      {/* Header — "Order book" left, CVD readout right.
          CVD (Cumulative Volume Delta) = Σ(taker buy volume − taker sell
          volume) since this coin was selected.  Positive means buyer
          pressure, negative means seller pressure.  Color-coded + arrow. */}
      <div
        className="flex items-center justify-between px-3 py-2 text-[10px] font-mono"
        style={{ color: muted, borderBottom: `1px solid ${dim}` }}
      >
        <span className="uppercase tracking-[0.12em] font-semibold">Order book</span>
        <motion.span
          layout
          initial={false}
          className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-[4px] text-[9px]"
          style={{
            background: cvdBg,
            color: cvdColor,
            fontWeight: 600,
            letterSpacing: 0.4,
            fontFeatureSettings: '"tnum"',
          }}
          title={`Cumulative Volume Delta (${symbol})`}
        >
          <span style={{ opacity: 0.72, letterSpacing: 0.7 }}>CVD</span>
          <motion.span
            key={Math.sign(cvd)}
            initial={{ scale: 0.7, opacity: 0.3 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
          >
            {cvd > 0 ? "▲" : cvd < 0 ? "▼" : "◆"}
          </motion.span>
          <motion.span
            key={Math.round(cvd * 10)}
            initial={{ y: -4, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            {formatCvd(cvd)}
          </motion.span>
        </motion.span>
      </div>

      {/* Column headers */}
      <div
        className="grid px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.12em]"
        style={{
          gridTemplateColumns: "1fr 1fr 1fr",
          color: muted,
          borderBottom: `1px solid ${dim}`,
        }}
      >
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {empty ? (
        <div
          className="flex-1 flex items-center justify-center text-[11px] font-mono"
          style={{ color: muted }}
        >
          waiting for depth…
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Asks (farthest → closest to spread) */}
          <div className="flex-1 min-h-0 flex flex-col justify-end overflow-hidden">
            {asksToRender.map((lvl) => (
              <LadderRow
                key={`a-${lvl.price}`}
                level={lvl}
                maxCum={maxCum}
                side="ask"
                fg={fg}
                sideFg={redFg}
                sideFill={redFill}
                decimals={decimals}
              />
            ))}
          </div>

          {/* Spread / mid bar */}
          <div
            className="flex items-center justify-between px-3 py-2 text-[11px] font-mono"
            style={{
              background: theme === "dark" ? "#18181b" : "#f5f5f5",
              borderTop: `1px solid ${dim}`,
              borderBottom: `1px solid ${dim}`,
              fontFeatureSettings: '"tnum"',
            }}
          >
            <span style={{ color: muted, textTransform: "uppercase", letterSpacing: 0.8, fontSize: 9, fontWeight: 600 }}>
              Spread
            </span>
            <motion.span
              key={book.spread ?? 0}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              style={{ color: fg, fontWeight: 600 }}
            >
              {book.spread != null ? formatPrice(book.spread, decimals) : "—"}
              <span style={{ color: muted, marginLeft: 6, fontSize: 9 }}>
                {book.spreadPct != null ? `${book.spreadPct.toFixed(3)}%` : ""}
              </span>
            </motion.span>
            <span style={{ color: muted, fontSize: 10 }}>
              mid {book.mid != null ? formatPrice(book.mid, decimals) : "—"}
            </span>
          </div>

          {/* Bids (closest to spread → farthest, top-to-bottom) */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {book.bids.map((lvl) => (
              <LadderRow
                key={`b-${lvl.price}`}
                level={lvl}
                maxCum={maxCum}
                side="bid"
                fg={fg}
                sideFg={greenFg}
                sideFill={greenFill}
                decimals={decimals}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LadderRow({
  level,
  maxCum,
  side,
  fg,
  sideFg,
  sideFill,
  decimals,
}: {
  level: OrderbookLevel;
  maxCum: number;
  side: "bid" | "ask";
  fg: string;
  sideFg: string;
  sideFill: string;
  decimals: number;
}) {
  const pct = Math.min(100, (level.cumulative / maxCum) * 100);
  return (
    <div
      className="relative grid px-3 text-[11px] font-mono"
      style={{
        gridTemplateColumns: "1fr 1fr 1fr",
        height: 22,
        alignItems: "center",
        fontFeatureSettings: '"tnum"',
      }}
    >
      {/* Depth bar — bids fill from the right, asks fill from the right too;
          the closest-to-spread side visually leans inward. */}
      <motion.div
        aria-hidden
        className="absolute top-0 bottom-0 right-0 pointer-events-none"
        style={{ background: sideFill, zIndex: 0 }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      />
      <span style={{ color: sideFg, fontWeight: 600, zIndex: 1 }}>
        {formatNum(level.price, decimals)}
      </span>
      <span className="text-right" style={{ color: fg, zIndex: 1 }}>
        {formatSize(level.size)}
      </span>
      <span className="text-right" style={{ color: fg, opacity: 0.65, zIndex: 1 }}>
        {formatSize(level.cumulative)}
      </span>
    </div>
  );
}

function formatNum(n: number, decimals: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatSize(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(4);
}

function formatCvd(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (abs >= 1000) return `${sign}${abs.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
  if (abs >= 10) return `${sign}${abs.toFixed(1)}`;
  if (abs >= 1) return `${sign}${abs.toFixed(2)}`;
  return `${sign}${abs.toFixed(3)}`;
}
