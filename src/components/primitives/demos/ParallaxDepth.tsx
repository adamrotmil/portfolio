"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/**
 * Teaches: perceived depth on a flat screen comes from differential
 * motion. Layers further "back" offset less than layers further
 * "forward" when the camera (cursor) moves. Three layers is usually
 * enough. Spring-smooth the pointer signal so the scene glides.
 */
export default function ParallaxDepth() {
  const stage = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 90, damping: 18 });
  const py = useSpring(rawY, { stiffness: 90, damping: 18 });

  // Each layer gets a different multiplier — back moves least, front most.
  const bgX = useTransform(px, [-1, 1], [-6, 6]);
  const bgY = useTransform(py, [-1, 1], [-4, 4]);
  const midX = useTransform(px, [-1, 1], [-18, 18]);
  const midY = useTransform(py, [-1, 1], [-12, 12]);
  const fgX = useTransform(px, [-1, 1], [-36, 36]);
  const fgY = useTransform(py, [-1, 1], [-24, 24]);

  function handleMove(e: React.PointerEvent) {
    const el = stage.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    rawX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    rawY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }
  function handleLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <div
      ref={stage}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 60%, #1a1e35 0%, #0a0b12 75%)",
      }}
    >
      {/* Layer 1 — back: scattered star field */}
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="pointer-events-none absolute inset-[-10%]"
      >
        {STAR_FIELD.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.a,
            }}
          />
        ))}
      </motion.div>

      {/* Layer 2 — mid: mountain silhouette */}
      <motion.svg
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        style={{ x: midX, y: midY }}
        className="pointer-events-none absolute inset-x-[-8%] bottom-[-10%] h-[55%] w-[116%]"
      >
        <path
          d="M0,80 L0,55 L35,30 L60,50 L95,18 L125,45 L160,25 L200,48 L200,80 Z"
          fill="#2a2f50"
          opacity="0.9"
        />
      </motion.svg>

      {/* Layer 3 — front: crescent moon + wordmark */}
      <motion.div
        style={{ x: fgX, y: fgY }}
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3"
      >
        <div
          className="h-12 w-12 rounded-full"
          style={{
            background: "#f1e9c8",
            boxShadow: "inset -8px -2px 0 0 #0e1020, 0 0 30px rgba(241,233,200,0.35)",
          }}
        />
        <div className="font-serif text-[0.9rem] italic text-white/90">
          Depth
        </div>
      </motion.div>
    </div>
  );
}

// Deterministic star positions so SSR + client render match.
const STAR_FIELD = [
  { x: 6, y: 12, size: 1.5, a: 0.55 },
  { x: 18, y: 28, size: 1, a: 0.35 },
  { x: 33, y: 8, size: 2, a: 0.7 },
  { x: 48, y: 20, size: 1, a: 0.5 },
  { x: 62, y: 10, size: 1.5, a: 0.6 },
  { x: 75, y: 22, size: 1, a: 0.45 },
  { x: 88, y: 14, size: 1.8, a: 0.7 },
  { x: 12, y: 40, size: 1, a: 0.4 },
  { x: 40, y: 38, size: 1.2, a: 0.5 },
  { x: 70, y: 44, size: 1, a: 0.35 },
  { x: 92, y: 36, size: 1.4, a: 0.55 },
  { x: 25, y: 55, size: 0.8, a: 0.35 },
  { x: 55, y: 50, size: 1, a: 0.45 },
  { x: 82, y: 58, size: 1.2, a: 0.55 },
];
