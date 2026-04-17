"use client";

import type { Restaurant } from "@/map/types";
import { formatPrice, formatRating } from "@/map/types";
import type { Reading } from "@/map/useTelemetry";
import { assetPath } from "@/lib/basePath";
import { TABLE, T } from "./tokens";
import CctvTile from "./CctvTile";

interface Props {
  restaurant: Restaurant;
  reading: Reading | undefined;
  onClose: () => void;
}

// Target deep-dive.  Photo at top, then:
//   · codename + meta
//   · CCTV tile (live DOT cam)
//   · telemetry grid (4 gauges with sparkline behind the headline)
//   · sources / recognition
//   · address
// Designed to be dense but readable — everything sits on a near-black
// ground with 1px dividers and mono numerics.
export default function TargetDossier({ restaurant: r, reading, onClose }: Props) {
  return (
    <aside
      className="h-full w-full overflow-y-auto flex flex-col"
      style={{
        background: TABLE.bg,
        color: TABLE.fg,
        borderLeft: `1px solid ${TABLE.line}`,
      }}
    >
      {/* Image + close */}
      <div
        className="relative w-full overflow-hidden shrink-0"
        style={{
          aspectRatio: "5 / 3",
          background: "#18181c",
          borderBottom: `1px solid ${TABLE.line}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath(r.photo)}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "saturate(0.88) contrast(1.02) brightness(0.92)" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Dark veil at bottom for the codename legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(10,12,15,0) 50%, rgba(10,12,15,0.88) 100%)",
          }}
        />
        <div className="absolute left-3 bottom-2.5 right-3">
          <div
            className="flex items-center gap-1.5"
            style={{ ...T.label, color: TABLE.accent, opacity: 0.85 }}
          >
            TGT-{r.id.slice(0, 3).toUpperCase()}
            <span style={{ color: TABLE.fgSubtle }}>·</span>
            <span style={{ color: TABLE.fgMute }}>{r.neighborhood}</span>
          </div>
          <h2
            className="leading-[1.05] mt-0.5"
            style={{
              ...T.display,
              fontSize: 26,
              color: "#f6f7f8",
            }}
          >
            {r.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close dossier"
          className="absolute right-2 top-2 w-7 h-7 flex items-center justify-center"
          style={{
            background: "rgba(10,12,15,0.75)",
            color: TABLE.fg,
            border: `1px solid ${TABLE.line}`,
            borderRadius: TABLE.rSm,
            cursor: "pointer",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3 3L13 13M13 3L3 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Meta row */}
      <div
        className="flex items-center gap-4 px-4 py-2.5"
        style={{
          borderBottom: `1px solid ${TABLE.line}`,
          background: TABLE.bgPanel,
        }}
      >
        <MetaCell label="Cuisine" value={r.cuisine[0]} />
        <MetaCell label="Price" value={formatPrice(r.price)} mono />
        <MetaCell label="Rating" value={formatRating(r.rating)} mono />
        <MetaCell label="Avg pp" value={`$${r.avgCheck}`} mono />
      </div>

      {/* Live telemetry */}
      <Section title="Live telemetry" meta={reading ? `upd ${new Date(reading.ts).toISOString().slice(11,19)}Z` : ""}>
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          <Gauge
            label="Wait"
            value={reading ? `${Math.round(reading.wait)}` : "–"}
            unit="m"
            trend={reading?.trend}
            tone={reading && reading.wait >= 45 ? "warn" : "ok"}
            sparkline={reading?.sparkline}
          />
          <Gauge
            label="Kitchen"
            value={reading ? `${Math.round(reading.kitchenLoad * 100)}` : "–"}
            unit="%"
            tone={
              reading && reading.kitchenLoad >= 0.82
                ? "hot"
                : reading && reading.kitchenLoad >= 0.55
                  ? "warn"
                  : "ok"
            }
          />
          <Gauge
            label="Noise"
            value={reading ? `${Math.round(reading.noiseDb)}` : "–"}
            unit="dB"
            tone={reading && reading.noiseDb >= 85 ? "warn" : "ok"}
          />
          <Gauge
            label="Rsv pressure"
            value={reading ? reading.rsvPressure.toFixed(2) : "–"}
            tone={reading && reading.rsvPressure > 0.8 ? "hot" : reading && reading.rsvPressure > 0.5 ? "warn" : "ok"}
          />
        </div>
      </Section>

      {/* CCTV */}
      <Section
        title="Live feed"
        meta={r.camera ? `${r.camera.distanceFt}ft · NYC DOT` : "no camera"}
      >
        <div className="px-4 pb-4">
          <CctvTile
            camera={r.camera}
            label={`CAM-${r.id.slice(0, 3).toUpperCase()}`}
          />
        </div>
      </Section>

      {/* Blurb */}
      <Section title="Summary">
        <p
          className="px-4 pb-4"
          style={{
            ...T.body,
            color: TABLE.fgMute,
          }}
        >
          {r.blurb}
        </p>
      </Section>

      {/* Tags */}
      {r.tags.length > 0 ? (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {r.tags.map((t) => (
            <span
              key={t}
              style={{
                ...T.label,
                fontSize: 9,
                color: TABLE.fgMute,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${TABLE.line}`,
                borderRadius: TABLE.rSm,
                padding: "3px 7px",
                letterSpacing: "0.08em",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      {/* Sources */}
      <Section title="Recognition">
        <ul className="px-4 pb-4 flex flex-col gap-1.5">
          {r.sources.map((s) => (
            <li
              key={s.name}
              className="flex items-center gap-2"
              style={{
                ...T.body,
                fontSize: 11.5,
                color: TABLE.fg,
              }}
            >
              <span
                className="inline-block"
                style={{ width: 3, height: 3, borderRadius: 999, background: TABLE.accent }}
              />
              {s.badge ?? s.name}
            </li>
          ))}
        </ul>
      </Section>

      {/* Address */}
      <Section title="Location">
        <div className="px-4 pb-5" style={{ color: TABLE.fg }}>
          <p style={{ ...T.body, fontSize: 12 }}>{r.address}</p>
          <p style={{ ...T.numeric, fontSize: 10, color: TABLE.fgMute, marginTop: 2 }}>
            {r.lat.toFixed(5)}°N · {Math.abs(r.lng).toFixed(5)}°W
          </p>
        </div>
      </Section>
    </aside>
  );
}

function MetaCell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span style={{ ...T.label, color: TABLE.fgSubtle }}>{label}</span>
      <span
        style={{
          ...(mono ? T.numeric : T.body),
          fontSize: 13,
          color: TABLE.fg,
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: `1px solid ${TABLE.line}` }}>
      <div
        className="flex items-baseline justify-between px-4 pt-3 pb-2"
      >
        <span style={{ ...T.label, color: TABLE.fgSubtle }}>{title}</span>
        {meta ? (
          <span
            style={{
              ...T.numeric,
              fontSize: 9,
              color: TABLE.fgSubtle,
              letterSpacing: "0.02em",
            }}
          >
            {meta}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Gauge({
  label,
  value,
  unit,
  tone,
  trend,
  sparkline,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "ok" | "warn" | "hot";
  trend?: "up" | "down" | "flat";
  sparkline?: number[];
}) {
  const color =
    tone === "hot"
      ? TABLE.red
      : tone === "warn"
        ? TABLE.amber
        : TABLE.fg;
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "#0d1014",
        border: `1px solid ${TABLE.line}`,
        borderRadius: TABLE.rSm,
        padding: "10px 12px 12px",
      }}
    >
      {sparkline && sparkline.length > 2 ? (
        <Sparkline values={sparkline} color={color} />
      ) : null}
      <div className="flex items-baseline justify-between relative">
        <span style={{ ...T.label, color: TABLE.fgSubtle }}>{label}</span>
        {trend ? <TrendArrow trend={trend} /> : null}
      </div>
      <div
        className="relative flex items-baseline gap-0.5 mt-0.5"
        style={{ ...T.numeric, color }}
      >
        <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
          {value}
        </span>
        {unit ? (
          <span
            style={{
              fontSize: 11,
              color: TABLE.fgMute,
              marginLeft: 1,
              fontWeight: 500,
            }}
          >
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TrendArrow({ trend }: { trend: "up" | "down" | "flat" }) {
  const color =
    trend === "up" ? TABLE.red : trend === "down" ? TABLE.green : TABLE.fgSubtle;
  const d =
    trend === "up" ? "M3 7 L5.5 3 L8 7" : trend === "down" ? "M3 3 L5.5 7 L8 3" : "M2.5 5 L8.5 5";
  return (
    <svg width="10" height="10" viewBox="0 0 11 10" fill="none" aria-hidden>
      <path d={d} stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
      style={{ opacity: 0.22 }}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        points={pts}
      />
    </svg>
  );
}
