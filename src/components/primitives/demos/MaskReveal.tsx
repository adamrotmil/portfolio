"use client";

import { motion } from "motion/react";

const LINES = ["Motion as", "a language", "for product"];

/**
 * Teaches: clip-path inset (top right bottom left) hides content behind
 * invisible shutters. Animating the inset open reveals content without
 * moving it — the text is always in its final position, just masked.
 * Staggering the lines creates editorial cadence.
 */
export default function MaskReveal() {
  return (
    <div className="absolute inset-0 flex flex-col items-start justify-center gap-1 px-8">
      {LINES.map((line, i) => (
        <div key={line} className="overflow-hidden py-[0.05em]">
          <motion.div
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{
              duration: 0.9,
              delay: 0.2 + i * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="font-serif text-[clamp(1.4rem,3.2vw,2.2rem)] leading-[1.05] text-white/95"
          >
            {line}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
