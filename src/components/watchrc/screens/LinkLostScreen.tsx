"use client";

import { motion } from "motion/react";
import { IOS, FONT_STACK } from "../tokens";
import TapButton from "../widgets/TapButton";
import type { FlightApi } from "@/watchrc/useFlightState";

export default function LinkLostScreen({ api }: { api: FlightApi }) {
  const { state } = api;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "16px 16px 14px",
        color: IOS.text,
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Pulsing red top bar */}
      <motion.div
        style={{
          width: "100%",
          height: 5,
          borderRadius: 3,
          background: IOS.red,
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Warning icon */}
      <motion.div
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          background: IOS.redSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 18,
          position: "relative",
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3 L22 20 L2 20 Z"
            stroke={IOS.red}
            strokeWidth="2.2"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="11" y="10" width="2" height="5" rx="1" fill={IOS.red} />
          <rect x="11" y="16.5" width="2" height="2" rx="1" fill={IOS.red} />
        </svg>
      </motion.div>

      <div style={{ fontSize: 16, fontWeight: 700, color: IOS.red, letterSpacing: 0.4, marginTop: 10 }}>
        LINK LOST
      </div>

      <div style={{ fontSize: 13, color: IOS.text, marginTop: 6 }}>
        Auto-RTH in{" "}
        <motion.span
          key={state.linkLostCountdown ?? "idle"}
          initial={{ scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          style={{ display: "inline-block", fontWeight: 700, color: IOS.red }}
        >
          {state.linkLostCountdown ?? 0}
        </motion.span>
      </div>

      <div style={{ fontSize: 10, color: IOS.text4, marginTop: 4, textAlign: "center" }}>
        Plane returning home on last known heading
      </div>

      <div style={{ marginTop: "auto", width: "100%" }}>
        <TapButton
          color={IOS.red}
          fullWidth
          onTap={() => {
            api.patch({ signal: 3, linkLostCountdown: null });
            api.navigate("hud", "fade");
          }}
        >
          Override
        </TapButton>
      </div>
    </div>
  );
}
