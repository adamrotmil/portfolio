"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LivelinePoint } from "liveline";

// A toy synthetic market engine.  Not modeling anything real — just a
// driven random walk with a user-controllable volatility knob and an
// optional "push" that nudges momentum up or down for a few ticks.
//
// Output shape is exactly what Liveline wants: a growing `LivelinePoint[]`
// plus a latest `value`.  Liveline handles the smooth 60fps interpolation
// between ticks on its own.

// "Wild swings, fast updates (100ms)" — matches Benji's demo at
// benji.org/liveline.  Fast ticks + meaty step sizes give the line real
// character, and Liveline's 60fps interpolation smooths the path between
// updates.  Window buffer stays at ~2 minutes (now much larger in point
// count since we tick 5× faster).
const TICK_MS = 100;
const WINDOW_SECS = 60;
const TRIM_AFTER_SECS = WINDOW_SECS * 2;
const nowSecs = () => Date.now() / 1000;

export type TickerControls = {
  volatility: number;            // 0.1 (calm) → 3 (chaos)
  push: 0 | 1 | -1;              // +1 pumps, -1 dumps, 0 drift
  paused: boolean;
};

const INITIAL_CONTROLS: TickerControls = {
  // Wild-swings default — with 100ms ticks, a lower coefficient produces
  // the right balance of dramatic-but-legible motion.  Users can still
  // dial it up to 3 for outright chaos.
  volatility: 1.4,
  push: 0,
  paused: false,
};

// Sits the walk in a $420–$525 band at typical volatility — gives the
// chart enough vertical range to breathe through buy walls, short-covering
// rallies, and shock dips without either feeling cramped or flying away.
// The value itself matters less than the gravity target + step sizes
// that orbit around it.
const INITIAL_PRICE = 472.5;

export interface DemoTickerApi {
  data: LivelinePoint[];
  value: number;
  controls: TickerControls;
  setControls: (patch: Partial<TickerControls>) => void;
  nudge: (direction: 1 | -1) => void;
  reset: () => void;
  /** Synthetic rolling CVD so the order book header has something to show
   *  in Demo mode.  Walks with the price direction + push bias. */
  cvd: number;
  /** For the credits blurb in the UI. */
  symbol: string;
}

export function useDemoTicker(): DemoTickerApi {
  const [data, setData] = useState<LivelinePoint[]>(() => seed());
  const [value, setValue] = useState<number>(INITIAL_PRICE);
  const [controls, setControlsRaw] = useState<TickerControls>(INITIAL_CONTROLS);
  const [cvd, setCvd] = useState<number>(0);

  // `push` is time-boxed: a nudge fades to zero over ~5 seconds.
  const pushDecayRef = useRef(0);
  // Low-frequency drift so the price doesn't get stuck near a boundary.
  // Drift is an Ornstein–Uhlenbeck-ish pull back toward the initial price.
  const driftRef = useRef(0);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const setControls = useCallback((patch: Partial<TickerControls>) => {
    setControlsRaw((prev) => ({ ...prev, ...patch }));
  }, []);

  // A "nudge" lights up the push briefly, then decays. This is what drives
  // degen mode's particles + shake (momentum swing detection).  At 100ms
  // ticks we want the effect to last roughly 2 seconds, so 20 ticks.
  const nudge = useCallback((direction: 1 | -1) => {
    pushDecayRef.current = 20;
    setControlsRaw((prev) => ({ ...prev, push: direction }));
  }, []);

  const reset = useCallback(() => {
    pushDecayRef.current = 0;
    driftRef.current = 0;
    setControlsRaw(INITIAL_CONTROLS);
    setData(seed());
    setValue(INITIAL_PRICE);
    setCvd(0);
  }, []);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = setInterval(() => {
      const c = controlsRef.current;
      if (c.paused) return;

      setValue((prev) => {
        // "Wild swings, fast updates" walk — tuned so the price orbits
        // INITIAL_PRICE (~$472) inside roughly a $420–$525 band at
        // default volatility.  Step sizes are scaled by ~INITIAL_PRICE/128
        // from the previous tuning so the shape of the motion stays the
        // same while the visible range grows.
        //
        //   • Momentum-persistent drift (0.93 decay) → carves real waves
        //     and pockets where "chasing" and "short covering" read
        //     naturally (a run-up gains momentum; a turn takes several
        //     ticks to reverse).
        //   • Random kicks at the tail for texture without spikes.
        //   • Very gentle gravity toward the initial price so long runs
        //     don't march off-screen.  Weak enough that a multi-second
        //     trend can still cover $20+.
        //   • Rare 1.5% shock ticks that mimic buy/sell walls being
        //     eaten through — big instantaneous jumps that the
        //     order-book panel reacts to on the next poll.
        const vol = Math.max(0.05, c.volatility);
        const scale = INITIAL_PRICE / 128;   // step-size scale factor

        driftRef.current = driftRef.current * 0.93 + (Math.random() - 0.5) * vol * 0.35 * scale;
        const kick    = (Math.random() - 0.5) * vol * 0.45 * scale;
        const gravity = (INITIAL_PRICE - prev) * 0.003;
        const shock   = Math.random() < 0.015 ? (Math.random() - 0.5) * vol * 2.5 * scale : 0;

        let pushBias = 0;
        if (pushDecayRef.current > 0) {
          pushBias = c.push * (pushDecayRef.current / 20) * vol * 0.7 * scale;
          pushDecayRef.current--;
          if (pushDecayRef.current === 0) {
            setControlsRaw((prev) => ({ ...prev, push: 0 }));
          }
        }

        const next = Math.max(0.01, prev + driftRef.current + kick + gravity + pushBias + shock);

        const point: LivelinePoint = { time: nowSecs(), value: next };
        setData((arr) => {
          const cutoff = point.time - TRIM_AFTER_SECS;
          const trimmed = arr.filter((p) => p.time >= cutoff);
          trimmed.push(point);
          return trimmed;
        });

        // Synthetic CVD that tracks direction + size of the move.  Scaled
        // so it feels roughly in the same order of magnitude as real
        // coins' first-minute CVD numbers.
        const delta = next - prev;
        const pseudoSize = Math.abs(delta) * 0.25 + Math.random() * 0.08;
        setCvd((c0) => c0 + (delta > 0 ? pseudoSize : delta < 0 ? -pseudoSize : 0));

        return next;
      });
    }, TICK_MS);

    return () => {
      if (id) clearInterval(id);
      id = null;
    };
  }, []);

  return {
    data,
    value,
    controls,
    setControls,
    nudge,
    reset,
    cvd,
    symbol: "GMTRX",
  };
}

function seed(): LivelinePoint[] {
  // Seed with ~150 points of recent wild-swings history (15s of 100ms
  // ticks) so the chart opens with a lived-in shape instead of a straight
  // line.  Step sizes scaled to the initial price so the seeded shape
  // lives in the same $420–$525 band the live walk will occupy.
  const out: LivelinePoint[] = [];
  const now = nowSecs();
  const stepSecs = TICK_MS / 1000;
  const scale = INITIAL_PRICE / 128;
  let v = INITIAL_PRICE;
  let drift = 0;
  for (let i = 150; i >= 1; i--) {
    drift = drift * 0.93 + (Math.random() - 0.5) * 0.55 * scale;
    v += drift + (Math.random() - 0.5) * 0.7 * scale;
    out.push({ time: now - i * stepSecs, value: Math.max(0.01, v) });
  }
  return out;
}
