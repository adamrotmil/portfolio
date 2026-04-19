"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { useDrag } from "@use-gesture/react";

const TRACK = 220;

/**
 * Teaches: decoupling animation progress from time. Instead of a
 * duration-driven tween, the animation's progress scalar (0..1) comes
 * directly from user input — here, horizontal drag. Every downstream
 * visual (the thumb position, the color mix, the label) reads the same
 * progress value. Scrubbing feels premium because the user *is* the
 * playhead.
 */
export default function GestureScrub() {
  const progress = useMotionValue(0.15);

  const thumbX = useTransform(progress, [0, 1], [0, TRACK]);
  const hue = useTransform(progress, [0, 1], [200, 24]);
  const label = useTransform(progress, (v) => `${Math.round(v * 100)}`);
  const bg = useTransform(hue, (h) => `hsl(${h}, 90%, 60%)`);
  const fillWidth = useTransform(progress, [0, 1], ["0%", "100%"]);

  const trackRef = useRef<HTMLDivElement>(null);

  const bind = useDrag(
    ({ event, xy: [clientX] }) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const local = Math.max(0, Math.min(rect.width, clientX - rect.left));
      progress.set(local / rect.width);
      event.preventDefault();
    },
    { filterTaps: false },
  );

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8">
      <div className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-white/45">
        Drag the thumb
      </div>

      <div className="relative w-full max-w-[240px]">
        <div
          ref={trackRef}
          {...bind()}
          className="relative h-2 cursor-pointer rounded-full bg-white/10"
          style={{ touchAction: "none" }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: fillWidth, background: bg }}
          />
          <motion.div
            style={{ x: thumbX, background: bg }}
            className="absolute -top-2 left-0 h-6 w-6 -translate-x-1/2 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.45)] ring-2 ring-white/20"
          />
        </div>
      </div>

      <motion.div className="font-serif text-4xl tabular-nums text-white/90">
        {label}
      </motion.div>
    </div>
  );
}
