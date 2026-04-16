"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { IOS, FONT_STACK } from "../tokens";
import TapButton from "../widgets/TapButton";
import Checkmark from "../widgets/Checkmark";
import type { FlightApi } from "@/watchrc/useFlightState";

export default function PostFlightScreen({ api }: { api: FlightApi }) {
  const { state } = api;
  const [saved, setSaved] = useState(false);

  const stats = [
    { label: "Battery used", value: `${state.post.batteryUsed}%` },
    { label: "Distance",     value: `${state.post.distanceMi} mi` },
    { label: "Max altitude", value: `${state.post.maxAltFt} ft` },
  ];

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
        FLIGHT LOG
      </div>

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 4,
          marginTop: 14,
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>
          {state.post.duration}
        </div>
      </motion.div>
      <div style={{ textAlign: "center", fontSize: 11, color: IOS.text4, marginTop: 2 }}>
        duration
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.25 + i * 0.08,
              type: "spring",
              stiffness: 300,
              damping: 26,
            }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11,
            }}
          >
            <span style={{ color: IOS.text4 }}>{s.label}</span>
            <span style={{ color: IOS.text, fontWeight: 600 }}>{s.value}</span>
          </motion.div>
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        <TapButton
          color={saved ? IOS.green : IOS.fill3}
          textColor={IOS.text}
          fullWidth
          onTap={() => setSaved(true)}
        >
          {saved ? (
            <>
              <Checkmark size={12} />
              <span style={{ marginLeft: 4 }}>Saved</span>
            </>
          ) : (
            "Save log"
          )}
        </TapButton>
      </div>
    </div>
  );
}
