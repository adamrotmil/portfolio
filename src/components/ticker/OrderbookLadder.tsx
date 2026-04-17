"use client";

import { motion } from "motion/react";
import type { OrderbookLevel, OrderbookState } from "@/ticker/useOrderbook";
import { formatPrice } from "@/ticker/coins";
import { palette, TYPE, TNUM, RADIUS } from "./cdsTokens";

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
  const p = palette(theme);
  const fg = p.fgPrimary;
  const muted = p.fgMuted;
  const rowBg = p.bgPrimary;
  const dim = p.line;

  const greenFill = p.positiveWash;
  const redFill = p.negativeWash;
  const greenFg = p.green60;
  const redFg = p.red60;

  const cvdColor = cvd > 0 ? greenFg : cvd < 0 ? redFg : muted;
  const cvdBg =
    cvd > 0 ? greenFill : cvd < 0 ? redFill : p.bgTertiary;

  const maxCum = Math.max(
    book.bids[book.bids.length - 1]?.cumulative ?? 1,
    book.asks[book.asks.length - 1]?.cumulative ?? 1,
  );

  // Render asks top-to-bottom in reverse (farthest first, closest to spread last)
  const asksToRender = [...book.asks].reverse();

  const empty = book.bids.length === 0 && book.asks.length === 0;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: rowBg,
        border: `1px solid ${dim}`,
        borderRadius: RADIUS.md,
      }}
    >
      {/* Header — "Order book" left, CVD readout right.
          CVD (Cumulative Volume Delta) = Σ(taker buy volume − taker sell
          volume) since this coin was selected.  Positive means buyer
          pressure, negative means seller pressure.  Color-coded + arrow. */}
      <div
        className="flex items-center justify-between"
        style={{
          color: muted,
          borderBottom: `1px solid ${dim}`,
          padding: "10px 12px",
        }}
      >
        <span style={{ ...TYPE.sectionLabel, color: fg }}>Order book</span>
        <motion.span
          layout
          initial={false}
          className="inline-flex items-center gap-1.5"
          style={{
            ...TYPE.label2,
            ...TNUM,
            background: cvdBg,
            color: cvdColor,
            padding: "2px 8px",
            borderRadius: RADIUS.sm,
          }}
          title={`Cumulative Volume Delta (${symbol})`}
        >
          <span style={{ opacity: 0.7, letterSpacing: 0.4 }}>CVD</span>
          {/* Direction glyph: only re-mounts when the sign flips, so we
              don't spam React with duplicate-key warnings on every tick. */}
          <motion.span
            key={`cvd-${Math.sign(cvd)}`}
            initial={{ scale: 0.7, opacity: 0.3 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            style={{ fontSize: 10 }}
          >
            {cvd > 0 ? "▲" : cvd < 0 ? "▼" : "◆"}
          </motion.span>
          {/* Value just updates in place — no key re-mount. */}
          <span>{formatCvd(cvd)}</span>
        </motion.span>
      </div>

      {/* Column headers */}
      <div
        className="grid"
        style={{
          ...TYPE.sectionLabel,
          gridTemplateColumns: "1fr 1fr 1fr",
          color: muted,
          borderBottom: `1px solid ${dim}`,
          padding: "8px 12px",
        }}
      >
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {empty ? (
        <div
          className="flex-1 flex items-center justify-center"
          style={{ ...TYPE.body, color: muted }}
        >
          Waiting for depth…
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
            className="flex items-center justify-between"
            style={{
              background: p.bgTertiary,
              borderTop: `1px solid ${dim}`,
              borderBottom: `1px solid ${dim}`,
              padding: "8px 12px",
              ...TNUM,
            }}
          >
            <span style={{ ...TYPE.sectionLabel, color: muted }}>Spread</span>
            <motion.span
              key={book.spread ?? 0}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              style={{ ...TYPE.label1, color: fg }}
            >
              {book.spread != null ? formatPrice(book.spread, decimals) : "—"}
              <span style={{ ...TYPE.caption, color: muted, marginLeft: 6 }}>
                {book.spreadPct != null ? `${book.spreadPct.toFixed(3)}%` : ""}
              </span>
            </motion.span>
            <span style={{ ...TYPE.caption, color: muted }}>
              Mid {book.mid != null ? formatPrice(book.mid, decimals) : "—"}
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
      className="relative grid"
      style={{
        ...TYPE.label2,
        ...TNUM,
        gridTemplateColumns: "1fr 1fr 1fr",
        height: 22,
        padding: "0 12px",
        alignItems: "center",
      }}
    >
      {/* Depth bar — fills from the right; the closer-to-spread side visually
          leans inward. */}
      <motion.div
        aria-hidden
        className="absolute top-0 bottom-0 right-0 pointer-events-none"
        style={{ background: sideFill, zIndex: 0 }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      />
      <span style={{ color: sideFg, fontWeight: 600, zIndex: 1, position: "relative" }}>
        {formatNum(level.price, decimals)}
      </span>
      <span className="text-right" style={{ color: fg, zIndex: 1, position: "relative" }}>
        {formatSize(level.size)}
      </span>
      <span
        className="text-right"
        style={{ color: fg, opacity: 0.55, zIndex: 1, position: "relative" }}
      >
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
