"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { INITIAL_STATE, reducer } from "./state";
import type { FlightState, Screen, TransitionKind } from "./types";
import { SCENARIOS, type Scenario } from "./scenarios";

export interface FlightApi {
  state: FlightState;
  navigate: (to: Screen, transition?: TransitionKind) => void;
  patch: (p: Partial<FlightState>) => void;
  runScenario: (id: Scenario["id"]) => void;
  reset: () => void;
}

export function useFlightState(): FlightApi {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Background tick — drives gentle ambient drift on HUD telemetry and
  // the link-lost countdown. Runs at 1Hz; the HUD numbers spring-animate
  // to their new values via motion.
  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(id);
  }, []);

  const navigate = useCallback(
    (to: Screen, transition?: TransitionKind) =>
      dispatch({ type: "navigate", to, transition }),
    [],
  );
  const patch = useCallback((p: Partial<FlightState>) => dispatch({ type: "set", patch: p }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  const runScenario = useCallback(
    (id: Scenario["id"]) => {
      const sc = SCENARIOS.find((x) => x.id === id);
      if (!sc) return;
      const patchToApply = sc.apply(stateRef.current);
      dispatch({ type: "set", patch: patchToApply });
      dispatch({ type: "navigate", to: sc.screen });
    },
    [],
  );

  return useMemo(
    () => ({ state, navigate, patch, runScenario, reset }),
    [state, navigate, patch, runScenario, reset],
  );
}
