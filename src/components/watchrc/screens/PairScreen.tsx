"use client";

import { motion } from "motion/react";
import { IOS, FONT_STACK } from "../tokens";
import SearchingDots from "../widgets/SearchingDots";
import TapButton from "../widgets/TapButton";
import type { FlightApi } from "@/watchrc/useFlightState";

export default function PairScreen({ api }: { api: FlightApi }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "18px 18px 14px",
        color: IOS.text,
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.2,
          color: IOS.text4,
          fontWeight: 600,
          marginTop: 2,
        }}
      >
        AERO
      </div>

      {/* Pulsing orbital ring */}
      <div style={{ marginTop: 6, position: "relative", width: 100, height: 100 }}>
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1.5px solid ${IOS.blue}`,
            opacity: 0.5,
          }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          style={{
            position: "absolute",
            inset: 12,
            borderRadius: "50%",
            border: `1.5px solid ${IOS.blue}`,
            opacity: 0.5,
          }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
        />
        <motion.div
          style={{
            position: "absolute",
            inset: 28,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${IOS.blue} 0%, #0a5ad6 100%)`,
            boxShadow: `0 0 16px ${IOS.blue}`,
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>Pairing</div>
      <SearchingDots color={IOS.text2} />

      <div style={{ fontSize: 11, color: IOS.text4, marginTop: 2 }}>Plane · 04F2</div>

      <div style={{ marginTop: "auto", width: "100%", display: "flex", justifyContent: "center" }}>
        <TapButton color={IOS.blue} fullWidth onTap={() => api.navigate("preflight")}>
          Pair
        </TapButton>
      </div>
    </div>
  );
}
