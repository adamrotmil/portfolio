"use client";

import { useEffect, useState } from "react";
import { interpolate } from "flubber";

// Two shapes with genuinely different silhouettes — circle and rounded
// square — chosen so the morph has something to actually animate.
const CIRCLE = "M50,10 A40,40 0 1,1 49.9,10 Z";
const SQUARE =
  "M18,10 L82,10 Q90,10 90,18 L90,82 Q90,90 82,90 L18,90 Q10,90 10,82 L10,18 Q10,10 18,10 Z";
const DURATION = 1600; // ms one direction

/**
 * Teaches: two SVG paths with different topologies can't be interpolated
 * directly — the browser doesn't know how to match points between them.
 * flubber solves this by re-sampling both paths into matched point sets,
 * then linearly interpolating. The result is a clean, topology-tolerant
 * path morph. This is the technique behind every app icon morph you
 * admire.
 */
export default function SvgMorph() {
  const [d, setD] = useState(CIRCLE);

  useEffect(() => {
    const forward = interpolate(CIRCLE, SQUARE, { maxSegmentLength: 2 });
    const back = interpolate(SQUARE, CIRCLE, { maxSegmentLength: 2 });
    let raf = 0;
    let start = performance.now();
    let dir: "forward" | "back" = "forward";

    function tick(now: number) {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setD(dir === "forward" ? forward(eased) : back(eased));
      if (t >= 1) {
        dir = dir === "forward" ? "back" : "forward";
        start = now + 400; // pause between swaps
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-28 w-28">
        <defs>
          <linearGradient id="morphFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <path d={d} fill="url(#morphFill)" />
      </svg>
    </div>
  );
}
