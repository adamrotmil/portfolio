"use client";

import { motion } from "motion/react";
import { IOS } from "../tokens";

// Three pulsing dots for "Searching..." states.  Staggered wave.
export default function SearchingDots({ color = IOS.text }: { color?: string }) {
  return (
    <div className="inline-flex items-center" style={{ gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{ width: 6, height: 6, borderRadius: 3, background: color }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.18,
          }}
        />
      ))}
    </div>
  );
}
