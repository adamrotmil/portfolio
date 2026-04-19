"use client";

import { motion } from "motion/react";

/**
 * Teaches: a polished sequence is almost always a chain of individually
 * simple animations with careful delays. Motion's `delay` option + a
 * shared variants vocabulary lets you choreograph without a timeline
 * library. The secret is *pauses* — the empty air between stages is
 * what makes the whole thing feel intentional rather than rushed.
 */
export default function MultiStageSequence() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      {/* Stage 1: the mark scales in with overshoot */}
      <motion.div
        initial={{ scale: 0, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #6366f1, #ec4899)",
          boxShadow: "0 10px 30px rgba(99,102,241,0.4)",
        }}
      >
        <span className="font-serif text-[1.4rem] italic text-white">a</span>
      </motion.div>

      {/* Stage 2: the underline draws */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.75 }}
        style={{ transformOrigin: "left center" }}
        className="h-[2px] w-20 origin-left rounded-full bg-white/60"
      />

      {/* Stage 3: the hero line reveals through a mask */}
      <div className="overflow-hidden">
        <motion.div
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 1.1 }}
          className="font-serif text-[1.3rem] leading-tight text-white"
        >
          Welcome back
        </motion.div>
      </div>

      {/* Stage 4: the chip fades up last */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 1.55 }}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-sans text-[0.7rem] uppercase tracking-[0.16em] text-white/70"
      >
        Tap to continue
      </motion.div>
    </div>
  );
}
