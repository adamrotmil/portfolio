"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import type { Screen, TransitionKind } from "@/watchrc/types";
import { SPRING } from "./tokens";

interface Props {
  screen: Screen;
  transition: TransitionKind;
  children: ReactNode;
}

// Per-transition-kind initial/animate/exit variants.  Tuned to read as iOS:
// - forward/backward: horizontal slide with slight scale (pages push)
// - sheet/dismiss:    vertical slide + fade (modal card)
// - fade:             cross-fade with a subtle scale (failsafe state change)
function variantsFor(kind: TransitionKind) {
  switch (kind) {
    case "forward":
      return {
        initial: { x: "14%", opacity: 0, scale: 0.98 },
        animate: { x: "0%", opacity: 1, scale: 1 },
        exit:    { x: "-10%", opacity: 0, scale: 0.98 },
      };
    case "backward":
      return {
        initial: { x: "-14%", opacity: 0, scale: 0.98 },
        animate: { x: "0%", opacity: 1, scale: 1 },
        exit:    { x: "10%", opacity: 0, scale: 0.98 },
      };
    case "sheet":
      return {
        initial: { y: "100%", opacity: 0 },
        animate: { y: "0%", opacity: 1 },
        exit:    { y: "100%", opacity: 0 },
      };
    case "dismiss":
      return {
        initial: { y: "-6%", opacity: 0 },
        animate: { y: "0%", opacity: 1 },
        exit:    { y: "8%", opacity: 0 },
      };
    case "fade":
    default:
      return {
        initial: { opacity: 0, scale: 1.02 },
        animate: { opacity: 1, scale: 1 },
        exit:    { opacity: 0, scale: 0.98 },
      };
  }
}

export default function ScreenHost({ screen, transition, children }: Props) {
  const v = variantsFor(transition);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={screen}
          initial={v.initial}
          animate={v.animate}
          exit={v.exit}
          transition={transition === "sheet" || transition === "dismiss" ? SPRING.sheet : SPRING.page}
          style={{ position: "absolute", inset: 0, willChange: "transform, opacity" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
