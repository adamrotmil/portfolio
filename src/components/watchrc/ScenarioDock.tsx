"use client";

import { motion } from "motion/react";
import { IOS, FONT_STACK } from "./tokens";
import { SCENARIOS } from "@/watchrc/scenarios";
import type { FlightApi } from "@/watchrc/useFlightState";

export default function ScenarioDock({ api }: { api: FlightApi }) {
  return (
    <div
      style={{
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "100%",
        maxWidth: 620,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.4,
          color: "#9e9ea3",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        SCENARIOS
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          justifyContent: "center",
        }}
      >
        {SCENARIOS.map((sc) => {
          const active = api.state.screen === sc.screen;
          return (
            <motion.button
              key={sc.id}
              onClick={() => api.runScenario(sc.id)}
              whileTap={{ scale: 0.96 }}
              animate={{
                backgroundColor: active ? IOS.blue : "#1c1c1e",
                color: active ? "#fff" : "#e5e5ea",
              }}
              transition={{ duration: 0.18 }}
              style={{
                appearance: "none",
                border: "none",
                padding: "7px 12px",
                borderRadius: 18,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: 0.1,
              }}
            >
              {sc.label}
            </motion.button>
          );
        })}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#6b6b70",
          textAlign: "center",
          marginTop: 2,
          maxWidth: 520,
          alignSelf: "center",
        }}
      >
        Or drive the watch directly: tap buttons, scroll the Digital Crown (mouse wheel or ↑/↓
        when the display is focused), press the side button for Quick Actions.
      </div>
    </div>
  );
}
