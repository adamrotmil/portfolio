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

// Liveline expects `time` in Unix seconds (see its README).  We tick in
// milliseconds internally for smoothness, convert on emit.
const TICK_MS = 500;
const WINDOW_SECS = 60;          // keep ~2 minutes of history in the buffer
const TRIM_AFTER_SECS = WINDOW_SECS * 2;
const nowSecs = () => Date.now() / 1000;

export type TickerControls = {
  volatility: number;            // 0.1 (calm) → 3 (chaos)
  push: 0 | 1 | -1;              // +1 pumps, -1 dumps, 0 drift
  paused: boolean;
};

const INITIAL_CONTROLS: TickerControls = {
  volatility: 1.2,
  push: 0,
  paused: false,
};

const INITIAL_PRICE = 128.42;

export interface DemoTickerApi {
  data: LivelinePoint[];
  value: number;
  controls: TickerControls;
  setControls: (patch: Partial<TickerControls>) => void;
  nudge: (direction: 1 | -1) => void;
  reset: () => void;
  /** For the credits blurb in the UI. */
  symbol: string;
}

export function useDemoTicker(): DemoTickerApi {
  const [data, setData] = useState<LivelinePoint[]>(() => seed());
  const [value, setValue] = useState<number>(INITIAL_PRICE);
  const [controls, setControlsRaw] = useState<TickerControls>(INITIAL_CONTROLS);

  // `push` is time-boxed: a nudge fades to zero over ~5 seconds.
  const pushDecayRef = useRef(0);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const setControls = useCallback((patch: Partial<TickerControls>) => {
    setControlsRaw((prev) => ({ ...prev, ...patch }));
  }, []);

  // A "nudge" lights up the push briefly, then decays. This is what drives
  // degen mode's particles + shake (momentum swing detection).
  const nudge = useCallback((direction: 1 | -1) => {
    pushDecayRef.current = 10; // ~5 seconds at 500ms ticks
    setControlsRaw((prev) => ({ ...prev, push: direction }));
  }, []);

  const reset = useCallback(() => {
    pushDecayRef.current = 0;
    setControlsRaw(INITIAL_CONTROLS);
    setData(seed());
    setValue(INITIAL_PRICE);
  }, []);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = setInterval(() => {
      const c = controlsRef.current;
      if (c.paused) return;

      setValue((prev) => {
        // Pure brownian step, scaled by volatility, plus the push bias.
        const vol = Math.max(0.05, c.volatility);
        const randomStep = (Math.random() - 0.5) * vol * 0.8;

        // Push bias decays; if the user manually held up/down via controls,
        // we treat that as continuous (no decay).
        let pushBias = 0;
        if (pushDecayRef.current > 0) {
          pushBias = c.push * (pushDecayRef.current / 10) * vol * 0.6;
          pushDecayRef.current--;
          if (pushDecayRef.current === 0) {
            // Clear the transient push once decay ends
            setControlsRaw((prev) => ({ ...prev, push: 0 }));
          }
        }

        const next = Math.max(0.01, prev + randomStep + pushBias);

        const point: LivelinePoint = { time: nowSecs(), value: next };
        setData((arr) => {
          const cutoff = point.time - TRIM_AFTER_SECS;
          const trimmed = arr.filter((p) => p.time >= cutoff);
          trimmed.push(point);
          return trimmed;
        });
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
    symbol: "GMTRX",
  };
}

function seed(): LivelinePoint[] {
  // Seed with 40 points of gentle drift so the chart doesn't start empty.
  const out: LivelinePoint[] = [];
  const now = nowSecs();
  const stepSecs = TICK_MS / 1000;
  let v = INITIAL_PRICE;
  for (let i = 40; i >= 1; i--) {
    v += (Math.random() - 0.5) * 0.4;
    out.push({ time: now - i * stepSecs, value: Math.max(0.01, v) });
  }
  return out;
}
