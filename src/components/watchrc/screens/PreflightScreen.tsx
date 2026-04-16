"use client";

import { motion } from "motion/react";
import { IOS, FONT_STACK } from "../tokens";
import Checkmark from "../widgets/Checkmark";
import TapButton from "../widgets/TapButton";
import type { FlightApi } from "@/watchrc/useFlightState";

const CHECKS = [
  { label: "GPS lock", value: "8 sats" },
  { label: "Battery", value: "92%" },
  { label: "Signal", value: "−42 dBm" },
  { label: "Home point set", value: "42.37° N" },
];

export default function PreflightScreen({ api }: { api: FlightApi }) {
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
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 1.2, color: IOS.text4, fontWeight: 600 }}>
        PRE-FLIGHT
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Ready?</div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 9 }}>
        {CHECKS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 320, damping: 26 }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <Checkmark size={14} delay={0.12 + i * 0.12} />
            <div style={{ flex: 1, fontSize: 12, color: IOS.text }}>{c.label}</div>
            <div style={{ fontSize: 11, color: IOS.text4 }}>{c.value}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        style={{ marginTop: "auto" }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <TapButton color={IOS.blue} fullWidth onTap={() => api.navigate("hud")}>
          Arm
        </TapButton>
      </motion.div>
    </div>
  );
}
