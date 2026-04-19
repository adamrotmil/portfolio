"use client";

import { motion } from "motion/react";

/**
 * Teaches: the spring equation — stiffness pulls toward the target,
 * damping opposes motion. Lower damping relative to stiffness = visible
 * overshoot. The values below are tuned for a pronounced, legible bounce.
 */
export default function OvershootSpring() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        initial={{ y: 60, scale: 0.8, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 12, mass: 0.9 }}
        className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        <span className="font-sans text-sm tracking-wide text-white/90">
          Delivered
        </span>
      </motion.div>
    </div>
  );
}
