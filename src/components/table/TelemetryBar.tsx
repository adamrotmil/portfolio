"use client";

import { useEffect, useState } from "react";
import type { Restaurant } from "@/map/types";
import type { Telemetry } from "@/map/useTelemetry";
import { TABLE, T } from "./tokens";

interface Props {
  restaurants: Restaurant[];
  telemetry: Telemetry;
  heatmap: boolean;
  setHeatmap: (v: boolean) => void;
}

// The top command strip.  Fleet-level summary to the left, two quick
// toggles in the center, live clock (updated every second) on the
// right.  Intentionally dense — the eye should be able to read the
// whole strip in under a second.
export default function TelemetryBar({
  restaurants,
  telemetry,
  heatmap,
  setHeatmap,
}: Props) {
  const open = restaurants.filter((r) => telemetry[r.id]?.open).length;
  const readings = restaurants
    .map((r) => telemetry[r.id])
    .filter(Boolean);

  const medianWait = median(readings.map((r) => r.wait));
  const avgPressure =
    readings.length === 0
      ? 0
      : readings.reduce((a, r) => a + r.rsvPressure, 0) / readings.length;
  const busy = readings.filter((r) => r.kitchenLoad >= 0.82).length;

  const utc = useUtcClock();

  return (
    <div
      className="flex items-center gap-0 relative"
      style={{
        background: TABLE.bgPanel,
        borderBottom: `1px solid ${TABLE.line}`,
        padding: "8px 14px",
        color: TABLE.fg,
      }}
    >
      <div className="flex items-center gap-5">
        <Stat label="Fleet" value={`${restaurants.length}`} suffix="tgt" />
        <Stat label="Online" value={`${open}`} tone={open === restaurants.length ? "ok" : "warn"} />
        <Stat
          label="Median wait"
          value={`${Math.round(medianWait)}`}
          suffix="m"
          tone={medianWait >= 45 ? "warn" : "ok"}
        />
        <Stat
          label="Busy"
          value={`${busy} / ${readings.length}`}
          tone={busy / (readings.length || 1) > 0.5 ? "warn" : "ok"}
        />
        <Stat
          label="Press"
          value={avgPressure.toFixed(2)}
          tone={avgPressure > 0.7 ? "hot" : avgPressure > 0.5 ? "warn" : "ok"}
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Toggle
          label="Heat"
          active={heatmap}
          onClick={() => setHeatmap(!heatmap)}
        />
        <div
          className="mx-3"
          style={{ width: 1, height: 14, background: TABLE.line }}
        />
        <div
          style={{
            ...T.numeric,
            fontSize: 11,
            color: TABLE.fgMute,
            letterSpacing: "0.02em",
          }}
        >
          {utc} <span style={{ color: TABLE.fgSubtle }}>UTC</span>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "ok" | "warn" | "hot";
}) {
  const color =
    tone === "hot"
      ? TABLE.red
      : tone === "warn"
        ? TABLE.amber
        : tone === "ok"
          ? TABLE.green
          : TABLE.fg;
  return (
    <div className="flex items-baseline gap-1.5">
      <span style={{ ...T.label, color: TABLE.fgSubtle }}>{label}</span>
      <span style={{ ...T.numeric, fontSize: 13, fontWeight: 600, color }}>
        {value}
        {suffix ? (
          <span
            style={{
              ...T.label,
              fontSize: 9,
              color: TABLE.fgMute,
              marginLeft: 2,
              letterSpacing: "0.06em",
              fontWeight: 500,
            }}
          >
            {suffix}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="transition-colors"
      style={{
        ...T.label,
        fontSize: 10,
        padding: "5px 9px",
        background: active ? TABLE.accentGhost : "transparent",
        color: active ? TABLE.accent : TABLE.fgMute,
        border: `1px solid ${active ? TABLE.lineAccent : TABLE.line}`,
        borderRadius: TABLE.rSm,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function useUtcClock() {
  const [now, setNow] = useState(() => formatUtc(new Date()));
  useEffect(() => {
    const id = setInterval(() => setNow(formatUtc(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatUtc(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
