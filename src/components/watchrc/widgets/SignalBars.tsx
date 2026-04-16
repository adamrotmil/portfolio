"use client";

import { motion } from "motion/react";
import { IOS } from "../tokens";

export default function SignalBars({
  strength,
  size = 14,
}: {
  strength: number; // 0-4
  size?: number;
}) {
  const bars = [0, 1, 2, 3];
  return (
    <div className="inline-flex items-end" style={{ gap: 2, height: size }}>
      {bars.map((i) => {
        const on = i < Math.round(strength);
        const barH = 3 + i * (size - 5) / 3;
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: on ? IOS.text : IOS.fill3,
              opacity: on ? 1 : 0.7,
            }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ width: 3, height: barH, borderRadius: 1 }}
          />
        );
      })}
    </div>
  );
}
