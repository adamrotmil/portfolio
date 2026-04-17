"use client";

import { useEffect, useRef, useState } from "react";
import { TABLE, T } from "./tokens";

interface Props {
  camera?: {
    id: string;
    name: string;
    distanceFt: number;
  };
  /** Logical position label — "CAM-01", "S-CAM-02", etc. */
  label: string;
  /** Poll interval in ms — 3000 is courteous but still feels live. */
  intervalMs?: number;
}

// Real-time tile for a single NYC DOT traffic camera, polled by
// refreshing an <img src> with a cache-busting query param.  Works
// without CORS because image tags don't require it.  Shows a subtle
// grid overlay + timestamp + "REC" dot to sell the surveillance
// aesthetic without overdoing it.
export default function CctvTile({ camera, label, intervalMs = 3000 }: Props) {
  const [tick, setTick] = useState(0);
  const [err, setErr] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!camera) return;
    setErr(false);
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setErr(false);
    }, intervalMs);
    return () => clearInterval(id);
  }, [camera, intervalMs]);

  const url = camera
    ? `https://webcams.nyctmc.org/api/cameras/${camera.id}/image?t=${tick}`
    : null;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "#000",
        border: `1px solid ${TABLE.line}`,
        borderRadius: TABLE.rSm,
        aspectRatio: "4 / 3",
      }}
    >
      {url ? (
        <img
          ref={imgRef}
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "contrast(1.05) brightness(0.95) saturate(0.9)" }}
          onError={() => setErr(true)}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: TABLE.fgSubtle, ...T.label, fontSize: 10 }}
        >
          NO SIGNAL
        </div>
      )}

      {/* Scan-line overlay — very subtle */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)",
        }}
      />

      {/* Top strip */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.65), transparent)",
          color: TABLE.fg,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block"
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: err ? TABLE.amber : TABLE.red,
              boxShadow: err ? "none" : "0 0 5px rgba(239,90,90,0.85)",
              animation: err ? "none" : "cctv-rec 1.2s ease-in-out infinite",
            }}
          />
          <span style={{ ...T.label, fontSize: 9 }}>{label}</span>
        </div>
        <span style={{ ...T.numeric, fontSize: 9, color: TABLE.fgMute }}>
          {err ? "OFFLINE" : "LIVE"}
        </span>
      </div>

      {/* Bottom strip — intersection + timestamp */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 px-2 py-1.5"
        style={{
          background: "linear-gradient(0deg, rgba(0,0,0,0.75), transparent)",
          color: TABLE.fg,
        }}
      >
        <div
          className="truncate"
          style={{
            ...T.label,
            fontSize: 9,
            color: TABLE.fg,
          }}
        >
          {camera?.name ?? "NO CAM ASSIGNED"}
        </div>
        <div
          className="flex justify-between"
          style={{ ...T.numeric, fontSize: 9, color: TABLE.fgMute }}
        >
          <span>
            {camera ? `${camera.distanceFt}ft` : ""}
          </span>
          <span>NYC DOT</span>
        </div>
      </div>
    </div>
  );
}
