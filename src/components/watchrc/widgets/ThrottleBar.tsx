"use client";

import { motion } from "motion/react";
import { IOS, SPRING } from "../tokens";

export default function ThrottleBar({ value, width = 200, color = IOS.blue }: { value: number; width?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        width,
        height: 10,
        borderRadius: 5,
        background: IOS.fill2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={SPRING.number}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          background: color,
          borderRadius: 5,
        }}
      />
    </div>
  );
}
