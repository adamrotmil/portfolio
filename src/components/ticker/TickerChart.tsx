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
    // flex-col is load-bearing.  Liveline renders a React Fragment whose
    // children become siblings in our wrapper: badge, value label, window
    // buttons, then a canvas-wrap div with inline `height: 100%`.  In a
    // block-display parent, that 100% evaluates to the parent's full
    // height — so the canvas ends up 318px AFTER the ~74px of chrome
    // above it, pushing the rendered line below our container's bottom
    // edge.  As a flex column, each Liveline sibling takes its natural
    // height and the canvas wrap's 100% collapses to the remaining space.
    // `min-h-0` prevents flex children from insisting on content size.
    <div className="relative h-full w-full flex flex-col min-h-0 [&>div:last-of-type]:min-h-0">
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
          · mock data
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
        // Default to the 1-minute window — the shortest (15s) felt too
        // reactive to the live tick stream; 60s lets the shape of a
        // rally read more clearly without being slower to feel "live."
        window={60}
        windows={windows}
        formatValue={formatValue}
        // 0.18 — closer to Liveline's 0.08 default but snappy enough to
        // track the 180ms demo tick.  Higher values (0.3+) made the line
        // feel mechanical at fast tick rates because each frame was
        // chasing too much distance at once.
        lerpSpeed={0.18}
        lineWidth={2}
        // A small top/bottom cushion on the canvas gives the line visual
        // breathing room during transient Y-axis transitions (Liveline's
        // displayed min/max ease toward the target via an internal lerp,
        // so a sharp shock can briefly put the line outside the rendered
        // band for a few frames).  Top stays near the Liveline default
        // since most shocks in the demo walk travel down, not up — more
        // bottom cushion is useful, more top cushion is just dead space
        // between the window-tabs row and the first grid line.
        padding={{ top: 10, bottom: 34 }}
      />
    </div>
  );
}
