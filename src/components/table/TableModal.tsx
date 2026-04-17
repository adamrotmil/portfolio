"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTable } from "@/map/useTable";
import { useTelemetry } from "@/map/useTelemetry";
import { TABLE, T } from "./tokens";
import TargetRoster from "./TargetRoster";
import TargetDossier from "./TargetDossier";
import TelemetryBar from "./TelemetryBar";

// WebGL canvas — client-only.
const TacticalMap = dynamic(() => import("./TacticalMap"), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: "#05070a" }}
    >
      <span
        style={{
          ...T.label,
          fontSize: 10,
          color: TABLE.fgSubtle,
        }}
      >
        INITIALIZING OVERLAY…
      </span>
    </div>
  ),
});

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TableModal({ open, onClose }: Props) {
  if (!open) return null;
  return <ModalBody onClose={onClose} />;
}

// Operations deck layout:
//   ┌──── title bar ────────────────────────────────────────┐
//   │ telemetry strip  · fleet stats                        │
//   ├──── roster ──┬──── tactical map ────┬──── dossier ───┤
//   │              │                      │                │
//   │              │                      │                │
//   ├──────────────┴──────────────────────┴────────────────┤
//   │ footer                                                │
//   └────────────────────────────────────────────────────────┘
function ModalBody({ onClose }: { onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const state = useTable();
  const telemetry = useTelemetry(state.city.restaurants);
  const [heatmap, setHeatmap] = useState(false);

  // Start with no selection so the command-center view reads as the
  // entry point.  User can click a target to drop into the dossier.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (state.selectedId) state.setSelectedId(null);
        else onClose();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, state]);

  const selected = useMemo(
    () =>
      state.city.restaurants.find((r) => r.id === state.selectedId) ?? null,
    [state.city, state.selectedId],
  );

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(3px)",
      }}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Table — NYC restaurant operations deck"
    >
      <div
        className="relative flex flex-col overflow-hidden w-full h-[100dvh] sm:w-[min(98vw,1440px)] sm:h-[min(96vh,920px)]"
        style={{
          background: TABLE.bg,
          color: TABLE.fg,
          boxShadow: "0 24px 72px rgba(0,0,0,0.72)",
        }}
      >
        {/* Title bar */}
        <TitleBar onClose={onClose} />

        {/* Telemetry strip */}
        <TelemetryBar
          restaurants={state.city.restaurants}
          telemetry={telemetry}
          heatmap={heatmap}
          setHeatmap={setHeatmap}
        />

        {/* Main stage — 3 columns on desktop, stacked on mobile */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
          {/* Left: roster */}
          <div
            className="w-full sm:w-[320px] sm:shrink-0 flex flex-col min-h-0 max-h-[38vh] sm:max-h-none sm:h-full"
            style={{
              borderRight: `1px solid ${TABLE.line}`,
            }}
          >
            <TargetRoster
              restaurants={state.city.restaurants}
              telemetry={telemetry}
              hoveredId={state.hoveredId}
              selectedId={state.selectedId}
              onHover={state.setHoveredId}
              onSelect={state.setSelectedId}
            />
          </div>

          {/* Middle: tactical map */}
          <div className="relative flex-1 min-h-0">
            <TacticalMap
              city={state.city}
              restaurants={state.city.restaurants}
              telemetry={telemetry}
              hoveredId={state.hoveredId}
              selectedId={state.selectedId}
              onHover={state.setHoveredId}
              onSelect={state.setSelectedId}
              heatmap={heatmap}
            />
            <ScopeCrosshair />
          </div>

          {/* Right: dossier */}
          <div
            className="w-full sm:w-[360px] sm:shrink-0 min-h-0"
            style={{
              background: TABLE.bg,
              display: selected ? "flex" : "flex",
              flexDirection: "column",
            }}
          >
            {selected ? (
              <TargetDossier
                restaurant={selected}
                reading={telemetry[selected.id]}
                onClose={() => state.setSelectedId(null)}
              />
            ) : (
              <EmptyDossier totalTargets={state.city.restaurants.length} />
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

function TitleBar({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="flex items-center px-4 relative"
      style={{
        background: TABLE.bgPanel,
        borderBottom: `1px solid ${TABLE.line}`,
        padding: "9px 14px",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="inline-block"
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: TABLE.accent,
            boxShadow: `0 0 6px ${TABLE.accent}`,
          }}
        />
        <span
          style={{
            ...T.label,
            fontSize: 11,
            color: TABLE.fg,
            letterSpacing: "0.14em",
          }}
        >
          TABLE
        </span>
        <span style={{ color: TABLE.fgSubtle }}>·</span>
        <span style={{ ...T.label, fontSize: 10, color: TABLE.fgMute }}>
          NYC FLEET OPS
        </span>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
        style={{
          color: TABLE.fgMute,
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function ScopeCrosshair() {
  // Decorative map-center reticle.  Pure CSS, pointer-events none.
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute top-3 left-3"
        style={{
          ...T.label,
          fontSize: 9,
          color: "rgba(134,217,255,0.7)",
          letterSpacing: "0.15em",
        }}
      >
        40.727°N · 74.002°W
      </div>
    </div>
  );
}

function EmptyDossier({ totalTargets }: { totalTargets: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center flex-1 text-center px-6"
      style={{ color: TABLE.fgMute }}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden style={{ opacity: 0.35, marginBottom: 10 }}>
        <circle cx="18" cy="18" r="11" stroke={TABLE.accent} strokeWidth="1.2" />
        <circle cx="18" cy="18" r="5" stroke={TABLE.accent} strokeWidth="1.2" />
        <path d="M18 2 V7 M18 29 V34 M2 18 H7 M29 18 H34" stroke={TABLE.accent} strokeWidth="1.2" />
      </svg>
      <div style={{ ...T.label, fontSize: 10, color: TABLE.fgSubtle }}>
        NO TARGET SELECTED
      </div>
      <div
        style={{
          ...T.body,
          fontSize: 12,
          color: TABLE.fgMute,
          marginTop: 8,
          maxWidth: 240,
        }}
      >
        Select one of {totalTargets} targets in the roster or on the map to open its dossier.
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2"
      style={{
        background: TABLE.bgPanel,
        borderTop: `1px solid ${TABLE.line}`,
      }}
    >
      <div className="flex items-center gap-3" style={{ ...T.label, fontSize: 9, color: TABLE.fgMute }}>
        <span>IMAGERY · ESRI WORLD IMAGERY</span>
        <span style={{ color: TABLE.fgSubtle }}>·</span>
        <span>GEO · MAPLIBRE GL</span>
        <span style={{ color: TABLE.fgSubtle }}>·</span>
        <span>CCTV · NYC DOT TRAFFIC CAMS</span>
      </div>
      <div style={{ ...T.label, fontSize: 9, color: TABLE.fgSubtle }}>
        TELEMETRY SIMULATED · EDITORIAL USE
      </div>
    </div>
  );
}
