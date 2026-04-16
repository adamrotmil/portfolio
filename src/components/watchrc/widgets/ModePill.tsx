"use client";

import { motion } from "motion/react";
import { IOS } from "../tokens";
import type { FlightMode } from "@/watchrc/types";

const COLORS: Record<FlightMode, { bg: string; fg: string; label: string }> = {
  orbit:  { bg: "#0A3E8A",   fg: "#9EC4FF", label: "ORBIT" },
  manual: { bg: "#3A3A3C",   fg: "#FFFFFF", label: "MANUAL" },
  circle: { bg: "#1F4A3B",   fg: "#6EE7A6", label: "CIRCLE" },
  rth:    { bg: "#4A2A0A",   fg: "#FFC87A", label: "RTH" },
  land:   { bg: IOS.redSoft, fg: IOS.red,   label: "LANDING" },
};

export default function ModePill({ mode }: { mode: FlightMode }) {
  const c = COLORS[mode];
  return (
    <motion.div
      layout
      initial={false}
      animate={{ backgroundColor: c.bg }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      style={{
        padding: "3px 10px",
        borderRadius: 10,
        color: c.fg,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: 0.6,
      }}
    >
      <motion.span
        key={c.label}
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {c.label}
      </motion.span>
    </motion.div>
  );
}
