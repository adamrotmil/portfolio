"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useDrag } from "@use-gesture/react";

const MAX_TRAVEL = 120;

/**
 * Teaches: real drag doesn't stop at a hard wall — it resists past a
 * boundary ("rubber-banding") and springs home. useDrag from use-gesture
 * exposes this as a one-liner. The resistance is what makes native iOS
 * feel native.
 */
export default function RubberBand() {
  const x = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 220, damping: 22 });
  const rot = useTransform(smoothX, [-MAX_TRAVEL, MAX_TRAVEL], [-8, 8]);

  const bind = useDrag(
    ({ down, offset: [ox] }) => {
      x.set(down ? ox : 0);
    },
    {
      axis: "x",
      bounds: { left: -MAX_TRAVEL, right: MAX_TRAVEL },
      // resistance past the bounds — this is the "rubber" feel
      rubberband: 0.45,
      from: () => [x.get(), 0],
    },
  );

  // Gesture binds to the wrapper; the motion.div handles the visual
  // transform. This separation avoids the onDrag type clash between
  // use-gesture and motion.
  return (
    <div
      {...bind()}
      style={{ touchAction: "none" }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <motion.div
        style={{ x: smoothX, rotate: rot }}
        className="flex cursor-grab select-none items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur active:cursor-grabbing"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
        <span className="font-sans text-sm tracking-wide text-white/85">
          Drag me
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
      </motion.div>
    </div>
  );
}
