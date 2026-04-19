"use client";

import { motion } from "motion/react";

/**
 * Teaches: the Vision-Pro aesthetic is a single CSS property with care
 * around it. backdrop-filter blurs what's behind the element; a thin
 * inner border + subtle outer shadow sells the physicality. The key is
 * *motion behind the glass* — the refraction reads only when the
 * background moves relative to the panel.
 */
export default function LiquidGlass() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient background — gives the glass something to refract */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(115deg, #ff7ab6 0%, #7b5cff 30%, #3ecfff 60%, #7bffb0 100%)",
          backgroundSize: "280% 280%",
          filter: "saturate(1.15)",
        }}
      />
      {/* Floating glass card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex min-w-[180px] flex-col gap-2 rounded-2xl px-5 py-4"
          style={{
            backdropFilter: "blur(18px) saturate(180%)",
            WebkitBackdropFilter: "blur(18px) saturate(180%)",
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.28)",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            <span className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-white/85">
              Now playing
            </span>
          </div>
          <div className="font-serif text-[1.05rem] leading-tight text-white">
            Midnight Transfer
          </div>
          <div className="font-sans text-[0.72rem] text-white/75">
            Rival Consoles · 3:42
          </div>
        </div>
      </div>
    </div>
  );
}
