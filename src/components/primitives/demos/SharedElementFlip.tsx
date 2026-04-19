"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Teaches: shared-element transitions don't require separate animation
 * code. Motion's `layoutId` matches elements by identity across renders
 * — when the component unmounts from one location and mounts in another
 * (or changes layout), Motion runs a FLIP animation between them. The
 * effect feels like physical continuity, because the *same* element
 * simply travels.
 */
export default function SharedElementFlip() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="thumb"
            layoutId="flip-card"
            onClick={() => setOpen(true)}
            className="absolute left-4 top-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 pr-3 text-left backdrop-blur"
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <motion.span
              layoutId="flip-thumb"
              className="block h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-amber-300 to-rose-500"
            />
            <motion.span
              layoutId="flip-title"
              className="font-sans text-[0.75rem] font-medium text-white/90"
            >
              Sunrise
            </motion.span>
          </motion.button>
        ) : (
          <motion.button
            key="full"
            layoutId="flip-card"
            onClick={() => setOpen(false)}
            className="absolute inset-4 flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur"
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <motion.span
              layoutId="flip-thumb"
              className="h-24 w-full rounded-xl bg-gradient-to-br from-amber-300 via-orange-500 to-rose-500"
            />
            <motion.span
              layoutId="flip-title"
              className="font-serif text-xl leading-tight text-white"
            >
              Sunrise
            </motion.span>
            <span className="font-sans text-[0.78rem] leading-relaxed text-white/70">
              A palette captured at 6:42am on the Pacific coast. Click to
              collapse.
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
