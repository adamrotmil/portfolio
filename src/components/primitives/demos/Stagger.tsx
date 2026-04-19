"use client";

import { motion } from "motion/react";

const CHIPS = ["Design", "Motion", "Code", "Craft", "Ship", "Iterate"];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { y: 28, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

/**
 * Teaches: when several things animate together, a small time offset
 * between them ("stagger") reads as rhythm, not chaos. Motion's variants
 * system propagates from parent to child — the parent declares
 * staggerChildren and each child inherits its own animation from a
 * shared vocabulary.
 */
export default function Stagger() {
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-8">
      <motion.ul
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-wrap justify-center gap-2"
      >
        {CHIPS.map((chip) => (
          <motion.li
            key={chip}
            variants={item}
            className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-sans text-[0.8rem] text-white/80 backdrop-blur"
          >
            {chip}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
