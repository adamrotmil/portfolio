"use client";

import { motion } from "motion/react";

/**
 * Teaches: always-on motion at a low amplitude registers as "alive"
 * without competing for attention. Two layers breathing in phase (or
 * gently offset) produce a feeling of depth and presence. This is what
 * makes Apple's Siri orb or a status dot feel like it's thinking.
 */
export default function AmbientBreath() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Outer halo — larger range, slower cycle, lower opacity */}
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-32 w-32 rounded-full bg-indigo-400/30 blur-2xl"
      />
      {/* Inner core — smaller range, tighter cycle, higher opacity */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative h-16 w-16 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #c7d2fe 0%, #6366f1 55%, #3730a3 100%)",
          boxShadow: "0 0 40px rgba(99,102,241,0.45), inset 0 0 20px rgba(255,255,255,0.25)",
        }}
      />
    </div>
  );
}
