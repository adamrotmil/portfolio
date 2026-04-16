"use client";

import { motion } from "motion/react";
import { IOS, FONT_STACK } from "../tokens";
import type { FlightApi } from "@/watchrc/useFlightState";

interface Action {
  label: string;
  bg: string;
  fg: string;
  onTap: (api: FlightApi) => void;
}

const ACTIONS: Action[] = [
  {
    label: "Return Home",
    bg: IOS.orange,
    fg: "#000",
    onTap: (api) => {
      api.patch({ mode: "rth" });
      api.navigate("hud", "dismiss");
    },
  },
  {
    label: "Land",
    bg: "#2C2C2E",
    fg: IOS.text,
    onTap: (api) => api.navigate("land"),
  },
  {
    label: "Circle",
    bg: "#2C2C2E",
    fg: IOS.text,
    onTap: (api) => {
      api.patch({ mode: "circle" });
      api.navigate("hud", "dismiss");
    },
  },
  {
    label: "Manual",
    bg: "#2C2C2E",
    fg: IOS.text,
    onTap: (api) => {
      api.patch({ mode: "manual" });
      api.navigate("throttle");
    },
  },
];

export default function QuickActionsScreen({ api }: { api: FlightApi }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "14px 14px 12px",
        background:
          "linear-gradient(180deg, rgba(18,18,22,0.98) 0%, rgba(6,6,8,1) 100%)",
        color: IOS.text,
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Grabber */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: IOS.fill3 }} />
      </div>

      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.2,
          color: IOS.text4,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        ACTIONS
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ACTIONS.map((a, i) => (
          <motion.button
            key={a.label}
            onClick={() => a.onTap(api)}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.06 + i * 0.05,
              type: "spring",
              stiffness: 380,
              damping: 30,
            }}
            style={{
              appearance: "none",
              border: "none",
              padding: "11px 14px",
              borderRadius: 14,
              background: a.bg,
              color: a.fg,
              fontSize: 13,
              fontWeight: 600,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            {a.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
