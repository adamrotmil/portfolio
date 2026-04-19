"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/**
 * Teaches: pointer events produce a raw (x, y). useMotionValue holds the
 * raw value, useSpring smooths it, useTransform remaps it into a rotation
 * range. The chain is the general pattern for every input-driven effect:
 *   raw input → smoothed signal → visual transform.
 */
export default function ReactiveTilt() {
  const stage = useRef<HTMLDivElement>(null);

  // Normalized pointer position in [-1, 1]. Spring smooths every movement.
  const px = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 });
  const py = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 });

  // Map normalized input to tilt angles. Note the flip on rotateX — moving
  // the cursor up should tilt the top of the card toward us.
  const rotateY = useTransform(px, [-1, 1], [-14, 14]);
  const rotateX = useTransform(py, [-1, 1], [10, -10]);

  // Parallax highlight that follows the cursor across the card surface.
  const highlightX = useTransform(px, [-1, 1], ["20%", "80%"]);
  const highlightY = useTransform(py, [-1, 1], ["20%", "80%"]);

  function handleMove(e: React.PointerEvent) {
    const el = stage.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    px.set(nx);
    py.set(ny);
  }

  function handleLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <div
      ref={stage}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="absolute inset-0 flex items-center justify-center"
      style={{ perspective: 900 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative h-[62%] w-[58%] rounded-[18px] border border-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
      >
        {/* Base gradient body */}
        <div
          className="absolute inset-0 rounded-[18px]"
          style={{
            background:
              "linear-gradient(135deg, #1b2236 0%, #0f1320 55%, #090b12 100%)",
          }}
        />
        {/* Cursor-tracking specular highlight */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[18px] opacity-70 mix-blend-screen"
          style={{
            background: useTransform(
              [highlightX, highlightY] as const,
              ([x, y]) =>
                `radial-gradient(120px 120px at ${x} ${y}, rgba(255,255,255,0.35), rgba(255,255,255,0) 60%)`,
            ),
          }}
        />
        {/* Subtle chip label */}
        <div className="absolute bottom-4 left-4 font-sans text-[0.7rem] uppercase tracking-[0.18em] text-white/70">
          Tilt
        </div>
      </motion.div>
    </div>
  );
}
