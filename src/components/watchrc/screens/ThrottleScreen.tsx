"use client";

import { motion } from "motion/react";
import { IOS, FONT_STACK } from "../tokens";
import ThrottleBar from "../widgets/ThrottleBar";
import AnimatedNumber from "../widgets/AnimatedNumber";
import TapButton from "../widgets/TapButton";
import type { FlightApi } from "@/watchrc/useFlightState";

export default function ThrottleScreen({ api }: { api: FlightApi }) {
  const { state, navigate } = api;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "16px 18px 14px",
        color: IOS.text,
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.2,
          color: IOS.text4,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        THROTTLE
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 2,
          marginTop: 10,
        }}
      >
        <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
          <AnimatedNumber value={state.throttlePct} />
        </div>
        <div style={{ fontSize: 20, color: IOS.text4, fontWeight: 500 }}>%</div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
        <ThrottleBar value={state.throttlePct} width={190} />
      </div>

      {/* Tick marks for visual texture */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: 190,
          margin: "6px auto 0",
          color: IOS.text4,
          fontSize: 9,
        }}
      >
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          color: IOS.text4,
          fontSize: 10,
          textAlign: "center",
        }}
      >
        <div style={{ color: IOS.text2 }}>Turn crown to adjust</div>
        <div>Hold side button to engage</div>
      </div>

      <motion.div
        style={{ marginTop: "auto", display: "flex", justifyContent: "center" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <TapButton
          variant="ghost"
          size="sm"
          color={IOS.text4}
          onTap={() => navigate("hud", "backward")}
        >
          Done
        </TapButton>
      </motion.div>
    </div>
  );
}
