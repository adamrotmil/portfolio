"use client";

import { motion } from "motion/react";
import { IOS, FONT_STACK } from "../tokens";
import SignalBars from "../widgets/SignalBars";
import ModePill from "../widgets/ModePill";
import AnimatedNumber from "../widgets/AnimatedNumber";
import type { FlightApi } from "@/watchrc/useFlightState";

export default function HudScreen({ api }: { api: FlightApi }) {
  const { state, navigate } = api;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "14px 16px 14px",
        color: IOS.text,
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Top status row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: IOS.text2 }}>
          <AnimatedNumber value={state.battery} />
          %
        </div>
        <SignalBars strength={state.signal} size={14} />
      </div>

      {/* Big altitude */}
      <motion.div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 4,
          marginTop: 22,
        }}
      >
        <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>
          <AnimatedNumber value={state.altitudeFt} />
        </div>
        <div style={{ fontSize: 15, color: IOS.text4, fontWeight: 500 }}>ft</div>
      </motion.div>

      {/* Speed + heading */}
      <div style={{ textAlign: "center", color: IOS.text4, fontSize: 12, marginTop: 4 }}>
        <AnimatedNumber value={state.speedMph} /> mph  ·  HDG{" "}
        <AnimatedNumber value={state.headingDeg} />°
      </div>

      {/* Mode pill */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <motion.div
          onClick={() => navigate("throttle")}
          whileTap={{ scale: 0.94 }}
          style={{ cursor: "pointer" }}
        >
          <ModePill mode={state.mode} />
        </motion.div>
      </div>

      {/* Map placeholder */}
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "center" }}>
        <motion.div
          onClick={() => navigate("actions")}
          whileTap={{ scale: 0.97 }}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 10,
            background: "linear-gradient(180deg, #1a2230 0%, #0c1018 100%)",
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          {/* Grid hint */}
          <svg width="100%" height="100%" viewBox="0 0 200 48" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mapg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#1a2230" />
                <stop offset="1" stopColor="#0c1018" />
              </linearGradient>
            </defs>
            <rect width="200" height="48" fill="url(#mapg)" />
            {[20, 50, 80, 110, 140, 170].map((x) => (
              <line key={x} x1={x} x2={x} y1="0" y2="48" stroke="#243040" strokeWidth="0.5" />
            ))}
            {[12, 24, 36].map((y) => (
              <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="#243040" strokeWidth="0.5" />
            ))}
            {/* Plane glyph drifting */}
            <motion.circle
              cx={100}
              cy={24}
              r={3.5}
              fill={IOS.blue}
              animate={{ x: [-10, 10, -10], y: [-2, 2, -2] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx={100}
              cy={24}
              r={10}
              fill="none"
              stroke={IOS.blue}
              strokeWidth={0.6}
              animate={{ opacity: [0.4, 0, 0.4], scale: [0.8, 1.6, 0.8] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              style={{ transformOrigin: "100px 24px" }}
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
