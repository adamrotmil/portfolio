"use client";

import { useEffect, useRef, useState } from "react";
import type { Restaurant } from "./types";

// Synthetic, time-varying telemetry — one "reading" per restaurant that
// ticks on a 1200 ms cadence.  All fabricated; values drift via gentle
// random walks inside plausible bands, with a 7-day baseline shift based
// on day of week + hour so the fleet reads coherently (Friday night is
// worse than Tuesday 3pm).
//
// The goal is a live *feel* at a density that real telemetry would need.
// We don't model reality — we model the shape of reality: numbers that
// move, trends that persist for a few ticks, occasional bigger jumps.

export interface Reading {
  /** Current estimated wait time in minutes (0–120). */
  wait: number;
  /** Kitchen load — 0..1 (fraction of max sustained ticket rate). */
  kitchenLoad: number;
  /** Ambient dB in the dining room (55–96). */
  noiseDb: number;
  /** Reservation pressure — 0..1 (inverse of slot availability). */
  rsvPressure: number;
  /** Covers served so far today. */
  coversToday: number;
  /** Short-horizon trend for the headline wait metric. */
  trend: "up" | "down" | "flat";
  /** Last update timestamp (ms). */
  ts: number;
  /** Is the venue currently open. */
  open: boolean;
  /** Small sparkline history (last ~32 wait samples). */
  sparkline: number[];
}

export type Telemetry = Record<string, Reading>;

// Baselines keyed off restaurant shape.  High-end tasting menus are
// reservation-pressure-heavy but wait-time light (all reserved).  Slice
// shops are the opposite.  We let price be a proxy.
function baseline(r: Restaurant, hour: number, dow: number) {
  // Dining cycle multiplier.  Three peaks — brunch, lunch, dinner —
  // so the fleet reads alive during any part of the operator's day.
  // Floor at 0.18 so even 3am shows "prep / cleanup" activity on the
  // 14 dimly-lit kitchens we've got staffed in the fiction.
  const cycle = Math.max(
    0.18,
    0.25 +
      0.25 * gaussian(hour, 10.5, 1.6) +   // brunch
      0.4 * gaussian(hour, 13, 1.4) +      // lunch
      0.55 * gaussian(hour, 20, 2.2),      // dinner
  );

  const weekend = dow === 5 || dow === 6;
  const weekBoost = weekend ? 1.12 : 1.0;

  // Tasting menus: pressure huge, wait tiny.  Slice shops: inverse.
  const isTasting = r.price >= 4;
  const isQuick = r.price <= 1;

  return {
    waitBase: isTasting ? 3 : isQuick ? 8 : 28,
    waitSwing: isTasting ? 2 : isQuick ? 16 : 24,
    pressureBase: isTasting ? 0.88 : isQuick ? 0.25 : 0.55,
    pressureSwing: isTasting ? 0.08 : isQuick ? 0.3 : 0.28,
    noiseBase: isTasting ? 62 : isQuick ? 82 : 74,
    noiseSwing: 7,
    cycle: cycle * weekBoost,
    isTasting,
    isQuick,
  };
}

function gaussian(x: number, mu: number, sigma: number) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Tick rate.  Slow enough that the eye reads it as "live," fast enough
// that the deck feels alive.
const TICK_MS = 1200;

export function useTelemetry(restaurants: Restaurant[]): Telemetry {
  const [state, setState] = useState<Telemetry>(() =>
    seed(restaurants),
  );

  // Keep the restaurants list in a ref so the interval closure doesn't
  // need to restart when it refreshes identity.
  const rsRef = useRef(restaurants);
  rsRef.current = restaurants;

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const d = new Date(now);
      const hour = d.getHours() + d.getMinutes() / 60;
      const dow = d.getDay();
      setState((prev) => {
        const next: Telemetry = { ...prev };
        for (const r of rsRef.current) {
          const cur = prev[r.id] ?? seedOne(r, now);
          const b = baseline(r, hour, dow);

          // Random walk around the baseline, pulled gently back.
          const waitTarget = b.waitBase + b.waitSwing * b.cycle;
          const waitStep = (waitTarget - cur.wait) * 0.12 + (Math.random() - 0.5) * 2.4;
          const wait = clamp(cur.wait + waitStep, 0, 120);

          const loadTarget = clamp(0.35 + 0.6 * b.cycle, 0.1, 1);
          const load = clamp(
            cur.kitchenLoad + (loadTarget - cur.kitchenLoad) * 0.1 + (Math.random() - 0.5) * 0.04,
            0.05,
            1,
          );

          const noiseTarget = b.noiseBase + b.noiseSwing * b.cycle;
          const noise = clamp(
            cur.noiseDb + (noiseTarget - cur.noiseDb) * 0.15 + (Math.random() - 0.5) * 1.6,
            48,
            98,
          );

          const pressureTarget = clamp(
            b.pressureBase + b.pressureSwing * b.cycle,
            0,
            1,
          );
          const pressure = clamp(
            cur.rsvPressure + (pressureTarget - cur.rsvPressure) * 0.08 + (Math.random() - 0.5) * 0.02,
            0,
            1,
          );

          const coversStep = Math.round(load * (1 + Math.random() * 1.5));
          const coversToday = cur.coversToday + coversStep;

          const delta = wait - cur.wait;
          const trend: Reading["trend"] =
            delta > 0.8 ? "up" : delta < -0.8 ? "down" : "flat";

          const sparkline = [...cur.sparkline, wait].slice(-32);

          // "Open" from an operator view = staff on premises.  Prep
          // kitchens run well before doors open, and closing crews
          // overlap post-service, so we keep the window generous.
          // Tasting-menu spots go dark overnight; everything else
          // shows at least a dim prep-crew pulse.
          const open = b.isTasting
            ? hour >= 16.5 && hour <= 23.5
            : hour >= 7.5 && hour <= 25; // ~1am

          next[r.id] = {
            wait,
            kitchenLoad: load,
            noiseDb: noise,
            rsvPressure: pressure,
            coversToday,
            trend,
            ts: now,
            open,
            sparkline,
          };
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return state;
}

function seed(restaurants: Restaurant[]): Telemetry {
  const now = Date.now();
  const out: Telemetry = {};
  for (const r of restaurants) out[r.id] = seedOne(r, now);
  return out;
}

function seedOne(r: Restaurant, now: number): Reading {
  const d = new Date(now);
  const hour = d.getHours() + d.getMinutes() / 60;
  const dow = d.getDay();
  const b = baseline(r, hour, dow);
  const wait = b.waitBase + b.waitSwing * b.cycle;
  return {
    wait,
    kitchenLoad: 0.35 + 0.6 * b.cycle,
    noiseDb: b.noiseBase + b.noiseSwing * b.cycle,
    rsvPressure: clamp(b.pressureBase + b.pressureSwing * b.cycle, 0, 1),
    coversToday: Math.round(40 + b.cycle * 220 + Math.random() * 30),
    trend: "flat",
    ts: now,
    open: b.isTasting
      ? hour >= 16.5 && hour <= 23.5
      : hour >= 7.5 && hour <= 25,
    sparkline: Array.from({ length: 12 }, () => wait + (Math.random() - 0.5) * 4),
  };
}
