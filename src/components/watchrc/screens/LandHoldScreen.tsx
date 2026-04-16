"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { IOS, FONT_STACK } from "../tokens";
import HoldRing from "../widgets/HoldRing";
import type { FlightApi } from "@/watchrc/useFlightState";

const HOLD_DURATION_MS = 1600;
const RELEASE_DECAY_MS = 420;

export default function LandHoldScreen({ api }: { api: FlightApi }) {
  // All hold-to-confirm state is purely local UI animation — not in the
  // reducer, so RAF updates don't cascade through the rest of the app.
  const [pressed, setPressed] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [progress, setProgress] = useState(0);

  // We keep the "live" progress in a ref so the RAF loop never has to read
  // state; we only call setProgress(...) when it's time to re-render.
  const progressRef = useRef(0);
  const pressedRef = useRef(false);
  const committedRef = useRef(false);
  const apiRef = useRef(api);

  useEffect(() => { pressedRef.current = pressed; }, [pressed]);
  useEffect(() => { committedRef.current = committed; }, [committed]);
  useEffect(() => { apiRef.current = api; }, [api]);

  // One long-lived RAF loop that runs only while there is progress to animate.
  useEffect(() => {
    let raf: number | null = null;
    let last = performance.now();

    const step = (now: number) => {
      const dt = now - last;
      last = now;

      const prev = progressRef.current;
      const next = pressedRef.current
        ? Math.min(1, prev + dt / HOLD_DURATION_MS)
        : Math.max(0, prev - dt / RELEASE_DECAY_MS);
      progressRef.current = next;

      if (next !== prev) setProgress(next);

      if (next >= 1 && !committedRef.current) {
        committedRef.current = true;
        setCommitted(true);
        window.setTimeout(() => {
          apiRef.current.patch({ landing: true });
          apiRef.current.navigate("postflight");
        }, 420);
        raf = null;
        return;
      }

      const keepGoing =
        (pressedRef.current && next < 1) ||
        (!pressedRef.current && next > 0);
      raf = keepGoing ? requestAnimationFrame(step) : null;
    };

    const ensureRunning = () => {
      if (raf == null) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };

    // Kick the loop whenever pressed changes
    ensureRunning();

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      raf = null;
    };
  }, [pressed]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "14px 16px",
        background:
          "linear-gradient(180deg, rgba(18,18,22,0.98) 0%, rgba(6,6,8,1) 100%)",
        color: IOS.text,
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Grabber */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, width: "100%" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: IOS.fill3 }} />
      </div>

      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.2,
          color: IOS.text4,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        LAND
      </div>

      <div
        onPointerDown={(e) => {
          if (committed) return;
          e.preventDefault();
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          setPressed(true);
        }}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          marginTop: 6,
          touchAction: "none",
          userSelect: "none",
          cursor: committed ? "default" : "pointer",
        }}
      >
        <HoldRing
          size={112}
          stroke={6}
          color={committed ? IOS.green : IOS.orange}
          progress={progress}
          pressed={pressed && !committed}
        >
          <AnimatePresence mode="wait">
            {committed ? (
              <motion.div
                key="done"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                style={{ color: IOS.green, fontWeight: 700, fontSize: 13 }}
              >
                Landing…
              </motion.div>
            ) : (
              <motion.div
                key="hold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center" }}
              >
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {pressed ? "Holding…" : "Hold"}
                </div>
                <div style={{ fontSize: 10, color: IOS.text4, marginTop: 1 }}>
                  {pressed ? "keep holding" : "to confirm"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </HoldRing>
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 10,
          color: IOS.text4,
          textAlign: "center",
          width: "100%",
        }}
      >
        {pressed
          ? "Release to cancel"
          : "Tap and hold to land now. Release to cancel."}
      </div>
    </div>
  );
}
