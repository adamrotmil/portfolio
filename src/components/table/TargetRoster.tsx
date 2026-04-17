"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Restaurant } from "@/map/types";
import type { Telemetry } from "@/map/useTelemetry";
import { TABLE, T } from "./tokens";

interface Props {
  restaurants: Restaurant[];
  telemetry: Telemetry;
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

// Compact fleet roster.  Each row has:
//   [status dot] CODE · NAME              WAIT   LOAD   PRESS
//                neighborhood · cuisine    42m    74%    0.81
//
// Columns are fixed-width mono so the eye can scan without chasing.
// Selected row gets a vertical accent bar on the left.
export default function TargetRoster({
  restaurants,
  telemetry,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!selectedId) return;
    const el = rowRefs.current.get(selectedId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  const sorted = useMemo(() => {
    // Busy-first ordering so the interesting rows sit at top.
    return [...restaurants].sort((a, b) => {
      const ta = telemetry[a.id]?.rsvPressure ?? 0;
      const tb = telemetry[b.id]?.rsvPressure ?? 0;
      return tb - ta;
    });
  }, [restaurants, telemetry]);

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: TABLE.bg }}>
      <Header />
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollbarGutter: "stable" }}
      >
        {sorted.map((r) => (
          <div
            key={r.id}
            ref={(el) => {
              if (el) rowRefs.current.set(r.id, el);
              else rowRefs.current.delete(r.id);
            }}
          >
            <Row
              restaurant={r}
              reading={telemetry[r.id]}
              selected={selectedId === r.id}
              hovered={hoveredId === r.id}
              onHover={onHover}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 sticky top-0 z-10"
      style={{
        background: TABLE.bgPanel,
        borderBottom: `1px solid ${TABLE.line}`,
        color: TABLE.fgMute,
        ...T.label,
      }}
    >
      <span style={{ flex: 1 }}>Target</span>
      <span style={{ width: 42, textAlign: "right" }}>Wait</span>
      <span style={{ width: 40, textAlign: "right" }}>Load</span>
      <span style={{ width: 42, textAlign: "right" }}>Press</span>
    </div>
  );
}

function Row({
  restaurant: r,
  reading,
  selected,
  hovered,
  onHover,
  onSelect,
}: {
  restaurant: Restaurant;
  reading: ReturnType<() => any> | undefined;
  selected: boolean;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const wait = Math.round(reading?.wait ?? 0);
  const load = Math.round((reading?.kitchenLoad ?? 0) * 100);
  const press = (reading?.rsvPressure ?? 0).toFixed(2);
  const open = reading?.open ?? true;
  const statusColor = !open
    ? TABLE.fgDisabled
    : reading && reading.kitchenLoad >= 0.82
      ? TABLE.red
      : reading && reading.kitchenLoad >= 0.55
        ? TABLE.amber
        : TABLE.green;

  const bg = selected
    ? TABLE.bgPanelHi
    : hovered
      ? "rgba(255,255,255,0.035)"
      : "transparent";

  return (
    <button
      onMouseEnter={() => onHover(r.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(r.id)}
      className="w-full text-left relative cursor-pointer"
      style={{
        background: bg,
        borderBottom: `1px solid ${TABLE.line}`,
        padding: "8px 12px 8px 14px",
        color: TABLE.fg,
        display: "block",
      }}
    >
      {selected ? (
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 2, background: TABLE.accent }}
        />
      ) : null}
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block"
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: statusColor,
            boxShadow: open ? `0 0 5px ${statusColor}` : "none",
            flexShrink: 0,
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span
              style={{
                ...T.label,
                color: TABLE.accent,
                opacity: 0.85,
                flexShrink: 0,
              }}
            >
              {r.id.slice(0, 3).toUpperCase()}
            </span>
            <span
              className="truncate"
              style={{
                ...T.body,
                fontWeight: 500,
                color: TABLE.fg,
              }}
            >
              {r.name}
            </span>
          </div>
          <div
            className="truncate"
            style={{
              ...T.caption,
              color: TABLE.fgMute,
              marginTop: 1,
            }}
          >
            {r.neighborhood} · {r.cuisine[0]}
          </div>
        </div>
        <span
          style={{
            ...T.numeric,
            width: 42,
            textAlign: "right",
            fontSize: 12,
            color: wait >= 45 ? TABLE.amber : TABLE.fg,
            fontWeight: 600,
          }}
        >
          {open ? `${wait}m` : "—"}
        </span>
        <span
          style={{
            ...T.numeric,
            width: 40,
            textAlign: "right",
            fontSize: 12,
            color: load >= 82 ? TABLE.red : load >= 55 ? TABLE.amber : TABLE.fgMute,
          }}
        >
          {open ? `${load}%` : "—"}
        </span>
        <span
          style={{
            ...T.numeric,
            width: 42,
            textAlign: "right",
            fontSize: 12,
            color: TABLE.fgMute,
          }}
        >
          {open ? press : "—"}
        </span>
      </div>
    </button>
  );
}
