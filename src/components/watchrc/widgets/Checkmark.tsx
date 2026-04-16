"use client";

import { motion } from "motion/react";
import { IOS } from "../tokens";

// Animated iOS-style check drawn via stroke-dashoffset.
export default function Checkmark({ size = 14, color = IOS.green, delay = 0 }: { size?: number; color?: string; delay?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <motion.circle
        cx={10}
        cy={10}
        r={9}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30, delay }}
      />
      <motion.path
        d="M5.5 10.5 l3 3 l6 -6.5"
        stroke="#000"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.12, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
