"use client";

import { Liveline } from "liveline";
import type { LivelinePoint } from "liveline";
import { useMemo } from "react";

interface Props {
  data: LivelinePoint[];
  value: number;
  degen: boolean;
  theme: "light" | "dark";
  accent: string;
  exaggerate: boolean;
  showGrid: boolean;
  showFill: boolean;
  paused: boolean;
  symbol: string;
}

// Single chart surface.  Keeps Liveline behind a thin wrapper so the
// sandbox shell doesn't import `liveline` directly (it's loaded via
// next/dynamic on the parent side so Next.js doesn't SSR the canvas).
export default function TickerChart({
  data,
  value,
  degen,
  theme,
  accent,
  exaggerate,
  showGrid,
  showFill,
  paused,
  symbol,
}: Props) {
  // Custom window options — the Liveline default is 5m/15m/1h/1d; for a
  // real-time sandbox with a short history buffer, shorter windows feel
  // snappier and show the movement better.
  const windows = useMemo(
    () => [
      { label: "15s", secs: 15 },
      { label: "30s", secs: 30 },
      { label: "1m", secs: 60 },
    ],
    [],
  );

  // Format the overlay value as a dollar price with 2 decimals.
  const formatValue = useMemo(
    () => (v: number) =>
      v.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  return (
    <div className="relative h-full w-full">
      {/* Symbol label — bottom-left so it doesn't collide with Liveline's
          own value overlay in the top-left.  Purely decorative context. */}
      <div
        className="absolute left-3 bottom-2 z-10 flex items-baseline gap-2 pointer-events-none"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        <span
          className="font-mono text-[10px] tracking-[0.14em] font-semibold uppercase"
          style={{ color: theme === "dark" ? "#6b6b70" : "#9a9aa0" }}
        >
          ${symbol}
        </span>
        <span
          className="font-mono text-[9px]"
          style={{ color: theme === "dark" ? "#4a4a50" : "#b5b5ba" }}
        >
          · toy market
        </span>
      </div>
      <Liveline
        data={data}
        value={value}
        theme={theme}
        color={accent}
        grid={showGrid}
        fill={showFill}
        momentum
        badge
        badgeTail
        degen={degen}
        scrub
        showValue
        valueMomentumColor
        exaggerate={exaggerate}
        pulse
        paused={paused}
        windows={windows}
        formatValue={formatValue}
        lerpSpeed={0.22}
        lineWidth={2}
      />
    </div>
  );
}
