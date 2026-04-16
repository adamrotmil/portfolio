"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { IOS, WATCH, SPRING } from "./tokens";

interface Props {
  children: ReactNode;
  onCrownDelta?: (delta: number) => void;
  onCrownTap?: () => void;
  onSideTap?: () => void;
  sideActive?: boolean;
}

// The physical watch: aluminum body, glass display, Digital Crown, side button.
// Crown spins visually when rotated (we fake rotation via scroll/drag).
export default function Watch({
  children,
  onCrownDelta,
  onCrownTap,
  onSideTap,
  sideActive = false,
}: Props) {
  const outerW = WATCH.displayW + WATCH.bezel * 2 + WATCH.chassisExtraX * 2;
  const outerH = WATCH.displayH + WATCH.bezel * 2 + WATCH.chassisExtraY * 2;

  const displayRef = useRef<HTMLDivElement | null>(null);
  const [crownRotation, setCrownRotation] = useState(0);
  const crownAnimRef = useRef<number | null>(null);

  // Scroll on the display is interpreted as Crown rotation
  useEffect(() => {
    const el = displayRef.current;
    if (!el || !onCrownDelta) return;
    const onWheel = (e: WheelEvent) => {
      // Invert so scrolling "up" = crown "up" = increase
      const dy = -e.deltaY;
      if (Math.abs(dy) < 0.5) return;
      e.preventDefault();
      // Map to crown visual rotation (a bit of momentum)
      setCrownRotation((r) => r - dy * 0.4);
      onCrownDelta(dy * 0.15);
      if (crownAnimRef.current) window.clearTimeout(crownAnimRef.current);
      crownAnimRef.current = window.setTimeout(() => setCrownRotation(0), 260);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onCrownDelta]);

  // Keyboard: Up/Down arrow also drive the crown when display is focused
  const onDisplayKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (!onCrownDelta) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        onCrownDelta(3);
        setCrownRotation((r) => r - 18);
        window.setTimeout(() => setCrownRotation(0), 260);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onCrownDelta(-3);
        setCrownRotation((r) => r + 18);
        window.setTimeout(() => setCrownRotation(0), 260);
      }
    },
    [onCrownDelta],
  );

  return (
    <div
      style={{
        position: "relative",
        width: outerW + 18, // room for the crown/button sticking out
        height: outerH,
      }}
    >
      {/* Outer body (aluminum/titanium feel) */}
      <motion.div
        style={{
          width: outerW,
          height: outerH,
          borderRadius: WATCH.chassisRadius,
          background:
            "linear-gradient(145deg, #2b2b2e 0%, #1a1a1c 40%, #0f0f11 100%)",
          boxShadow:
            "0 30px 60px -20px rgba(0,0,0,0.6), 0 10px 25px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Inner thin bezel + display */}
        <div
          style={{
            position: "absolute",
            inset: WATCH.chassisExtraY + WATCH.bezel,
            borderRadius: WATCH.displayRadius,
            background: IOS.bg,
            // Slight glossy top highlight
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.6)",
          }}
        >
          <div
            ref={displayRef}
            tabIndex={0}
            onKeyDown={onDisplayKey}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: WATCH.displayRadius,
              overflow: "hidden",
              outline: "none",
            }}
          >
            {children}
          </div>
        </div>
      </motion.div>

      {/* Digital Crown */}
      <motion.button
        aria-label="Digital Crown"
        onClick={() => onCrownTap?.()}
        whileTap={{ scale: 0.94 }}
        transition={SPRING.tap}
        style={{
          position: "absolute",
          right: 0,
          top: outerH * 0.32,
          width: 16,
          height: 32,
          border: "none",
          borderRadius: 6,
          padding: 0,
          cursor: "pointer",
          background:
            "linear-gradient(90deg, #3a3a3e 0%, #2a2a2e 50%, #1a1a1c 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Ridges — fake by motion.div rotating */}
        <motion.div
          animate={{ rotate: crownRotation }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 3px)",
          }}
        />
      </motion.button>

      {/* Side button */}
      <motion.button
        aria-label="Side button"
        onClick={() => onSideTap?.()}
        whileTap={{ scale: 0.92 }}
        animate={sideActive ? { backgroundColor: "#4a4a4e" } : { backgroundColor: "#2a2a2e" }}
        transition={SPRING.tap}
        style={{
          position: "absolute",
          right: 1,
          top: outerH * 0.55,
          width: 14,
          height: 24,
          border: "none",
          borderRadius: 4,
          padding: 0,
          cursor: "pointer",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}
