"use client";

import { motion } from "motion/react";
import { IOS } from "../tokens";

interface Props {
  size: number;
  progress: number;         // 0–1
  stroke?: number;
  color?: string;
  trackColor?: string;
  pressed?: boolean;
  children?: React.ReactNode;
}

// Used for the "hold to confirm" ring on the Land screen.  Strokes a circle
// from the top clockwise as progress advances.  Animates the radius a touch
// while the user presses, for tactile feel.
export default function HoldRing({
  size,
  progress,
  stroke = 5,
  color = IOS.orange,
  trackColor = IOS.fill3,
  pressed = false,
  children,
}: Props) {
  const r = size / 2 - stroke / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <motion.div
      animate={{ scale: pressed ? 1.04 : 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
      style={{ width: size, height: size, position: "relative" }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{
            // Fast on fill (while held), slow on release (spring)
            type: pressed ? "tween" : "spring",
            duration: pressed ? 0.1 : undefined,
            stiffness: 180,
            damping: 24,
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
